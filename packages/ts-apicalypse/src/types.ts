import type { DeepPick, DefaultGrammar, DeepPickPath } from "ts-deep-pick";

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

export interface BuilderOperator<T, R = T> {
  (builder: Builder<T>): Builder<R>
}

export type StandardOperatos = '=' | '!=';
export type StringOperators = StandardOperatos | '~';
export type NumbersOperatos = StandardOperatos | '>=' | '>' | '<=' | '<';
export type AllowedValues = true | false | null;

export type GetOp<T> = T extends number ? NumbersOperatos : T extends string ? StringOperators : StandardOperatos;

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

export type ComputeRaw<A extends any> = {[K in keyof A]: A[K]} & unknown

type _PickAndCastByValue<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? number[] : never
};
type ExcludeNeverProps<T> =
  { [K in keyof T]: T[K] extends never ? never : K }[keyof T]
type PickAndCastByValue<Base, Condition, S = _PickAndCastByValue<Base, Condition>> = Pick<S, ExcludeNeverProps<S>>;

type PickByValue<Base, Condition> = Pick<Base, {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}[keyof Base]>;

type _PickFlat<T, K extends DeepPickPath<T, G>> = DeepPick<T, K, G>;
type _CastDeep<T> = T extends `${infer A}.*` ? A : T;

type _CastFlatKeyOf<T, K> =
  Extract<_CastDeep<Exclude<K, keyof PickByValue<T, Record<any, any>[]>>>, DeepPickPath<T, G>>;

type _CastFlatKeyOf2<T, K> =
  Extract<K, DeepPickPath<T, G>>;

export type PickFlat<T, K extends FlatKeyOf<T>[] | '*'> =
  K extends '*' ? DeepPick<T, K, G> :
  K extends FlatKeyOf<T>[] ?
    ComputeRaw<
      _PickFlat<T, _CastFlatKeyOf<T, K[keyof K]>> &
      _PickFlat<PickAndCastByValue<T, Record<any, any>[]>, _CastFlatKeyOf2<_PickAndCastByValue<T, Record<any, any>[]>, K[keyof K]>>
    > :
  K extends DeepPickPath<T, G> ? DeepPick<T, K, G> : never;


type DEMO = { a: 1, b: 3, c: { d: 3 }[] };
type X = PickFlat<DEMO, ['a', 'c.*']>
type X2 = PickFlat<DEMO, ['a', 'c']>
type Y = _PickFlat<DEMO, 'a' | 'b' | 'c'>
type F = _CastDeep<'c.*' | 'd'>;
type Z = DeepPick<DEMO, 'c', G>
