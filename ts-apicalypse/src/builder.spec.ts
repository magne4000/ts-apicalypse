import { and, exclude, fields, limit, offset, or, search, sort, where, whereIn } from "./builder";
import { AutoPath, BuilderOperator, DeepPick, WhereFlags, WhereInFlags } from "./types";
import { isNamed, multi, request } from "./index";
import type { AxiosPromise } from "axios";
import type { proto } from "../test-data/compiled";
import { A } from "ts-toolbelt";

function testOp<T extends Record<any, any> = any>(...opd: BuilderOperator<T, T>[]) {
  return request<T>().pipe(...opd).toApicalypseString();
}

function nocall<T extends () => any>(_: T): ReturnType<T> {
  return undefined as unknown as ReturnType<T>;
}

type InferBuilder<X> = X extends AxiosPromise<infer A> ? A : never;

describe('operators', function () {
  test('fields', function () {
    expect(testOp(fields(['a', 'b', 'c']))).toEqual('fields a,b,c;');

    // TS

    expect(
      testOp<{ id: number, a: 1, b: 1, c: 1, d: { id: number, e: 1, f: 1 } }>(
        fields(['a', 'b', 'c', 'd.*', 'd.f'])
      )
    ).toEqual('fields a,b,c,d.*,d.f;');
    expect(
      testOp<{ id: number, a: 1, b: 1, c: 1 }>(
        fields('*')
      )
    ).toEqual('fields *;');

    request<{ id: number, a: 1, b: 1, c: 1, d: { id: number, e: 1, f: 1 } }>().pipe(
      // @ts-expect-error
      fields(['e']),
      // @ts-expect-error
      fields(['d.x']),
    );



    const x = nocall(() => request<{ id: number, a: 1, b: 1, c: 1 }>().pipe(
      sort('c'),
      fields(['a', 'b']),
      sort('c')
    ).execute(''));

    // no error
    const _x1: InferBuilder<typeof x> = [{ id: 1, a: 1, b: 1 }];
    const _x2: InferBuilder<typeof x> = [{
      id: 1,
      a: 1,
      b: 1,
      // @ts-expect-error object may only specify known properties
      c: 1
    }];

    const y = nocall(() => request<{ id: number, a: 1, b: 1, c: 1 }>().pipe(
      sort('c')
    ).execute(''));
    // no error
    const _y1: InferBuilder<typeof y> = [{ id: 1 }];

    const z = nocall(() => request<{ id: number, a: 1, b: 1, c: 1 }, 'count'>().pipe().execute(''));
    // no error
    const _z1: InferBuilder<typeof z> = { count: 1 };
    // @ts-expect-error
    const _z2: InferBuilder<typeof z> = { id: 1 };
  });

  test('exclude', function () {
    expect(
      testOp<{ id: number, a: 1, b: 1, c: 1, d: { e: 1, f: 1 } }>(
        fields('*'),
        exclude(['a', 'b', 'c'])
      )
    ).toEqual('fields *;exclude a,b,c;');

    // TS

    const y = nocall(() => request<{ id: number, a: 1, b: 1, c: 1 }>().pipe(
      fields('*'),
      exclude(['b', 'c'])
    ).execute(''))
    // no error
    const _y1: InferBuilder<typeof y> = [{ id: 1, a: 1 }];
    const _y2: InferBuilder<typeof y> = [{
      id: 1,
      // @ts-expect-error object may only specify known properties
      b: 1
    }];
  });

  test('limit & offest', function () {
    expect(testOp(limit(10), offset(10))).toEqual('limit 10;offset 10;');
  });

  test('sort', function () {
    expect(testOp(sort("name", "desc"))).toEqual('sort name desc;');
    expect(testOp(sort("name"))).toEqual('sort name asc;');

    // TS

    expect(testOp<{ id: number, name: string }>(sort("name"))).toEqual('sort name asc;');
    expect(
      testOp<{ id: number, name: string }>(
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
      testOp<{ id: number, a: '1' | '2', b: number }>(
        and(
          where('a', '=', '1'),
          where('b', '=', 2),
        )
      )
    ).toEqual('where (a = "1" & b = 2);');

    expect(
      testOp<{ id: number, a: '1' | '2', b: number }>(
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
    testOp<{ id: number, a: '1' | '2', b: number, c: boolean }>(
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
    );

    // nested
    testOp<{ id: number, a: '1' | '2', b: number, c: { id: number; d: { id: number; e: boolean, f: string }} }>(
      or(
        where('c.d.e', '=', true),
        where('c.d.f', '~', 'test'),
        where(
          // @ts-expect-error invalid *
          'c.d.*',
          '~',
          'test'
        ),
        where(
          // @ts-expect-error invalid property
          'c.d.a',
          '~',
          'test'
        )
      )
    );
  });

  test('whereIn', function () {
    expect(testOp(whereIn('a', [1,2]))).toEqual('where a = (1,2);');

    // TS

    expect(
      testOp<{ id: number, a: '1' | '2', b: number }>(
        and(
          whereIn('a', ['1', '2'], WhereFlags.STRING | WhereInFlags.AND),
          whereIn('b', [2, 4], WhereInFlags.EXACT),
        )
      )
    ).toEqual('where (a = ["1","2"] & b = {2,4});');
    testOp<{ id: number, a: '1' | '2', b: number }>(
      // @ts-expect-error
      whereIn('a', [1, '2']),
      // @ts-expect-error
      whereIn('a', ['3']),
    );

    // nested
    testOp<{ id: number, a: '1' | '2', b: number, c: { id: number; d: { id: number; e: boolean, f: string }} }>(
      or(
        whereIn('c.d.e', [true]),
        whereIn('c.d.f', ['test', 'test2']),
      )
    );
  });

  test('complex where', function () {
    expect(
      testOp<{ id: number, a: '1' | '2', b: number }>(
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
      request().sub("games", "latest-games").pipe(
        fields(["name"]),
        sort("created_at", "desc"),
        where("created_at", "<",  now),
      ),
      request().sub("games", "coming-soon").pipe(
        fields(["name"]),
        sort("created_at", "asc"),
        where("created_at", ">",  now),
      )
    ).toApicalypseString();

    expect(test).toEqual(
      `query games "latest-games" { fields name;sort created_at desc;where created_at < ${now}; };query games "coming-soon" { fields name;sort created_at asc;where created_at > ${now}; };`
    );

    // TS

    const x = multi(
      request<{
        id: number,
        name: string,
        created_at: number
      }>().sub("games", "latest-games").pipe(
        fields(["name", "created_at"]),
        sort("created_at", "desc"),
        where("created_at", "<",  now),
      ),
      request<{
        id: number,
        name: string,
        created_at: number
      }>().sub("games", "coming-soon").pipe(
        fields(["name"]),
        sort("created_at", "asc"),
        where("created_at", ">",  now),
      ),
      request<{
        id: number,
        name: string,
        created_at: number
      }, 'count'>().sub("games", "nb").pipe()
    );

    nocall(() => {
      x.execute('').then(y => {
        const h = y.data[0];
        if (isNamed(h, 'latest-games')) {
          h.result[0].name
          h.result[0].created_at
        } else if (isNamed(h, 'nb')) {
          h.count
          // @ts-expect-error no result
          h.result
        } else if (isNamed(h, 'coming-soon')) {
          h.result[0].name
          // @ts-expect-error created_at is not available
          h.result[0].created_at
          // @ts-expect-error no count
          h.count
        }
      })
    });
  });
});

describe.skip('types only', () => {
  type DEMO = { id: number, a: 1, b: 3, c: { id: number, d: 3 }[], e: DEMO };
  type DEMO2 = { id?: number|null, a?: 1|null, b?: 3|null, c?: { id?: number|null, d?: 3|null }[]|null, e?: DEMO2|null };
  type DEMO3 = { id?: number|null, a?: 1|null, b?: 3|null, c?: { id?: number|null, d?: string|null }[]|null };

  var _: A.Is<{ id: number, a: 1 }, DeepPick<DEMO, 'a'>, 'equals'> = 1;
  var _: A.Is<{ id: number, a: 1, b: 3 }, DeepPick<DEMO, 'a' | 'b'>, 'equals'> = 1;
  var _: A.Is<{ id: number, c: { id: number, d: 3 }[] }, DeepPick<DEMO, 'c.*'>, 'equals'> = 1;
  var _: A.Is<{ id: number, a: 1, c: { id: number, d: 3 }[] }, DeepPick<DEMO, 'a' | 'c.*'>, 'equals'> = 1;
  var _: A.Is<{ id: number, c: number[] }, DeepPick<DEMO, 'c'>, 'equals'> = 1;
  var _: A.Is<{ id: number, a: 1, c: number[] }, DeepPick<DEMO, 'a' | 'c'>, 'equals'> = 1;
  var _: A.Is<{ id: number, e: { id: number, a: 1, b: 3, c: number[], e: number } }, DeepPick<DEMO, 'e.*'>, 'equals'> = 1;
  var _: A.Is<{ id: number, a: 1, e: { id: number, a: 1, b: 3, c: number[], e: number } }, DeepPick<DEMO, 'a' | 'e.*'>, 'equals'> = 1;
  var _: A.Is<{ id: number, e: number }, DeepPick<DEMO, 'e'>, 'equals'> = 1;
  var _: A.Is<{ id: number, a: 1, e: number }, DeepPick<DEMO, 'a' | 'e'>, 'equals'> = 1;
  var _: A.Is<{ id: number, a: 1, b: 3, c: number[], e: number }, DeepPick<DEMO, '*'>, 'equals'> = 1;
  var _: A.Is<{ id?: number|null, a?: 1|null, b?: 3|null, c?: number[]|null, e?: number|null }, DeepPick<DEMO2, '*'>, 'equals'> = 1;
  var _: A.Is<{ id?: number|null, c?: { id?: number|null, d?: 3|null }[]|null }, DeepPick<DEMO2, 'c.*'>, 'equals'> = 1;
  var _: A.Is<{ id?: number|null, e?: { id?: number|null, a?: 1|null }|null }, DeepPick<DEMO2, 'e.a'>, 'equals'> = 1;
  var _: A.Is<{ id?: number|null, e?: { id?: number|null, c?: number[]|null }|null }, DeepPick<DEMO2, 'e.c'>, 'equals'> = 1;
  var _: A.Is<{ id?: number|null, e?: { id?: number|null, c?: { id?: number|null, d?: 3|null }[]|null }|null }, DeepPick<DEMO2, 'e.c.*'>, 'equals'> = 1;
  var _: A.Is<{ id?: number|null, e?: { id?: number|null, c?: { id?: number|null, d?: 3|null }[]|null }|null }, DeepPick<DEMO2, 'e.c.d'>, 'equals'> = 1;

  var _: A.Is<'c.d' | 'c.*', AutoPath<DEMO3, 'c.d'>, 'equals'> = 1;

  var _: A.Is<{ id: number, e: { id: number, e: number } }, DeepPick<DEMO, 'e.e'>, 'equals'> = 1;
  var _: A.Is<{ id?: number|null, e?: { id?: number|null, e?: number|null }|null }, DeepPick<DEMO2, 'e.e'>, 'equals'> = 1;

  var _: A.Is<{ id: number, e: { id: number, c: { id: number, d: 3 }[], e: { id: number, a: 1 } } }, DeepPick<DEMO, 'e.e.a' | 'e.c.d'>, 'equals'> = 1;
  var _: A.Is<{ id?: number|null, e?: { id?: number|null, c?: { id?: number|null, d?: 3|null }[]|null, e?: { id?: number|null, a?: 1|null }|null }|null }, DeepPick<DEMO2, 'e.e.a' | 'e.c.d'>, 'equals'> = 1;

  // More complex types extracted from IGDB protobuf API
  var _: A.Is<{ id?: (number|null), collection?: (number|null) }, DeepPick<proto.IGame, 'collection'>, 'equals'> = 1;
  var _: A.Is<{ id?: (number|null), collection?: (Pick<proto.ICollection, 'id' | 'name'>|null) }, DeepPick<proto.IGame, 'collection.name'>, 'equals'> = 1;
  var _: A.Is<{ id?: (number|null), collection?: {
    id?: (number|null);
    created_at?: (number|null);
    games?: (number[]|null);
    name?: (string|null);
    slug?: (string|null);
    updated_at?: (number|null);
    url?: (string|null);
    checksum?: (string|null);
  } | null }, DeepPick<proto.IGame, 'collection.*'>, 'equals'> = 1;
  var _: A.Is<
    { id?: (number|null), name?: (string|null), collection?: (Pick<proto.ICollection, 'id' | 'name'>|null), age_ratings?: (Pick<proto.ICollection, 'id' | 'checksum'>)[]|null },
    DeepPick<proto.IGame, 'name' | 'collection.name' | 'age_ratings.checksum'>,
    'equals'
  > = 1;
});
