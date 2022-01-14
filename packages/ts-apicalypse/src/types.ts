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
type Numbers = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type CombinationOperators = '&' | '|';
type AllowedValues = 'true' | 'false' | 'null';