import type { AxiosPromise, AxiosRequestConfig } from "axios";
import { A, M } from "ts-toolbelt";

export interface Options extends AxiosRequestConfig {
  queryMethod?: 'url' | 'body',
}

export interface Stringifiable {
  toApicalypseString(): string;
}

export interface Builder<T> extends Stringifiable {
  queryFields: {
    fields?: string,
    exclude?: string;
    sort?: string;
    limit?: string;
    offset?: string;
    search?: string;
    where: string[]
  };

  queryEndpoint?: string;
  queryName?: string;
}

export interface NamedBuilder<T, N extends string> extends Omit<Builder<T>, 'queryEndpoint' | 'queryName'> {
  queryEndpoint: string;
  queryName: N;
}

export interface NarrowBuilder<T> extends Builder<T> {
  __narrow: true
}

export interface CountBuilder<T> extends Builder<T> {
  __count: true
}

type PickWith<T, K extends keyof T, X> = X extends keyof T ? Pick<T, K | X> : Pick<T, K>;

export interface Pipe<T extends object, mode extends 'result' | 'count' = 'result'> {
  <A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]):
    Stringifiable & Executor<FallbackIfUnknown<A, PickWith<T, never, 'id'>>, mode>;
}

export type PipeSub<T extends object, Ret extends string, mode extends 'result' | 'count' = 'result'> = {
  <A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]):
    NamedBuilder<FallbackIfUnknown<A, PickWith<T, never, 'id'>>, Ret> & (mode extends 'count' ? CountBuilder<any> : {});
}

export interface Executor<T, mode extends 'result' | 'count' = 'result'> {
  execute(url: string, options?: Options): AxiosPromise<{
    result: T[],
    count: { count: number },
  }[mode]>
}

export type ResultMultiMono<T extends NamedBuilder<any, any>> = {
  name: T["queryName"],
} & (
  T extends CountBuilder<any> ?
  { count: number } :
  { result: T extends NamedBuilder<infer S, any> ? S[] : never }
);

export interface ExecutorMulti<T extends Builder<any>[]> {
  execute(url: string, options?: Options):
    AxiosPromise<T extends (infer S)[] ? ResultMultiMono<S extends NamedBuilder<any, any> ? S : never>[] : never>

}

export interface BuilderOperator<T, R> {
  (builder: Builder<T>): Builder<R>
}

export interface BuilderOperatorNarrow<T, R> {
  (builder: Builder<T>): NarrowBuilder<R>
}

export interface NamedBuilderOperator<T, N extends string> {
  (builder: Builder<T>): NamedBuilder<T, N>
}

export type StandardOperators = '=' | '!=';
export type StringOperators = StandardOperators | '~';
export type NumbersOperatos = StandardOperators | '>=' | '>' | '<=' | '<';
export type AllowedValues = true | false | null;

export type GetOp<T> = T extends number ? NumbersOperatos : T extends string ? StringOperators : StandardOperators;

export enum WhereFlags {
  RAW = 0x1, // x = n
  NUMBER = RAW, // x = n
  STRING = 0x2, // x = "n"
  STARTSWITH = STRING | 0x4, // x = "n"*
  ENDSWITH = STRING | 0x8, // x = *"n"
  CONTAINS = STARTSWITH | ENDSWITH, // x = *"n"*
}

export enum WhereInFlags {
  AND = 0x20, // [...]
  NAND = AND | 0x10, // ![...]
  OR = 0x40, // (...)
  NOR = OR | 0x10, // !(...)
  EXACT = 0x80, // {...}
}

export type FallbackIfUnknown<T, F> = unknown extends T ? F : T;

type MetaFlatKeyOf<T> = {
  [K in keyof T & string]:
    T[K] extends M.Primitive ? K :
    Exclude<T[K], M.Primitive> extends (Array<infer I> | infer I) ? K | `${K}.${keyof I & string}` | `${K}.*` :
    never
};
type Values<T> = T[keyof T];
export type FlatKeyOf<T> = Values<MetaFlatKeyOf<T>> & string;

export type PickFlat<T, K extends FlatKeyOf<T> | '*'> = DeepPick<T, K>

type OuterKeyCast<T, K extends string> = PickOuterKey<K> & UnionKeyOf<T>;

type UnionKeyOf<T> = T extends Array<infer T> ? keyof T : T extends infer T ? keyof T : never;

type DeepPick<T, K extends FlatKeyOf<T> | '*'> =
  T extends M.Primitive ? T :
  T extends Array<infer I> ? DeepPick<I, Extract<K, FlatKeyOf<I> | '*'>>[] :
  T extends object ?
    OuterKeyCast<T, K> extends [never] ? number :
    A.Compute<PickWith<InnerPick<T, K>, OuterKeyCast<T, K>, 'id'>> :
  never;

type InnerPick<T, K extends FlatKeyOf<T> | '*'> = {
  [key in keyof T]: DeepPick<T[key], Extract<InnerKey<Extract<key, string>, K>, UnionKeyOf<T[key]> | '*'>>;
};

type PickOuterKey<K extends string> = K extends '*' ? string : KeyHead<K>;
type KeyHead<K extends string> = K extends `${infer K}.${string}` ? K : K;

type InnerKey<key extends string, K> = [
  Extract<K, `${key}.${string}`>
] extends [`${key}.${infer K}`]
  ? K
  : never;
