interface Builder {
  queryFields: {
    fields?: string,
    exclude?: string;
    sort?: string;
    limit?: string;
    offset?: string;
    search?: string;
    where: string[]
  };

  queryEndpoint: string;
  queryName: string;
}

export function query(queryEndpoint: string, queryName: string) {
  return (builder: Builder): Builder => {
    return {
      ...builder,
      queryEndpoint,
      queryName
    }
  }
}

export function fields(fields: string[] | '*') {
  if (Array.isArray(fields)) {
    const fieldsString = fields.join(",").replace(/\s/g, '')

    return (builder: Builder): Builder => {
      return {
        ...builder,
        queryFields: {
          ...builder.queryFields,
          fields: `fields ${fieldsString}`
        }
      }
    }
  }

  return (builder: Builder) => builder;
}

export function exclude(exclude: string[]) {
  const fieldsString = exclude.join(",").replace(/\s/g, '')

  return (builder: Builder): Builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        exclude: `fields ${fieldsString}`
      }
    }
  }
}

export function sort(field: string, direction?: 'asc' | 'desc') {
  return (builder: Builder): Builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        sort: `sort ${field} ${direction || "asc"}`
      }
    }
  }
}

export function limit(limit: number) {
  return (builder: Builder): Builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        limit: `limit ${limit}`
      }
    }
  }
}

export function offset(offset: number) {
  return (builder: Builder): Builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        offset: `offset ${offset}`
      }
    }
  }
}

export function search(search: string) {
  return (builder: Builder): Builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        search: `search "${search.replace('"', '\\"')}"`
      }
    }
  }
}

export function where(key: string, op: string, value: string) {
  return (builder: Builder): Builder => {
    return {
      ...builder,
      queryFields: {
        ...builder.queryFields,
        where: [...builder.queryFields.where, `where ${key} ${op} ${value}`]
      }
    }
  }
}

export function build(builder: Builder) {
  const { where, ...rest } = builder.queryFields;
  return Object.keys(builder.queryFields).length > 1 ||
    builder.queryFields.where.length > 1
      ? Object.values(rest).concat(where).join(";") + ";"
      : "";
}

export function multi(builders: Builder[]) {
  return builders.map(b => `query ${b.queryEndpoint} "${b.queryName}" { ${build(b)} };`).join("");
}
