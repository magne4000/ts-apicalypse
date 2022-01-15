import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';
import {
  Builder,
  BuilderOperator,
  BuilderOperatorNarrow,
  Executor, ExecutorMulti,
  ExecutorMultiMono,
  NamedBuilder,
  Stringifiable
} from "./types";
import { toStringMulti, toStringSingle } from "./builder";

interface Options extends AxiosRequestConfig {
  queryMethod?: 'url' | 'body',
}

export function apicalypse<T>(builder: Stringifiable, options: Options = {}) {

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

export function request<T>(url?: string) {
  function pipe<A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]): Executor<A> {
    const builder = steps.reduce((output, f) => f(output), newBuilder())

    return {
      execute() {
        if (!url) {
          throw new Error('endpoint url is undefined');
        }
        return apicalypse<A[]>(builder).execute(url);
      }
    }
  }

  return {
    pipe,
  }
}

export function query<T, S extends string>(queryEndpoint: string, queryName: S) {
  function pipe<A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]): NamedBuilder<A, S> {
    return steps.reduce((output, f) => f(output), newBuilder({
      queryEndpoint,
      queryName
    })) as NamedBuilder<T, S>;
  }

  return {
    pipe,
  }
}

export function multi<T extends Record<any, any>, B extends Builder<T>[]>(...builders: B): Stringifiable & ExecutorMulti<B> {
  return {
    toApicalypseString() {
      return toStringMulti(builders);
    },

    execute(url: string) {
      if (!url) {
        throw new Error('endpoint url is undefined');
      }
      return apicalypse(this).execute(url) as any;
    }
  }
}

function newBuilder<T>(copy?: Partial<Builder<T>>): Builder<T> {
  return {
    queryFields: {
      where: []
    },
    ...copy,
    toApicalypseString() {
      return toStringSingle(this);
    }
  }
}

export function isNamed<T extends NamedBuilder<any, string>, S extends string>(builder: ExecutorMultiMono<T>, name: S): builder is ExecutorMultiMono<Extract<T, NamedBuilder<any, S>>> {
  if (builder.name === name) {
    return true;
  }
  return false;
}
