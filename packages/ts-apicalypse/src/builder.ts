export interface Stringifiable {
  toApicalypseString(): string;
}

export interface Builder extends Stringifiable {
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

export interface BuilderOperator {
  (builder: Builder): Builder
}

function newBuilder(): Builder {
  return {
    queryFields: {
      where: []
    },
    toApicalypseString() {
      return toStringSingle(this);
    }
  }
}

export function query(queryEndpoint: string, queryName: string): BuilderOperator {
  return builder => {
    return {
      ...builder,
      queryEndpoint,
      queryName
    }
  }
}

export function fields(fields: string[] | '*'): BuilderOperator {
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

  return builder => builder;
}

export function exclude(exclude: string[]): BuilderOperator {
  const fieldsString = exclude.join(",").replace(/\s/g, '')

  return builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        exclude: `fields ${fieldsString}`
      }
    }
  }
}

export function sort(field: string, direction: 'asc' | 'desc' = 'asc'): BuilderOperator {
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

export function limit(limit: number): BuilderOperator {
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

export function offset(offset: number): BuilderOperator {
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

export function search(search: string): BuilderOperator {
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

export function where(key: string, op: string, value: string | number | boolean): BuilderOperator {
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

export function pipe(...steps: BuilderOperator[]): Builder {
  return steps.reduce<Builder>((output, f) => f(output), newBuilder())
}

export function multi(...builders: Builder[]): Stringifiable {
  return {
    toApicalypseString() {
      return toStringMulti(builders);
    }
  }
}

export function toStringMulti(builders: Builder[]) {
  return builders.map(b => `query ${b.queryEndpoint} "${b.queryName}" { ${toStringSingle(b)} };`).join("");
}

function toStringSingle(builder: Builder) {
  const { where, ...rest } = builder.queryFields;
  return Object.keys(builder.queryFields).length > 0 ||
  builder.queryFields.where.length > 0
    ? Object.values(rest).concat(where).join(";") + ";"
    : "";
}
