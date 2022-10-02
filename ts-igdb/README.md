# ts-igdb-client

A Typescript client and request builder for [IGDB](https://api-docs.igdb.com/#about) using [ts-apicalypse](https://github.com/magne4000/ts-apicalypse/tree/main/ts-apicalypse).

## Usage
All IGDB types are generated from [IGDB proto file](https://api.igdb.com/v4/igdbapi.proto) and used to type this lib.

### Auth
Usually you'll want your IGDB queries to be authenticated. See the following example
```ts
import { twitchAccessToken, igdb } from 'ts-igdb-client';

const twitchSecrets = {
  client_id: '...',
  client_secret: '...',
}

// generate a twitch access token
const accessToken = await twitchAccessToken(twitchSecrets);

// generate an IGDB client with twitch credentials
const client = igdb(twitchSecrets.client_id, accessToken);

// build and execute a query
const { data } = await client.request(...).execute();
```

### Simple request
```ts
import { fields, exclude, where } from 'ts-igdb-client';

// type of `data` is automagically infered
const { data } = await client.request('/games')  // Start building a request that will be executed on `/games` endpoint.
                                          // Type validation and autocompletion support for all endpoints.
  .pipe(
    fields(['name']), // `fields` are type checked. Here valid fields would be 'id' | 'name' | 'games' | 'collection' | ... |
                      // 'games.id' | 'games.name' | ... | 'games.*' |
                      // 'collection.id' | 'collection.name' | ... | 'collection.*'
                      // or even deeply nested one like 'collection.games.name' or 'collection.games.*', etc.
    where('created_at', '<',  now), // The prop, the operator and the value are type checked
  ).execute(); // Execute the query

// another example using `exclude` operator
const { data } = await request('/games')
  .pipe(
    fields('*'),      // All fields...
    exclude(['name']) // ... except name
  ).execute();
```

### Request nested fields
```ts
import { fields, sort, limit, offset } from 'ts-igdb-client';

// type of `data` is automagically infered
const { data } = await client.request('/games')
    .pipe(
      fields(['name', 'games', 'collection.*']),
      sort('created_at', '<'), // sort, asc by default
      limit(10),  // pagination
      offset(10), // pagination
    ).execute()
```

### Request with complex conditions
```ts
import { fields, or, and, where, whereIn, WhereFlags, WhereInFlags } from 'ts-igdb-client';

// type of `data` is automagically infered
const { data } = await client.request('/external_games')
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
      where('name', '!=', null), // name exists,
      where('collection.games.name', '=', 'zelda'), // nested types are also supported
      or(
        where('name', '=', 'zelda'),
        whereIn('name', ['mario', 'luigi']),
        whereIn('games', [1, 2], WhereInFlags.AND),   // Results whose games ids includes 1 and 2
        whereIn('games', [1, 2], WhereInFlags.OR),    // Results whose games ids includes 1 or 2
        whereIn('games', [1, 2], WhereInFlags.NAND),  // Results whose games ids does not contain both 1 and 2, but can be 1 or 2
        whereIn('games', [1, 2], WhereInFlags.NOR),   // Results whose games ids does not contain 1 or does not contain 2
        whereIn('games', [1, 2], WhereInFlags.EXACT), // Results whose exclusive games ids are 1 and 2,
        whereIn('collection.games.name', ['mario', 'luigi']), // nested types are also supported
      )
    )
  ).execute();
```

### Count query
Most query will return requested fields as response data. But _count_ actually return data differently:
```ts
import { fields, exclude } from 'ts-igdb-client';

// type of `data` is automagically infered
const { data } = await client.request('games/count') // Here the query is tagged as a "count" query because it ends with `/count`
  .pipe() // you can have no operators, or specify some conditions
  .execute();
```

### Multi-query request
One can query multiple endpoints at once with a `multi` query
```ts
import { request, client, fields, isNamed } from 'ts-igdb-client';

// type of `data` is automagically infered
const { data } = await client.multi(
  // `alias` must be used inside `multi` to alias the queries
  // you can use `request` directly imported from `ts-igdb-client` or `client.request`
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

### Webhooks
```ts
// Register a new webhook
const { data } = await client.webhooks.register('games', {
  url: 'https://...',
  method: 'create',
  secret: 'MySeCrEt',
});

// Retrieve existing webhooks ...
const { data } = await client.webhooks.get();
// ... or one webhook in particular
const { data } = await client.webhooks.get('someWebhookID');

// Delete existing webhook
const { data } = await client.webhooks.delete('someWebhookID');

// Test webhook
const { data } = await client.webhooks.test('games', 1234, 1337);
```