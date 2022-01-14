import { Builder, BuilderOperator, Operators, Stringifiable } from "./types";

export function query<T extends Record<any, any>>(queryEndpoint: string, queryName: string): BuilderOperator<T> {
  return builder => {
    return {
      ...builder,
      queryEndpoint,
      queryName
    }
  }
}

export function fields<T extends Record<any, any>>(fields: (keyof T)[] | '*'): BuilderOperator<T> {
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

export function exclude<T extends Record<any, any>>(exclude: (keyof T)[]): BuilderOperator<T> {
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

export function sort<T extends Record<any, any>>(field: keyof T, direction: 'asc' | 'desc' = 'asc'): BuilderOperator<T> {
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

export function limit<T extends Record<any, any>>(limit: number): BuilderOperator<T> {
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

export function offset<T extends Record<any, any>>(offset: number): BuilderOperator<T> {
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

export function search<T extends Record<any, any>>(search: string): BuilderOperator<T> {
  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        search: `search "${search.replace('"', '\\"')}"`
      }
    }
  }
}

export function where<T extends Record<any, any>, K extends keyof T>(key: K, op: Operators, value: T[K]): BuilderOperator<T> {
  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        where: [...builder.queryFields.where, `where ${key} ${op} ${value}`]
      }
    }
  }
}

export function pipe<T extends Record<any, any> = any>(...steps: BuilderOperator<T>[]): Builder<T> {
  return steps.reduce<Builder<T>>((output, f) => f(output), newBuilder())
}

export function multi<T extends Record<any, any> = any>(...builders: Builder<T>[]): Stringifiable {
  return {
    toApicalypseString() {
      return toStringMulti(builders);
    }
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
  return Object.keys(builder.queryFields).length > 0 ||
  builder.queryFields.where.length > 0
    ? Object.values(rest).concat(where).join(";") + ";"
    : "";
}
