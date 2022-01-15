import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';
import {
  Builder,
  BuilderOperator,
  BuilderOperatorNarrow,
  Executor,
  ExecutorMulti,
  ExecutorMultiMono,
  NamedBuilder,
  NamedBuilderOperator,
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
  function pipe<A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]): Stringifiable & Executor<A> {
    const builder = steps.reduce((output, f) => f(output), newBuilder())

    return {
      execute() {
        if (!url) {
          throw new Error('endpoint url is undefined');
        }
        return apicalypse<A[]>(builder).execute(url);
      },

      toApicalypseString() {
        return toStringSingle(builder);
      }
    }
  }

  return {
    pipe,
  }
}

export function sub<T>() {
  function pipe<A, N extends string>(...steps: [NamedBuilderOperator<T, N>, ...(BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]]): NamedBuilder<A, N> {
    return steps.reduce((output, f) => f(output), newBuilder()) as NamedBuilder<A, N>;
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

export function isNamed<T extends NamedBuilder<any, string>, S extends string>(builder: ExecutorMultiMono<T>, name: S): builder is ExecutorMultiMono<Extract<T, NamedBuilder<any, S>>> {
  if (builder.name === name) {
    return true;
  }
  return false;
}
