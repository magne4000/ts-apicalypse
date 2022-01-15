import type { DeepPick, DefaultGrammar, DeepPickPath } from "ts-deep-pick";
import type { AxiosPromise } from "axios";

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

export interface Executor<T> {
  execute(url: string): AxiosPromise<T[]>
}

export type ExecutorMultiMono<T extends NamedBuilder<any, any>> = {
  name: T["queryName"],
  result: T extends NamedBuilder<infer S, any> ? S[] : never
};

export interface ExecutorMulti<T extends Builder<any>[]> {
  execute(url: string): AxiosPromise<T extends (infer S)[] ? ExecutorMultiMono<S extends NamedBuilder<any, any> ? S : never>[] : never>
}

export interface BuilderOperator<T, R> {
  (builder: Builder<T>): Builder<R>
}

export interface BuilderOperatorNarrow<T, R> {
  __narrow: true
  (builder: Builder<T>): Builder<R>
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

type MetaFlatKeyOf<T> = { [K in keyof T]: T[K] extends Record<string, any> ? keyof T[K] : void };
type _FlatKeyOf<T, S = MetaFlatKeyOf<T>> =
  { [K in Extract<keyof S, string>]: S[K] extends void ? K : (K | `${K}.${Extract<S[K], string>}` | `${K}.*`) };
export type FlatKeyOf<T, S = _FlatKeyOf<T>> = S[keyof S];

interface G extends DefaultGrammar {
  array: never; // disable
  omit: never; // disable
  mutate: never; // disable
}

type ComputeRaw<A extends any> = {[K in keyof A]: A[K]} & unknown

type RA = Record<any, any>[];

type _PickAndCastByValue<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? number[] : never
};
type ExcludeNeverProps<T> =
  { [K in keyof T]: T[K] extends never ? never : K }[keyof T]
type PickAndCastByValue<Base, Condition, S = _PickAndCastByValue<Base, Condition>> = Pick<S, ExcludeNeverProps<S>>;

type OmitByValue<Base, Condition> = Pick<Base, {
  [Key in keyof Base]: Base[Key] extends Condition ? never : Key
}[keyof Base]>;

type PickByValue<Base, Condition> = Pick<Base, {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}[keyof Base]>;

type DeepPickG<T, K extends DeepPickPath<T, G>> = DeepPick<T, K, G>;
type _CastDeep<T> = T extends `${infer A}.*` ? A : T;

type _EnsureDeepPickPath2<T, K> =
  Extract<_CastDeep<Exclude<K, keyof PickByValue<T, RA>>>, DeepPickPath<T, G>>;

type _EnsureDeepPickPath<T, K> =
  Extract<K, DeepPickPath<T, G>>;

export type PickFlat<T, K extends FlatKeyOf<T>[] | '*'> =
  K extends '*' ?
    ComputeRaw<OmitByValue<T, RA> & PickAndCastByValue<T, RA>> :
  K extends FlatKeyOf<T>[] ?
    ComputeRaw<
      DeepPickG<T, _EnsureDeepPickPath2<T, K[keyof K]>> &
      DeepPickG<PickAndCastByValue<T, RA>, _EnsureDeepPickPath<_PickAndCastByValue<T, RA>, K[keyof K]>>
    > :
    never;


type DEMO = { a: 1, b: 3, c: { d: 3 }[] };
type X = PickFlat<DEMO, ['a', 'c.*']>
type X2 = PickFlat<DEMO, ['a', 'c']>
type X3 = PickFlat<DEMO, '*'>
type F = _CastDeep<'c.*' | 'd'>;
type Z = DeepPick<DEMO, 'c', G>
