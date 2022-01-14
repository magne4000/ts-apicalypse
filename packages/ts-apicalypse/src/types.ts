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

export interface BuilderOperator<T> {
  (builder: Builder<T>): Builder<T>
}

// UTILS

type Strip<T extends string> = T extends ` ${infer R}` ? Strip<R> : T extends `${infer R} ` ? Strip<R> : T;
export type Operators = '=' | '!=' | '>=' | '>' | '<=' | '<' | '~';
export type AllowedValues = true | false | null;

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