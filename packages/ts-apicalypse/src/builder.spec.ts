import { and, exclude, fields, limit, multi, offset, or, query, search, sort, where, whereIn } from "./builder";
import { BuilderOperator, Executor, WhereFlags, WhereInFlags } from "./types";
import { request } from "./index";

function testOp<T = any>(...opd: BuilderOperator<T, T>[]) {
  // @ts-ignore
  return request<T>().pipe(...opd).toApicalypseString();
}

describe('operators', function () {
  test('fields', function () {
    expect(testOp(fields(['a', 'b', 'c']))).toEqual('fields a,b,c;');

    // TS

    expect(
      testOp<{ a: 1, b: 1, c: 1, d: { e: 1, f: 1 } }>(
        fields(['a', 'b', 'c', 'd.*', 'd.f'])
      )
    ).toEqual('fields a,b,c,d.*,d.f;');
    expect(
      testOp<{ a: 1, b: 1, c: 1 }>(
        fields('*')
      )
    ).toEqual('fields *;');

    request<{ a: 1, b: 1, c: 1 }>().pipe(
      // @ts-expect-error
      fields(['d']),
    );

    const x = request<{ a: 1, b: 1, c: 1 }>().pipe(
      sort('c'),
      fields(['a', 'b']),
      sort('c')
    );

    type InferBuilder<X> = X extends Executor<infer A> ? A : never;
    // no error
    const y: InferBuilder<typeof x> = { a: 1, b: 1 };
    // @ts-expect-error object may only specify known properties
    const z: InferBuilder<typeof x> = { a: 1, b: 1, c: 1 };
  });

  test('exclude', function () {
    expect(testOp(exclude(['a', 'b', 'c']))).toEqual('exclude a,b,c;');
  });

  test('limit & offest', function () {
    expect(testOp(limit(10), offset(10))).toEqual('limit 10;offset 10;');
  });

  test('sort', function () {
    expect(testOp(sort("name", "desc"))).toEqual('sort name desc;');
    expect(testOp(sort("name"))).toEqual('sort name asc;');

    // TS

    expect(testOp<{ name: string }>(sort("name"))).toEqual('sort name asc;');
    expect(
      testOp<{ name: string }>(
        // @ts-expect-error
        sort("b")
      )
    ).toEqual('sort b asc;');
  });

  test('search', function () {
    expect(testOp(search("some\"thing"))).toEqual('search "some\\"thing";');
  });

  test('where', function () {
    expect(testOp(where('a', '=', '1'))).toEqual('where a = "1";');

    // TS

    expect(
      testOp<{a: '1' | '2', b: number}>(
        and(
          where('a', '=', '1'),
          where('b', '=', 2),
        )
      )
    ).toEqual('where (a = "1" & b = 2);');

    expect(
      testOp<{a: '1' | '2', b: number}>(
        or(
          where('a', '=', '1'),
          // @ts-expect-error
          where('b', '=', '2', WhereFlags.NUMBER),
          // @ts-expect-error
          where('c', '=', '2', WhereFlags.NUMBER),
        )
      )
    ).toEqual('where (a = "1" | b = 2 | c = 2);');

    // TS operators validity check
    testOp<{a: '1' | '2', b: number, c: boolean}>(
      or(
        // STRING
        where('a', '=', '1'),
        where('a', '!=', '1'),
        where('a', '~', '1'),
        // @ts-expect-error invalid operator
        where('a', '>', '1'),
        // @ts-expect-error invalid operator
        where('a', '>=', '1'),
        // @ts-expect-error invalid operator
        where('a', '<', '1'),
        // @ts-expect-error invalid operator
        where('a', '<=', '1'),

        // NUMBER
        where('b', '=', 1),
        where('b', '!=', 1),
        // @ts-expect-error invalid operator
        where('b', '~', 1),
        where('b', '>', 1),
        where('b', '>=', 1),
        where('b', '<', 1),
        where('b', '<=', 1),

        // BOOLEAN
        where('c', '=', true),
        where('c', '!=', true),
        // @ts-expect-error invalid operator
        where('c', '~', true),
        // @ts-expect-error invalid operator
        where('c', '>', true),
        // @ts-expect-error invalid operator
        where('c', '>=', true),
        // @ts-expect-error invalid operator
        where('c', '<', true),
        // @ts-expect-error invalid operator
        where('c', '<=', true),
      )
    )
  });

  test('whereIn', function () {
    expect(testOp(whereIn('a', [1,2]))).toEqual('where a = (1,2);');

    // TS

    expect(
      testOp<{a: '1' | '2', b: number}>(
        and(
          whereIn('a', ['1', '2'], WhereFlags.STRING | WhereInFlags.AND),
          whereIn('b', [2, 4], WhereInFlags.EXACT),
        )
      )
    ).toEqual('where (a = ["1","2"] & b = {2,4});');
    testOp<{a: '1' | '2', b: number}>(
      // @ts-expect-error
      whereIn('a', [1, '2']),
      // @ts-expect-error
      whereIn('a', ['3']),
    );
  });

  test('complex where', function () {
    expect(
      testOp<{a: '1' | '2', b: number}>(
        and(
          where('a', '=', '1'),
          or(
            where('b', '=', 2),
            whereIn('b', [3]),
          )
        )
      )
    ).toEqual('where (a = "1" & (b = 2 | b = (3)));');
  });
});

describe('multi', function () {
  test('build a valid query', function () {
    const now = new Date().getTime();
    const test = multi(
      request().pipe(
        query("games", "latest-games"),
        fields(["name"]),
        sort("created_at", "desc"),
        where("created_at", "<",  now),
      ),
      request().pipe(
        query("games", "coming-soon"),
        fields(["name"]),
        sort("created_at", "asc"),
        where("created_at", ">",  now),
      )
    ).toApicalypseString();

    expect(test).toEqual(
      `query games "latest-games" { fields name;sort created_at desc;where created_at < ${now}; };query games "coming-soon" { fields name;sort created_at asc;where created_at > ${now}; };`
    );

    // TS

    multi<{
      name: string,
      created_at: number
    }>(
      request<{
        name: string,
        created_at: number
      }>().pipe(
        query("games", "latest-games"),
        fields(["name", "created_at"]),
        sort("created_at", "desc"),
        where("created_at", "<",  now),
      ),
      request<{
        name: string,
        created_at: number
      }>().pipe(
        query("games", "coming-soon"),
        fields(["name"]),
        sort("created_at", "asc"),
        where("created_at", ">",  now),
      )
    )
  });
});
