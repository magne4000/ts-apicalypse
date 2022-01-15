import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';
import { Builder, BuilderOperator, BuilderOperatorNarrow, Executor, Stringifiable } from "./types";
import { toStringSingle } from "./builder";

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
        return apicalypse<A>(builder).execute(url);
      }
    }
  }

  return {
    pipe,
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
