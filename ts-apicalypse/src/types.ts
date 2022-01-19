import type { AxiosPromise, AxiosRequestConfig } from "axios";
import { AutoPath } from "ts-toolbelt/out/Function/AutoPath";
import { Split } from "ts-toolbelt/out/String/Split";
import { Path } from "ts-toolbelt/out/Object/Path";
import { A, U } from "ts-toolbelt";

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

type PickWith<T, K extends keyof T, X> = Pick<T, K | (X extends keyof T ? X : never)>;

export interface Pipe<T extends R, mode extends 'result' | 'count' = 'result', ID extends string = 'id'> {
  <A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]):
    Stringifiable & Executor<FallbackIfUnknown<A, PickWith<T, never, ID>>, mode>;
}

export type PipeSub<T extends R, Ret extends string, mode extends 'result' | 'count' = 'result', ID extends string = 'id'> = {
  <A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]):
    NamedBuilder<FallbackIfUnknown<A, PickWith<T, never, ID>>, Ret> & (mode extends 'count' ? CountBuilder<any> : {});
}

export interface Executor<T, mode extends 'result' | 'count' = 'result'> {
  execute(url: string, options?: Options): AxiosPromise<{
    result: T[],
    count: { count: number },
  }[mode]>
}

export type ExecutorMultiMono<T extends NamedBuilder<any, any>> = {
  name: T["queryName"],
} & (
  T extends CountBuilder<any> ?
  { count: number } :
  { result: T extends NamedBuilder<infer S, any> ? S[] : never }
);

export interface ExecutorMulti<T extends Builder<any>[]> {
  execute(url: string, options?: Options):
    AxiosPromise<T extends (infer S)[] ? ExecutorMultiMono<S extends NamedBuilder<any, any> ? S : never>[] : never>

}

export interface BuilderOperator<T, R> {
  (builder: Builder<T>): Builder<R>
}

export interface BuilderOperatorNarrow<T, R> {
  (builder: Builder<T>): NarrowBuilder<R>
}

export interface BuilderOperatorCount<T> {
  (builder: Builder<T>): CountBuilder<T>
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
type ExcludeNullish<T> = Exclude<T, null | undefined>
type ExtractNullish<T> = Extract<T, null | undefined>

export type R = Record<string, any>

type MetaFlatKeyOf<T> = Required<{ [K in keyof T]: ExcludeNullish<T[K]> extends R[] ? keyof ExcludeNullish<T[K]>[number] : ExcludeNullish<T[K]> extends R ? keyof ExcludeNullish<T[K]> : false }>;
type _FlatKeyOf<T, S = MetaFlatKeyOf<T>> =
  Required<{ [K in Extract<keyof S, string>]: S[K] extends false ? K : (K | `${K}.${Extract<S[K], string>}` | `${K}.*`) }>;
export type FlatKeyOf<T, S = _FlatKeyOf<T>> = A.Compute<S[keyof S]>;
//export type FlatKeyOf<T, P extends string> = AutoPath<T, P>;

type TypeOfKey<T, K> = T extends number[] ? T : T extends (infer A)[] ? K extends keyof A ? ExcludeNullish<A[K]>[] : never : K extends keyof T ? ExcludeNullish<T[K]> : never;

type _PickAndCastByValue<Base, Condition, Key> = {
  [K in keyof Base]: ExcludeNullish<Base[K]> extends Condition ? TypeOfKey<Base[K], Key> | ExtractNullish<Base[K]> : false
};
type ExcludeFalseProps<T> =
  { [K in keyof T]: Required<T>[K] extends false ? never : K }[keyof T]
export type PickAndCastByValue<Base, Condition, Key, S = _PickAndCastByValue<Base, Condition, Key>> = Pick<S, ExcludeFalseProps<S>>;

type OmitByValue<Base, Condition> = Pick<Base, {
  [Key in keyof Base]: ExcludeNullish<Base[Key]> extends Condition ? never : Key
}[keyof Base]>;

export type PickByValue<Base, Condition> = Pick<Base, {
  [Key in keyof Base]: ExcludeNullish<Base[Key]> extends Condition ? Key : never
}[keyof Base]>;

type CastValuesToRefs<T, ID extends string = 'id'> = T extends object ? A.Compute<OmitByValue<T, R | R[]> & PickAndCastByValue<T, R | R[], ID>> : T;

export type PickFlat<T, K extends string, ID extends string = 'id'> =
  U.Merge<K extends '*' ? CastValuesToRefs<T, ID> : ApicalypseDeepPick<T, K, ID>>;

type AppendId<T, K extends keyof T, ID extends string = 'id'> = ID extends keyof T ? K | ID : K;
type Over<T, K extends keyof T, K2, ID extends string = 'id'> = {
  [A in K]: _ApicalypseDeepPick<T[A], K2, ID>
}


type ApicalypseDeepPick<T, K, ID extends string = 'id'> = _ApicalypseDeepPick<T, K, ID>;

type _ApicalypseDeepPick<T, K, ID extends string = 'id'> =
  T extends any[] ? _ApicalypseDeepPick<T[number], K, ID>[] :
  K extends '*' ? CastValuesToRefs<T, ID> :
  K extends keyof T ? CastValuesToRefs<PickWith<T, K, ID>, ID> :
  K extends `${infer A}.${infer B}` ?
    A extends keyof T ? Over<T, AppendId<T, A & keyof T, ID>, B, ID> :
    never :
  never;


declare function get<O extends object, P extends string>(
  object: O, path: AutoPath<O, P>[]
): Path<O, Split<P, '.'>>

declare const user: User

type User = {
  name: string
  friends: User[]
}
