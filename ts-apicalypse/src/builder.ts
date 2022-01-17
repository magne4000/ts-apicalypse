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

/**
 * Select only given fields.
 * Resulting response type is narrowed to only include specified fields (including nested ones).
 *
 * @example
 * ```ts
 * request().pipe(
 *   fields('*'),                   // select all fields
 *   fields(["name", "genres.id"]), // select specific fields, incuding sub-type
 *   fields(["name", "genres.*"]),  // select specific fields, incuding all fields of sub-type
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#fields}
 * @param fields
 */
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

/**
 * Exclude given fields from selection.
 * Resulting response type is narrowed to exclude specified fields (not compatible with nested fields).
 *
 * @example
 * ```ts
 * request().pipe(
 *   fields('*'),
 *   exclude(["name", "created_at"]), // exclude specific fields
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#exclude}
 * @param exclude
 */
export function exclude<T extends Record<any, any>, K extends keyof T>(exclude: K[]): BuilderOperatorNarrow<T, Omit<T, K>> {
  const fieldsString = exclude.join(",").replace(/\s/g, '')

  return (builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        exclude: `exclude ${fieldsString}`
      }
    }
  }) as BuilderOperatorNarrow<T, Omit<T, K>>;
}

/**
 * Sort results by specified field.
 *
 * @example
 * ```ts
 * request().pipe(
 *   sort('name'),          // defaults to 'asc' when direction is not specified
 *   sort('name', 'desc'),  // manually specify direction
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#sorting}
 * @param field
 * @param direction
 */
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

/**
 * Limit the number of results returned by the query.
 *
 * @example
 * ```ts
 * request().pipe(
 *   limit(42), // Only retrieve 42 elements
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#pagination}
 * @param limit
 */
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

/**
 * Start results at a given offset.
 *
 * @example
 * ```ts
 * request().pipe(
 *   offset(50), // Start he results at position 50...
 *   limit(42),  // ...and limit the number of results to 42
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#pagination}
 * @param limit
 */
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

/**
 * Search based on name, results are sorted by similarity to the given search string.
 *
 * @example
 * ```ts
 * request().pipe(
 *   search('zelda'),
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#search-1}
 * @param search
 */
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

/**
 * Filters results based on given parameters. All parameters are type validated if `request` is given a type.
 * Also see {@link whereIn}.
 *
 * @example
 * ```ts
 * request<MyType>().pipe(
 *   where('ratings', '>', 4),  // ratings greater than 4
 *   where('ratings', '>=', 4), // ratings greater than or equal 4
 *   where('ratings', '<', 4),  // ratings less than 4
 *   where('ratings', '<=', 4), // ratings less than or equal 4
 *   where('name', '=', 'zelda'),   // name is zelda (canse sensitive)
 *   where('name', '~', 'zelda'),   // name is zelda (canse insensitive)
 *   where('name', '!=', 'zelda'),  // name is not zelda
 *   where('name', '=', 'zelda', WhereFlags.STARTSWITH),  // name starts with zelda (also works with ~)
 *   where('name', '=', 'zelda', WhereFlags.ENDSWITH),    // name ends with zelda (also works with ~)
 *   where('name', '=', 'zelda', WhereFlags.CONTAINS),    // name contains zelda (also works with ~)
 *   where('release_date', '=', null)   // no release date
 *   where('release_date', '!=', null)  // release date has any value
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#filters}
 * @param key
 * @param op
 * @param value
 * @param flag
 */
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

/**
 * Filters results based on given parameters. All parameters are type validated if `request` is given a type.
 * Also see {@link where}.
 *
 * @example
 * ```ts
 * request<MyType>().pipe(
 *   whereIn('genres', [1, 2], WhereInFlags.AND),   // Results whose genres includes 1 and 2
 *   whereIn('genres', [1, 2], WhereInFlags.OR),    // Results whose genres includes 1 or 2
 *   whereIn('genres', [1, 2], WhereInFlags.NAND),  // Results whose genres does not contain both 1 and 2, but can be 1 or 2
 *   whereIn('genres', [1, 2], WhereInFlags.NOR),   // Results whose genres does not contain 1 or does not contain 2
 *   whereIn('genres', [1, 2], WhereInFlags.EXACT), // Results whose exclusive genres are 1 and 2
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#filters}
 * @param key
 * @param values
 * @param flag
 */
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

function groupWhere<T extends Record<any, any>>(orAnd: string, ...operators: BuilderOperator<T, T>[]): BuilderOperator<T, T> {
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

/**
 * Combine multiple {@link where} and {@link whereIn} conditions.
 *
 * @example
 * ```ts
 * // Select results that are on platform 1 and 2, and whose name are either 'zelda' or 'link'
 * request<MyType>().pipe(
 *   and(
 *     whereIn('platforms', [1, 2], WhereInFlags.AND),
 *     or(
 *       where('name', '=', 'zelda'),
 *       where('name', '=', 'link'),
 *     )
 *   )
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#filters}
 * @param operators
 */
export function and<T extends Record<any, any>>(...operators: BuilderOperator<T, T>[]): BuilderOperator<T, T> {
  return groupWhere('&', ...operators);
}

/**
 * Combine multiple {@link where} and {@link whereIn} conditions.
 *
 * @example
 * ```ts
 * // Select results that are on platform 1 and 2, and whose name are either 'zelda' or 'link'
 * request<MyType>().pipe(
 *   and(
 *     whereIn('platforms', [1, 2], WhereInFlags.AND),
 *     or(
 *       where('name', '=', 'zelda'),
 *       where('name', '=', 'link'),
 *     )
 *   )
 * )
 * ```
 * @see {@link https://api-docs.igdb.com/?shell#filters}
 * @param operators
 */
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
