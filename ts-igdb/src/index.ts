import type { Builder, Options, Stringifiable } from "ts-apicalypse";
import apicalypse from "ts-apicalypse";
import type { ExecutorMulti, IgdbRequest, Routes } from "./types";

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

export function request<K extends keyof Routes>(key: K): IgdbRequest<K> {
  const x = apicalypse.request<Routes[K]>();

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

export function multi<B extends Builder<any>[]>(...builders: B): Stringifiable & ExecutorMulti<B> {
  const ex = apicalypse.multi(...builders);
  return {
    ...ex,
    execute(options: Options = {}) {
      return ex.execute.bind(ex)(BASE_URL_MULTI, options);
    }
  }
}

const x = multi(request('platforms').alias('b').pipe());
