# ts-apicalypse

A Typescript client and request builder for [Apicalypse](https://apicalypse.io/).

If you are searching for a lib with IGDB types baked-in, check [ts-igdb-client](https://github.com/magne4000/ts-apicalypse/tree/main/ts-igdb).

## Why?
Long story short, [node Apicalypse client](https://www.npmjs.com/package/apicalypse) is good if you are writing
Javascript only code. But if you need strong type checking and inference, it's not enough.
The patterns used inside the original client make it impossible to have strict typing or inference
(e.g. when using _fields_ queries). (see current [DefinitelyTyped](https://www.npmjs.com/package/@types/apicalypse))

## Usage
Consider the following type for the different usages:
```ts
type DEMO = {
  id: number,
  name: string,
  games: { id: number, name: string }[],
  collection: { id: number, name: string, demo: DEMO }
};
```

### Simple request
```ts
import { request, fields, exclude, where } from 'ts-apicalypse';

const { data } = await request<DEMO>() // DEMO is the complete typing of the objects that can be returned by the endpoint
  .pipe(
    fields(['name']), // `fields` are type checked. Here valid fields would be 'id' | 'name' | 'games' | 'collection' |
                      // 'games.id' | 'games.name' | 'games.*' |
                      // 'collection.id' | 'collection.name' | 'collection.*'
                      // or even deeply nested one like 'collection.demo.name' or 'collection.demo.games.*', etc.
    where('created_at', '<',  now), // The prop, the operator and the value are type checked
  ).execute('https://...'); // Execute the query

// Infered type of `data` is:
type Data = {
  id: number,   // always returned
  name: string  // requested via fields
}

// another example using `exclude` operator
const { data } = await request<DEMO>()
  .pipe(
    fields('*'),      // All fields...
    exclude(['name']) // ... except name
  ).execute('https://...');
```

### Request nested fields
```ts
import { request, fields, sort, limit, offset } from 'ts-apicalypse';

const { data } = await request<DEMO>()
    .pipe(
      fields(['name', 'games', 'collection.*']),
      sort('created_at', '<'), // sort, asc by default
      limit(10),  // pagination
      offset(10), // pagination
    ).execute('https://...')

// Infered type of `data` is:
type Data = {
  id: number,     // always returned
  name: string    // requested via fields
  games: number[] // requested via fields. No fields requested, so it's only an array of IDs
  collection: {   // requested via fields. All fields requested
    id: number,
    name: string,
    demo: number,
  }  
}
```

### Request with complex conditions
```ts
import { request, fields, or, and, where, whereIn, WhereFlags, WhereInFlags } from 'ts-apicalypse';

const { data } = await request<DEMO>()
  .pipe(
    fields('*'),
    // demo of possible combinations 
    and(
      where('id', '>', 4),
      where('id', '>=', 4),
      where('id', '<', 4),
      where('id', '<=', 4),
      where('name', '=', 'zelda'),   // name is zelda (case sensitive)
      where('name', '~', 'zelda'),   // name is zelda (case insensitive)
      where('name', '!=', 'zelda'),  // name is not zelda
      where('name', '=', 'zelda', WhereFlags.STARTSWITH),  // name starts with zelda (also works with ~)
      where('name', '=', 'zelda', WhereFlags.ENDSWITH),    // name ends with zelda (also works with ~)
      where('name', '=', 'zelda', WhereFlags.CONTAINS),    // name contains zelda (also works with ~)
      where('name', '=', null),  // no name
      where('name', '!=', null), // name exists
      where('collection.demo.name', '=', 'zelda'), // nested types are also supported
      or(
        where('name', '=', 'zelda'),
        whereIn('name', ['mario', 'luigi']),
        whereIn('games', [1, 2], WhereInFlags.AND),   // Results whose games ids includes 1 and 2
        whereIn('games', [1, 2], WhereInFlags.OR),    // Results whose games ids includes 1 or 2
        whereIn('games', [1, 2], WhereInFlags.NAND),  // Results whose games ids does not contain both 1 and 2, but can be 1 or 2
        whereIn('games', [1, 2], WhereInFlags.NOR),   // Results whose games ids does not contain 1 or does not contain 2
        whereIn('games', [1, 2], WhereInFlags.EXACT), // Results whose exclusive games ids are 1 and 2
        whereIn('collection.demo.name', ['mario', 'luigi']), // nested types are also supported
      )
    )
  ).execute('https://...');
```

### Count query
Most query will return requested fields as response data. But _count_ actually return data differently:
```ts
import { request, fields, exclude } from 'ts-apicalypse';

const { data } = await request<DEMO, 'count'>() // Here the query is tagged as a "count" query
  .pipe() // you can have no operators, or specify some conditions
  .execute('https://.../count'); // some endpoint returning count data

// Infered type of `data` is:
type Data = {
  count: number
}
```

### Multi-query request
One can query multiple endpoints at once with a `multi` query
```ts
import { request, multi, fields, isNamed } from 'ts-apicalypse';

const { data } = await multi(
  // `sub` must be used inside `multi` to alias the queries
  request<DEMO>().sub("endpoint1", "alias1").pipe(fields(['...'])),
  request<DEMO, 'count'>().sub("endpoint1", "alias2").pipe(fields(['...'])),
  request<DEMO>().sub("endpoint2", "alias3").pipe(fields(['...'])),
).execute('https://...');

// Infered type of `result` is:
type Result = ({
  name: 'alias1';
  result: {...}[]
} | {
  name: 'alias2';
  count: number;
} | {
  name: 'alias3';
  result: {...}[]
})[]

// you can then use `isNamed` type-guard to help you narrow those types
const result = data[0];
if (isNamed(result, 'alias1')) {
  result.result...
} else if (isNamed(result, 'alias2')) {
  result.count...
}
```
