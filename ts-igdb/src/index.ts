import type { Builder, Options, Stringifiable } from "ts-apicalypse";
import apicalypse from "ts-apicalypse";
import type { ExecutorMulti, IgdbRequest, Routes } from "./types";

const BASE_URL = 'https://api.igdb.com/v4';
const BASE_URL_MULTI = `${BASE_URL}/multiquery`;

function buildUrl(key: string) {
  return `${BASE_URL}/${key}`
}

export function request<K extends keyof Routes>(key: K): IgdbRequest<K> {
  const x = apicalypse.request();

  return {
    pipe(...steps) {
      const ex = x.pipe(...steps)

      return {
        ...ex,
        execute(options: Options = {}) {
          return ex.execute.bind(ex)(buildUrl(key), options) as any;
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
