import type { AxiosPromise, AxiosRequestConfig } from "axios";
import type { A, I, L, M, O, S, U } from "ts-toolbelt";

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

type OuterKeyCast<T, K extends string> = PickOuterKey<K> & UnionKeyOf<T>;

type UnionKeyOf<T> = T extends Array<infer T> ? keyof T : T extends infer T ? keyof T : never;

export type DeepPick<T, P extends string> =
  T extends M.Primitive ? T :
    T extends Array<infer I> ? DeepPick<I, P>[] :
      T extends object ?
        string extends P ? number :
          PickWith<InnerPick<T, P>, OuterKeyCast<T, P>, 'id'> :
        never;

type InnerPick<T, K extends string> = {
  [key in keyof T]: DeepPick<T[key], InnerKey<Extract<key, string>, K>>;
};

export type FlatPath<O extends any, P extends L.List<A.Key>, X = Path<O, P>> = X extends object ? number : X;

type PickOuterKey<K extends string> = K extends '*' ? string : KeyHead<K>;
type KeyHead<K extends string> = K extends `${infer K}.${string}` ? K : K;

type InnerKey<key extends string, K> = [
  Extract<K, `${key}.${string}`>
] extends [`${key}.${infer K}`]
  ? K
  : never;



// -- Custom Autopath equivalent compatible with Apicalypse syntax

type FlatKey<O, K extends keyof O> = Exclude<O[K], null | undefined> extends Array<infer I> ? I : O[K];
type Flat<O> = Exclude<O, null | undefined> extends Array<infer I> ? I : O;

type _ExcludePrimitiveKeys<O> = O extends M.Primitive ? Omit<O, keyof O> : O;

type _Path<O, P extends L.List<A.Key>, It extends I.Iteration = I.IterationOf<0>> = {
  0: _Path<Flat<A.At<_ExcludePrimitiveKeys<O>, P[I.Pos<It>]>>, P, I.Next<It>>
  1: O
}[A.Extends<I.Pos<It>, L.Length<P>>]

export type Path<O extends any, P extends L.List<A.Key>> =
  _Path<O, P> extends infer X
    ? A.Cast<X, any>
    : never

type Index = number | string;

type KeyToIndex<K extends A.Key, SP extends L.List<Index>> =
  number extends K ? L.Head<SP> : K & Index;

type MetaPath<O, D extends string, St extends string, SP extends L.List<Index> = [], P extends L.List<Index> = []> = {
  [K in keyof Required<O>]:
  | Exclude<MetaPath<FlatKey<O, K>, D, St, L.Tail<SP>, [...P, KeyToIndex<K, SP>]>, string>
  | S.Join<[...P, KeyToIndex<K, SP>], D>
  | ([St] extends [never] ? never : S.Join<[...P, St], D>);
};

type NextPath<OP> =
// the next paths after property `K` are on sub objects
// O[K] === K | {x: '${K}.x' | {y: '${K}.x.y' ...}}
// So we access O[K] then we only keep the next paths
// To do this, we can just exclude `string` out of it:
// O[K] === {x: '${K}.x' | {y: '${K}.x.y' ...}}
// To do this, we create a union of what we just got
// This will yield a union of paths and meta paths
// We exclude the next paths (meta) paths by excluding
// `object`. Then we are left with the direct next path
  U.Select<O.UnionOf<Exclude<OP, string> & {}>, string>;

type CurrentPath<OP> =
// Uses the reversed logic of NextPath to extract the
// current path from the meta paths
  U.Select<Exclude<OP, object>, string>;

type ExecPath<A, SP extends L.List<Index>, D extends string, St extends string> =
// We go in the `MetaPath` of `O` to get the prop at `SP`
// So we query what is going the `NextPath` at `O[...SP]`
  NextPath<Path<MetaPath<A, D, St, SP>, SP>>;

type HintPath<A, P extends string, SP extends L.List<Index>, Exec extends string, D extends string, St extends string> = [Exec] extends [never] // if has not found paths
  ? CurrentPath<Path<MetaPath<A, D, St, SP>, SP>> extends never // no current path
  ? ExecPath<A, L.Pop<SP>, D, St> // display previous paths
  : CurrentPath<Path<MetaPath<A, D, St, SP>, SP>> // display current path
  : Exec | P; // display current + next

type _AutoPath<A, P extends string, D extends string, St extends string, SP extends L.List<Index> = S.Split<P, D>> =
  HintPath<A, P, SP, ExecPath<A, SP, D, St>, D, St>;

export type AutoPath<O extends any, P extends string, D extends string = '.', St extends string = '*'> =
  _AutoPath<O, P, D, St>;

export type AllAutoPath<O extends object, P extends L.List<string>> = {
  [K in keyof P]: AutoPath<O, P[K] & string>
}

export type NonEmptyStringList = [string, ...string[]];

export type ChosenPaths<P extends NonEmptyStringList> = [string] extends P ? '*' : P[number];
