import {
  AllowedValues,
  Builder,
  BuilderOperator,
  BuilderOperatorNarrow,
  FlatKeyOf,
  GetOp,
  NamedBuilderOperator,
  PickFlat,
  WhereFlags,
  WhereInFlags
} from "./types";

export function query<T extends Record<any, any>, S extends string>(queryEndpoint: string, queryName: S): NamedBuilderOperator<T, S> {
  return (builder => {
    return {
      ...builder,
      queryEndpoint,
      queryName
    }
  }) as NamedBuilderOperator<T, S>;
}

export function fields<T extends Record<any, any>, K extends FlatKeyOf<T>[] | '*'>(fields: K): BuilderOperatorNarrow<T, PickFlat<T, K>> {
  if (Array.isArray(fields)) {
    const fieldsString = fields.join(",").replace(/\s/g, '')

    return (builder => {
      return {
        ...builder,
        queryFields: {
          ...builder.queryFields,
          fields: `fields ${fieldsString}`
        }
      }
    }) as BuilderOperatorNarrow<T, PickFlat<T, K>>;
  }

  return (builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        fields: `fields *`
      }
    }
  }) as BuilderOperatorNarrow<T, PickFlat<T, K>>;
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

  throw new Error('WhereInFlags not specified or invalid');
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

export function toStringMulti<T>(builders: Builder<T>[]) {
  return builders.map(b => `query ${b.queryEndpoint} "${b.queryName}" { ${toStringSingle(b)} };`).join("");
}

export function toStringSingle<T>(builder: Builder<T>) {
  const { where, ...rest } = builder.queryFields;
  const w = where.length > 0 ? "where " + where.join("") + ";" : "";
  const r = Object.keys(rest).length > 0 ? Object.values(rest).join(";") + ";" : "";
  return r + w;
}

function encodeString(v: string) {
  return v.replace(/"/g, '\\"');
}