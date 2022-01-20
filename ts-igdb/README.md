# ts-igdb

A Typescript client and request builder for [IGDB](https://api-docs.igdb.com/#about) using [ts-apicalypse](https://github.com/magne4000/ts-apicalypse/tree/main/ts-apicalypse).

## Usage
All IGDB types are generated from [IGDB proto file](https://api.igdb.com/v4/igdbapi.proto) and used to type this lib.

### Simple request
```ts
import { request, fields, exclude, where } from 'ts-apicalypse';

// type of `data` is automagically infered
const { data } = await request('/games')  // Start building a request that will be executed on `/games` endpoint.
                                          // Type validation and autocompletion support for all endpoints.
  .pipe(
    fields(['name']), // `fields` are type checked. Here valid fields would be 'id' | 'name' | 'games' | 'collection' | ... |
                      // 'games.id' | 'games.name' | ... | 'games.*' |
                      // 'collection.id' | 'collection.name' | ... | 'collection.*'
                      // ...
    where('created_at', '<',  now), // The prop, the operator and the value are type checked
  ).execute(); // Execute the query

// another example using `exclude` operator
const { data } = await request('/games') // DEMO is the complete typing of the objects that can be returned by the endpoint
  .pipe(
    fields('*'),      // All fields...
    exclude(['name']) // ... except name
  ).execute();
```

### Request nested fields
```ts
import { request, fields, sort, limit, offset } from 'ts-apicalypse';

// type of `data` is automagically infered
const { data } = await request('/games')
    .pipe(
      fields(['name', 'games', 'collection.*']),
      sort('created_at', '<'), // sort, asc by default
      limit(10),  // pagination
      offset(10), // pagination
    ).execute()
```

### Request with complex conditions
```ts
import { request, fields, or, and, where, whereIn, WhereFlags, WhereInFlags } from 'ts-apicalypse';

// type of `data` is automagically infered
const { data } = await request('/external_games')
  .pipe(
    fields('*'),
    // demo of possible combinations 
    and(
      where('id', '>', 4),
      where('id', '>=', 4),
      where('id', '<', 4),
      where('id', '<=', 4),
      where('name', '=', 'zelda'),   // name is zelda (canse sensitive)
      where('name', '~', 'zelda'),   // name is zelda (canse insensitive)
      where('name', '!=', 'zelda'),  // name is not zelda
      where('name', '=', 'zelda', WhereFlags.STARTSWITH),  // name starts with zelda (also works with ~)
      where('name', '=', 'zelda', WhereFlags.ENDSWITH),    // name ends with zelda (also works with ~)
      where('name', '=', 'zelda', WhereFlags.CONTAINS),    // name contains zelda (also works with ~)
      where('name', '=', null),  // no name
      where('name', '!=', null), // name exists
      or(
        where('name', '=', 'zelda'),
        whereIn('name', ['mario', 'luigi']),
        whereIn('games', [1, 2], WhereInFlags.AND),   // Results whose games ids includes 1 and 2
        whereIn('games', [1, 2], WhereInFlags.OR),    // Results whose games ids includes 1 or 2
        whereIn('games', [1, 2], WhereInFlags.NAND),  // Results whose games ids does not contain both 1 and 2, but can be 1 or 2
        whereIn('games', [1, 2], WhereInFlags.NOR),   // Results whose games ids does not contain 1 or does not contain 2
        whereIn('games', [1, 2], WhereInFlags.EXACT), // Results whose exclusive games ids are 1 and 2
      )
    )
  ).execute();
```

### Count query
Most query will return requested fields as response data. But _count_ actually return data differently:
```ts
import { request, fields, exclude } from 'ts-apicalypse';

// type of `data` is automagically infered
const { data } = await request('games/count') // Here the query is tagged as a "count" query because it ends with `/count`
  .pipe() // you can have no operators, or specify some conditions
  .execute();
```

### Multi-query request
One can query multiple endpoints at once with a `multi` query
```ts
import { request, multi, fields, isNamed } from 'ts-apicalypse';

// type of `data` is automagically infered
const { data } = await multi(
  // `alias` must be used inside `multi` to alias the queries
  request('/games').alias("alias1").pipe(fields(['...'])),
  request('/games/count').alias("alias2").pipe(fields(['...'])),
  request('/external_games').alias("alias3").pipe(fields(['...'])),
).execute();

// you can then use `isNamed` type-guard to help you narrow data types
const result = data[0];
if (isNamed(result, 'alias1')) {
  result.result...
} else if (isNamed(result, 'alias2')) {
  result.count...
}
```
