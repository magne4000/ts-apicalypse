import { fields, limit } from "ts-apicalypse";
import type { AxiosPromise } from "axios";
import { multi, request } from "./index";
import type { A } from "ts-toolbelt";

function nocall<T extends () => AxiosPromise<R>, R>(_: T): ReturnType<T> {
  return undefined as unknown as ReturnType<T>;
}

describe('response types', function () {
  type InferResponseData<T> = T extends AxiosPromise<infer D> ? D : never;
  type AssertEqual<T, B extends AxiosPromise> = A.Is<T, A.Compute<InferResponseData<B>>, 'equals'>;

  test('games/count', async () => {
    const r1 = nocall(() => request('games').pipe(limit(2)).execute());
    const r2 = nocall(() => request('games/count').pipe().execute());
    const r3 = nocall(() => multi(request('games').alias('alias').pipe(limit(1))).execute());
    const r4 = nocall(() => multi(request('games/count').alias('alias').pipe()).execute());
    const r5 = nocall(() => request('games').pipe(
      fields(['age_ratings', 'artworks', 'created_at', 'external_games', 'first_release_date',
      'genres', 'involved_companies', 'name', 'platforms', 'release_dates', 'screenshots', 'similar_games', 'slug',
      'summary', 'tags', 'themes', 'updated_at', 'url', 'checksum']),
      limit(1)
    ).execute());

    var _: AssertEqual<{ id?: (number|null); }[], typeof r1> = 1;
    var _: AssertEqual<{ count: number }, typeof r2> = 1;
    var _: AssertEqual<{ name: 'alias', result: { id?: number|null|undefined }[] }[], typeof r3> = 1;
    var _: AssertEqual<{ name: 'alias', count: number }[], typeof r4> = 1;
    var _: AssertEqual<{
      id?: (number|null);
      age_ratings?: (number[]|null);
      artworks?: (number[]|null);
      created_at?: (number|null);
      external_games?: (number[]|null);
      first_release_date?: (number|null);
      genres?: (number[]|null);
      involved_companies?: (number[]|null);
      name?: (string|null);
      platforms?: (number[]|null);
      release_dates?: (number[]|null);
      screenshots?: (number[]|null);
      similar_games?: (number[]|null);
      slug?: (string|null);
      summary?: (string|null);
      tags?: (number[]|null);
      themes?: (number[]|null);
      updated_at?: (number|null);
      url?: (string|null);
      checksum?: (string|null);
    }[], typeof r5> = 1;

    expect(1).toBe(1);
  });
});