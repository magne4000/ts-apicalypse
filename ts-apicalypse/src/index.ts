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
  WhereFlags,
  WhereInFlags,
  NamedBuilderOperator,
} from "./types";
export { and, exclude, fields, groupWhere, limit, offset, or, search, sort, where, whereIn } from "./builder";

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

export function request<T>() {
  function _pipe<A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]) {
    return steps.reduce((output, f) => f(output), newBuilder())
  }

  const pipe: Pipe<T> = (...steps) => {
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
    const pipe: PipeSub<T, S> = (...steps) => {
      return _pipe(query(queryEndpoint, queryName), ...steps) as NamedBuilder<T, S>;
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

export function multi<T extends Record<any, any>, B extends Builder<T>[]>(...builders: B): Stringifiable & ExecutorMulti<B> {
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

export function isNamed<T extends NamedBuilder<any, string>, S extends string>(builder: ExecutorMultiMono<T>, name: S): builder is ExecutorMultiMono<Extract<T, NamedBuilder<any, S>>> {
  if (builder.name === name) {
    return true;
  }
  return false;
}
