import { limit } from "ts-apicalypse";
import type { AxiosPromise } from "axios";
import { proto } from "../proto/compiled";
import { multi, request } from "./index";

function nocall<T extends () => AxiosPromise<R>, R>(_: T): ReturnType<T> {
  return undefined as unknown as ReturnType<T>;
}

describe('response types', function () {
  type DeepRequired<T> = {
    [K in keyof T]: Required<DeepRequired<T[K]>>
  }
  type InferResponseData<T> = T extends AxiosPromise<infer D> ? D : never;

  type AssertEqual<T extends InferResponseData<Expected>, Expected extends AxiosPromise> =
    DeepRequired<InferResponseData<Expected>> extends DeepRequired<T> ?
      DeepRequired<T> extends DeepRequired<InferResponseData<Expected>> ? true :
      InferResponseData<Expected> :
    InferResponseData<Expected>;

  test('games/count', async () => {
    const r1 = nocall(() => request('games').pipe(limit(2)).execute());
    const r2 = nocall(() => request('games/count').pipe().execute());
    const r3 = nocall(() => multi(request('games').alias('alias').pipe(limit(1))).execute());
    const r4 = nocall(() => multi(request('games/count').alias('alias').pipe()).execute());

    var _: AssertEqual<Pick<proto.IGame, 'id'>[], typeof r1> = true;
    var _: AssertEqual<{ count: number }, typeof r2> = true;
    var _: AssertEqual<{ name: 'alias', result: Pick<proto.IGame, 'id'>[] }[], typeof r3> = true;
    var _: AssertEqual<{ name: 'alias', count: number }[], typeof r4> = true;

    expect(1).toBe(1);
  });
});