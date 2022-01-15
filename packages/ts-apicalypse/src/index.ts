import axios, { AxiosRequestConfig } from 'axios';
import { Builder, BuilderOperator, Executor, Stringifiable } from "./types";
import { toStringSingle } from "./builder";

interface Options extends AxiosRequestConfig {
  queryMethod?: 'url' | 'body',
}

export function apicalypse(builder: Stringifiable, options: Options = {}) {

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
    execute(url: string) {
      return axios.create()(getAxiosRequestConfig(url));
    }
  }
}

export function request<T>(url?: string) {
  function pipe(): Executor<T>;
  function pipe<A>(
    fn1: BuilderOperator<T, A>,
  ): Executor<A>;
  function pipe<A, B>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
  ): Executor<B extends T ? A extends T ? T : A : B>;
  function pipe<A, B, C>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>
  ): Executor<C extends T ? B extends T ? A extends T ? T : A : B : C>;
  function pipe<A, B, C, D>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>
  ): Executor<D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D>;
  function pipe<A, B, C, D, E>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>
  ): Executor<E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E>;
  function pipe<A, B, C, D, E, F>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>,
    fn6: BuilderOperator<T, F>
  ): Executor<F extends T ? E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E : F>;
  function pipe<A, B, C, D, E, F, G>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>,
    fn6: BuilderOperator<T, F>,
    fn7: BuilderOperator<T, G>
  ): Executor<G extends T ? F extends T ? E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E : F : G>;
  function pipe<A, B, C, D, E, F, G, H>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>,
    fn6: BuilderOperator<T, F>,
    fn7: BuilderOperator<T, G>,
    fn8: BuilderOperator<T, H>
  ): Executor<H extends T ? G extends T ? F extends T ? E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E : F : G : H>;
  function pipe<A, B, C, D, E, F, G, H, I>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>,
    fn6: BuilderOperator<T, F>,
    fn7: BuilderOperator<T, G>,
    fn8: BuilderOperator<T, H>,
    fn9: BuilderOperator<T, H>
  ): Executor<I extends T ? H extends T ? G extends T ? F extends T ? E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E : F : G : H : I>;
  function pipe<A, B, C, D, E, F, G, H, I>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>,
    fn6: BuilderOperator<T, F>,
    fn7: BuilderOperator<T, G>,
    fn8: BuilderOperator<T, H>,
    fn9: BuilderOperator<T, H>,
    ...fns: BuilderOperator<T, any>[]
  ): Executor<unknown>;

  function pipe(...steps: BuilderOperator<T, any>[]): Executor<any> {
    const builder = steps.reduce((output, f) => f(output), newBuilder())

    return {
      execute() {
        if (!url) {
          throw new Error('endpoint url is undefined');
        }
        return apicalypse(builder).execute(url);
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
