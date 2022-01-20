import type { Builder, Options, Stringifiable } from "ts-apicalypse";
import { multi as multiA, request as requestA } from "ts-apicalypse";
import type { ExecutorMulti, IgdbRequest, InferMode, Routes } from "./types";

export type {
  Builder,
  BuilderOperator,
  BuilderOperatorNarrow,
  ExecutorMulti,
  ResultMultiMono,
  NamedBuilder,
  Options,
  Pipe,
  PipeSub,
  Stringifiable,
  Executor,
  WhereFlags,
  WhereInFlags,
  NamedBuilderOperator,
} from "ts-apicalypse";
export { and, exclude, fields, limit, offset, or, search, sort, where, whereIn } from "ts-apicalypse";

const BASE_URL = 'https://api.igdb.com/v4';
const BASE_URL_MULTI = `${BASE_URL}/multiquery`;

function buildUrl(key: string) {
  return `${BASE_URL}/${key}`
}

/**
 * Prepare a request to an IGDB endpoint.
 *
 * @example
 * ```ts
 * request('/games').pipe(
 *   fields(["name"]),
 *   sort("created_at", "asc"),
 *   where("created_at", ">",  now),
 * )
 * .execute()
 * .then(results => ...);
 * ```
 * @param key
 */
export function request<K extends keyof Routes>(key: K): IgdbRequest<K, InferMode<K>> {
  const x = requestA<Routes[K], InferMode<K>>();

  return {
    pipe(...steps) {
      const ex = x.pipe(...steps)

      return {
        ...ex,
        execute(options: Options = {}) {
          return ex.execute.bind(ex)(buildUrl(key), options);
        }
      }
    },
    alias(alias) {
      return x.sub(key, alias);
    },
  }
}

/**
 * Prepare a multi-query request to an IGDB endpoint.
 *
 * @example
 * ```ts
 * multi(
 *   request('/games')
 *     .alias('alias') // mandatory for multi requests
 *     .pipe(
 *       fields(["name"]),
 *       sort("created_at", "asc"),
 *       where("created_at", ">",  now),
 *     ),
 *   request('/games')
 *     .alias('alias2') // mandatory for multi requests
 *     .pipe(
 *       fields(["name"]),
 *       sort("created_at", "asc"),
 *       where("created_at", "<",  now),
 *     )
 * )
 * .execute()
 * .then(response => ...);
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#multi-query}
 * @param builders
 */
export function multi<B extends Builder<any>[]>(...builders: B): Stringifiable & ExecutorMulti<B> {
  const ex = multiA(...builders);
  return {
    ...ex,
    execute(options: Options = {}) {
      return ex.execute.bind(ex)(BASE_URL_MULTI, options);
    }
  }
}
