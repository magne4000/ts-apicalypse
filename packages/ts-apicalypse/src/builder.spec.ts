import { exclude, fields, limit, multi, offset, pipe, query, search, sort, where, whereIn } from "./builder";
import { BuilderOperator, WhereFlags, WhereInFlags } from "./types";

function testOp<T = any>(...opd: BuilderOperator<T>[]) {
  return pipe<T>(...opd).toApicalypseString();
}

describe('operators', function () {
  test('fields', function () {
    expect(testOp(fields(['a', 'b', 'c']))).toEqual('fields a,b,c;');

    // TS

    expect(testOp<{ a: 1, b: 1, c: 1 }>(fields(['a', 'b', 'c']))).toEqual('fields a,b,c;');
    expect(testOp<{ a: 1, b: 1, c: 1 }>(fields('*'))).toEqual('fields *;');
    expect(
      testOp<{ a: 1, b: 1, c: 1 }>(
        // @ts-expect-error
        fields(['d'])
      )
    ).toEqual('fields d;');
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

    // TODO add where combination tests
    expect(testOp<{a: '1' | '2', b: number}>(where('a', '=', '1'), where('b', '=', 2))).toEqual('where a = "1" & b = 2;');
    expect(
      testOp<{a: '1' | '2', b: number}>(
        where('a', '=', '1'),
        // @ts-expect-error
        where('b', '=', '2', WhereFlags.NUMBER)
      )
    ).toEqual('where a = "1" & b = 2;');
  });

  test('whereIn', function () {
    expect(testOp(whereIn('a', [1,2]))).toEqual('where a = (1,2);');

    // TS

    expect(
      testOp<{a: '1' | '2', b: number}>(
        whereIn('a', ['1', '2'], WhereFlags.STRING | WhereInFlags.AND),
        whereIn('b', [2, 4], WhereInFlags.EXACT)
      )
    ).toEqual('where a = ["1","2"] & b = {2,4};');
    testOp<{a: '1' | '2', b: number}>(
      // @ts-expect-error
      whereIn('a', [1, '2']),
      // @ts-expect-error
      whereIn('a', ['3']),
    );
  });
});

describe('multi', function () {
  test('build a valid query', function () {
    const now = new Date().getTime();
    const test = multi(
      pipe(
        query("games", "latest-games"),
        fields(["name"]),
        sort("created_at", "desc"),
        where("created_at", "<",  now),
      ),
      pipe(
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
      pipe(
        query("games", "latest-games"),
        fields(["name"]),
        sort("created_at", "desc"),
        where("created_at", "<",  now),
      ),
      pipe(
        query("games", "coming-soon"),
        fields(["name"]),
        sort("created_at", "asc"),
        where("created_at", ">",  now),
      )
    )
  });
});
