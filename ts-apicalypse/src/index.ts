import axios, { AxiosPromise } from 'axios';
import type {
  Builder,
  BuilderOperator,
  BuilderOperatorNarrow,
  ExecutorMulti,
  ExecutorMultiMono,
  NamedBuilder,
  Options,
  Pipe,
  PipeSub,
  R,
  Stringifiable
} from "./types";
import { query, toStringMulti, toStringSingle } from "./builder";

export type {
  Builder,
  BuilderOperator,
  BuilderOperatorNarrow,
  ExecutorMulti,
  ExecutorMultiMono,
  NamedBuilder,
  Options,
  Pipe,
  PipeSub,
  Stringifiable,
  Executor,
  NamedBuilderOperator,
} from "./types";
export {
  WhereFlags,
  WhereInFlags,
} from "./types";
export { and, exclude, fields, limit, offset, or, search, sort, where, whereIn } from "./builder";

function apicalypse<T>(builder: Stringifiable, options: Options = {}) {

  function getAxiosRequestConfig(url: string) {
    const opts: Options = {
      queryMethod: 'body',
      ...options,
      url: url,
    };

    const raw = builder.toApicalypseString();

    if (options.queryMethod ===  'url') {
      opts.params = {
        apicalypse: encodeURIComponent(raw),
      };
    } else if (options.queryMethod ===  'body') {
      opts.data = raw;
    }

    return opts;
  }

  return {
    execute(url: string): AxiosPromise<T> {
      return axios.create()(getAxiosRequestConfig(url));
    }
  }
}

/**
 * Prepare a request to an apicalypse endpoint.
 *
 * @example
 * ```ts
 * // MyType is optional but recommended, so that results are properly typed
 * request<MyType>().pipe(
 *   fields(["name"]),
 *   sort("created_at", "asc"),
 *   where("created_at", ">",  now),
 * )
 * .execute('http:...')
 * .then(results => ...);
 * ```
 */
export function request<T extends R, mode extends 'result' | 'count' = 'result'>() {
  function _pipe<A, B>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]) {
    return steps.reduce((output, f) => f(output), newBuilder())
  }

  const pipe: Pipe<T, mode> = (...steps) => {
    const builder = _pipe(...steps);

    return {
      execute(url: string, options: Options = {}) {
        return apicalypse(builder, options).execute(url) as any;
      },

      toApicalypseString() {
        return toStringSingle(builder);
      },
    }
  }

  const sub = <S extends string>(queryEndpoint: string, queryName: S) => {
    const pipe: PipeSub<T, S, mode> = (...steps) => {
      return _pipe(query(queryEndpoint, queryName), ...steps) as any;
    };

    return {
      pipe,
    }
  }

  return {
    pipe,
    sub,
  }
}

/**
 * Prepare a multi-query request to an apicalypse endpoint.
 *
 * @example
 * ```ts
 * multi(
 *   // MyType is optional but recommended, so that results are properly typed
 *   request<MyType>()
 *     .sub('endpoint', 'alias') // mandatory for multi requests
 *     .pipe(
 *       fields(["name"]),
 *       sort("created_at", "asc"),
 *       where("created_at", ">",  now),
 *     ),
 *   request<MyType>()
 *     .sub('endpoint', 'alias2') // mandatory for multi requests
 *     .pipe(
 *       fields(["name"]),
 *       sort("created_at", "asc"),
 *       where("created_at", "<",  now),
 *     )
 * )
 * .execute('http:...')
 * .then(response => ...);
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#multi-query}
 * @param builders
 */
export function multi<T extends R, B extends Builder<T>[]>(...builders: B): Stringifiable & ExecutorMulti<B> {
  return {
    toApicalypseString() {
      return toStringMulti(builders);
    },

    execute(url: string, options: Options = {}) {
      return apicalypse(this, options).execute(url) as any;
    }
  }
}

function newBuilder<T>(): Builder<T> {
  return {
    queryFields: {
      where: []
    },
    toApicalypseString() {
      return toStringSingle(this);
    }
  }
}

/**
 * Narrow multi-query results types.
 *
 * @example
 * ```ts
 * interface MyType {
 *   name: string,
 *   created_at: number
 * }
 *
 * multi(
 *  request<MyType>().sub("games", "latest-games").pipe(
 *    fields(["name"]),
 *    sort("created_at", "desc"),
 *    where("created_at", "<",  now),
 *  ),
 *  request<MyType>().sub("games", "coming-soon").pipe(
 *    fields(["created_at"]),
 *    sort("created_at", "desc"),
 *    where("created_at", ">",  now),
 *  )
 * ).execute('http:...').then(response => {
 *   for (const result of response.data) {
 *     if (isNamed(result, 'latest-games')) {
 *       result.name // result is of type `{ name: string }`
 *     } else {
 *       result.created_at  // result is of type `{ created_at: number }`
 *     }
 *   }
 * });
 * ```
 * @param builder
 * @param name
 */
export function isNamed<T extends NamedBuilder<any, string>, S extends string>(builder: ExecutorMultiMono<T>, name: S): builder is ExecutorMultiMono<Extract<T, NamedBuilder<any, S>>> {
  if (builder.name === name) {
    return true;
  }
  return false;
}
