import { BuilderOperator, exclude, fields, limit, multi, offset, pipe, query, search, sort, where } from "./builder";

function testOp(...opd: BuilderOperator[]) {
  return pipe(...opd).toApicalypseString();
}

describe('operators', function () {
  test('fields', function () {
    expect(testOp(fields(['a', 'b', 'c']))).toEqual('fields a,b,c;');
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
  });

  test('search', function () {
    expect(testOp(search("some\"thing"))).toEqual('search "some\\"thing";');
  });

  test('where', function () {
    expect(testOp(where('a', '=', '1'))).toEqual('where a = 1;');
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
  });
});
