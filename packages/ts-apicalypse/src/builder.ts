import {
  AllowedValues,
  Builder,
  BuilderOperator,
  FlatKeyOf,
  GetOp, PickFlat,
  Stringifiable,
  WhereFlags,
  WhereInFlags
} from "./types";

export function query<T extends Record<any, any>>(queryEndpoint: string, queryName: string): BuilderOperator<T, T> {
  return builder => {
    return {
      ...builder,
      queryEndpoint,
      queryName
    }
  }
}

// TODO type execute and narrow returned type
export function fields<T extends Record<any, any>, K extends FlatKeyOf<T>[] | '*'>(fields: K): BuilderOperator<T, PickFlat<T, K>> {
  if (Array.isArray(fields)) {
    const fieldsString = fields.join(",").replace(/\s/g, '')

    return builder => {
      return {
        ...builder,
        queryFields: {
          ...builder.queryFields,
          fields: `fields ${fieldsString}`
        }
      }
    }
  }

  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        fields: `fields *`
      }
    }
  }
}

export function exclude<T extends Record<any, any>>(exclude: (keyof T)[]): BuilderOperator<T, T> {
  const fieldsString = exclude.join(",").replace(/\s/g, '')

  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        exclude: `exclude ${fieldsString}`
      }
    }
  }
}

export function sort<T extends Record<any, any>>(field: keyof T, direction: 'asc' | 'desc' = 'asc'): BuilderOperator<T, T> {
  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        sort: `sort ${field} ${direction}`
      }
    }
  }
}

export function limit<T extends Record<any, any>>(limit: number): BuilderOperator<T, T> {
  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        limit: `limit ${limit}`
      }
    }
  }
}

export function offset<T extends Record<any, any>>(offset: number): BuilderOperator<T, T> {
  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        offset: `offset ${offset}`
      }
    }
  }
}

export function search<T extends Record<any, any>>(search: string): BuilderOperator<T, T> {
  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        search: `search "${encodeString(search)}"`
      }
    }
  }
}

function encodeWhereParam(value: unknown, flag?: WhereFlags): string {
  let v: unknown = null;

  if (typeof value === 'boolean' || value === null) {
    return String(value);
  }

  if (typeof flag === 'number') {
    if ((flag & WhereFlags.STRING) === WhereFlags.STRING) {
      v = `"${encodeString(value as string)}"`;
    }
    if ((flag & WhereFlags.STARTSWITH) === WhereFlags.STARTSWITH) {
      v += '*';
    }
    if ((flag & WhereFlags.ENDSWITH) === WhereFlags.ENDSWITH) {
      v = '*' + v;
    }
    if ((flag & WhereFlags.RAW) === WhereFlags.RAW) {
      v = value;
    }
  }

  if (typeof value === 'string' && v === null) {
    v = `"${encodeString(value)}"`;
  }

  if (v === null) {
    v = value;
  }

  return v as string;
}

function encodeWhereInParam(values: unknown[], flag: WhereInFlags | WhereFlags) {
  const joined = values.map(v => encodeWhereParam(v, flag as WhereFlags)).join(',');

  if ((flag & WhereInFlags.NAND) === WhereInFlags.NAND) {
    return `![${joined}]`;
  }
  if ((flag & WhereInFlags.NOR) === WhereInFlags.NOR) {
    return `!(${joined})`;
  }
  if ((flag & WhereInFlags.AND) === WhereInFlags.AND) {
    return `[${joined}]`;
  }
  if ((flag & WhereInFlags.OR) === WhereInFlags.OR) {
    return `(${joined})`;
  }
  if ((flag & WhereInFlags.EXACT) === WhereInFlags.EXACT) {
    return `{${joined}}`;
  }

  throw new Error('WhereInFlags not specified');
}

export function where<T extends Record<any, any>, K extends keyof T>(key: K, op: GetOp<T[K]>, value: T[K] | AllowedValues, flag?: WhereFlags): BuilderOperator<T, T> {
  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        where: [`${key} ${op} ${encodeWhereParam(value, flag)}`]
      }
    }
  }
}

export function whereIn<T extends Record<any, any>, K extends keyof T>(key: K, values: T[K][], flag: WhereInFlags | WhereFlags = WhereInFlags.OR): BuilderOperator<T, T> {
  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        where: [`${key} = ${encodeWhereInParam(values, flag)}`]
      }
    }
  }
}

export function groupWhere<T extends Record<any, any>>(orAnd: string, ...operators: BuilderOperator<T, T>[]): BuilderOperator<T, T> {
  return builder => {
    const sub = operators.flatMap(op => [...op(builder).queryFields.where, ` ${orAnd} `]);
    if (sub.length === 0) return builder;

    sub.pop(); // remove last ' ${orAnd} '

    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        where: ['(',  ...sub, ')']
      }
    }
  }
}

export function and<T extends Record<any, any>>(...operators: BuilderOperator<T, T>[]): BuilderOperator<T, T> {
  return groupWhere('&', ...operators);
}

export function or<T extends Record<any, any>, R>(...operators: BuilderOperator<T, R>[]): BuilderOperator<T, R> {
  return groupWhere('|', ...operators);
}

export function multi<T extends Record<any, any>>(...builders: Builder<T>[]): Stringifiable {
  return {
    toApicalypseString() {
      return toStringMulti(builders);
    }
  }
}

export function request<T>() {
  function pipe(): Builder<T>;
  function pipe<A>(
    fn1: BuilderOperator<T, A>,
  ): Builder<A>;
  function pipe<A, B>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
  ): Builder<B extends T ? A extends T ? T : A : B>;
  function pipe<A, B, C>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>
  ): Builder<C extends T ? B extends T ? A extends T ? T : A : B : C>;
  function pipe<A, B, C, D>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>
  ): Builder<D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D>;
  function pipe<A, B, C, D, E>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>
  ): Builder<E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E>;
  function pipe<A, B, C, D, E, F>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>,
    fn6: BuilderOperator<T, F>
  ): Builder<F extends T ? E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E : F>;
  function pipe<A, B, C, D, E, F, G>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>,
    fn6: BuilderOperator<T, F>,
    fn7: BuilderOperator<T, G>
  ): Builder<G extends T ? F extends T ? E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E : F : G>;
  function pipe<A, B, C, D, E, F, G, H>(
    fn1: BuilderOperator<T, A>,
    fn2: BuilderOperator<T, B>,
    fn3: BuilderOperator<T, C>,
    fn4: BuilderOperator<T, D>,
    fn5: BuilderOperator<T, E>,
    fn6: BuilderOperator<T, F>,
    fn7: BuilderOperator<T, G>,
    fn8: BuilderOperator<T, H>
  ): Builder<H extends T ? G extends T ? F extends T ? E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E : F : G : H>;
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
  ): Builder<I extends T ? H extends T ? G extends T ? F extends T ? E extends T ? D extends T ? C extends T ? B extends T ? A extends T ? T : A : B : C : D : E : F : G : H : I>;
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
  ): Builder<unknown>;

  function pipe(...steps: BuilderOperator<T, any>[]): Builder<any> {
    return steps.reduce((output, f) => f(output), newBuilder())
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

function toStringMulti<T>(builders: Builder<T>[]) {
  return builders.map(b => `query ${b.queryEndpoint} "${b.queryName}" { ${toStringSingle(b)} };`).join("");
}

function toStringSingle<T>(builder: Builder<T>) {
  const { where, ...rest } = builder.queryFields;
  const w = where.length > 0 ? "where " + where.join("") + ";" : "";
  const r = Object.keys(rest).length > 0 ? Object.values(rest).join(";") + ";" : "";
  return r + w;
}

function encodeString(v: string) {
  return v.replace(/"/g, '\\"');
}
