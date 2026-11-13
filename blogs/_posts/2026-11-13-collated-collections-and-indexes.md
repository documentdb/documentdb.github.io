---
title: "Case-insensitive queries with collated collections and indexes in DocumentDB"
description: Enable collation in DocumentDB OSS v1.3, create an unsharded collection with a case-insensitive index, and query values using locale-aware comparisons.
date: 2026-11-13
featured: false
author: DocumentDB team
category: documentdb-blog
section: blogs
tags:
  - DocumentDB
  - Collation
  - Indexes
  - Tutorial
---

Should a query for `"a"` also match `"A"`? By using collation, you can make that choice explicitly rather than normalizing every string in your application.

DocumentDB OSS beginning **v1.3 supports creating unsharded collections with collation**. Collation uses Unicode (ICU) rules for locale-aware string comparisons, including case- and accent-insensitive matching. Supported collated indexes can serve queries whose collation matches the index.

This walkthrough enables the required feature flags, creates a collection and a non-unique index, and demonstrates a case-insensitive query. It is based on [the original example and feature-flag notes](https://gist.github.com/xgerman/0d84036a676927a9382785cbffc857af).

## Choose how strings compare

A collation specifies a locale and comparison strength. For the English locale used here:

- `strength: 2` ignores case but distinguishes accents.
- `strength: 1` ignores both case and accents.

Use `{ locale: "en", strength: 2 }`, so `"a"` and `"A"` compare equal, as do `"b"` and `"B"`.

## 1. Start a local container

You need Docker and a **DocumentDB OSS v1.3 image**. The following command uses `latest`, a moving tag; ensure the image includes v1.3 before proceeding.

```bash
docker run -d --name docdb-test -p 127.0.0.1:10260:10260 \
  ghcr.io/documentdb/documentdb/documentdb-local:latest \
  --username testuser --password testpass123
```

Allow the gateway to finish starting before connecting. The published port is bound to localhost, and the credentials are for this disposable local example only.

## 2. Enable the collation feature flags

To create a collated collection, you need to enable **all five feature flags** listed below, even if the application index you create is non-unique.

Run these commands against the embedded PostgreSQL instance, which listens on port 9712 inside the container:

```bash
docker exec docdb-test psql -U documentdb -p 9712 -d postgres \
  -v ON_ERROR_STOP=1 \
  -c "ALTER SYSTEM SET documentdb_core.enableCollation = 'on';" \
  -c "ALTER SYSTEM SET documentdb.enableCollationWithNonUniqueOrderedIndexes = 'on';" \
  -c "ALTER SYSTEM SET documentdb.enable_collated_unique_indexes = 'on';" \
  -c "ALTER SYSTEM SET documentdb.enable_composite_unique_optional_key = 'on';" \
  -c "ALTER SYSTEM SET documentdb.enable_collation_with_create_collection = 'on';" \
  -c "SELECT pg_reload_conf();"
```

Here's what each setting enables:

| Feature flag | Purpose |
| --- | --- |
| `documentdb_core.enableCollation` | Master switch for collation. |
| `documentdb.enableCollationWithNonUniqueOrderedIndexes` | Required for creating any supported collated index. |
| `documentdb.enable_collated_unique_indexes` | Enables collated unique indexes; also required for collated collection creation. |
| `documentdb.enable_composite_unique_optional_key` | Required alongside the collated unique-index flag, including for collated collection creation. |
| `documentdb.enable_collation_with_create_collection` | Enables creating collections with collation. |

The `pg_reload_conf()` function reloads these settings; no restart is needed.

### Optional: schema validation with collation

To enable schema validation with collation, turn on one more feature flag:

```bash
docker exec docdb-test psql -U documentdb -p 9712 -d postgres \
  -v ON_ERROR_STOP=1 \
  -c "ALTER SYSTEM SET documentdb.enable_collation_with_schema_validation = 'on';" \
  -c "SELECT pg_reload_conf();"
```

This optional flag isn't required for the collection and index example in the next section.

## 3. Create a collated collection and index

The sample creates an **unsharded** collection with an English, case-insensitive collation, inserts four documents, and creates a matching index.

**Use only the disposable sample container:** this command drops the `c` collection in the `coll_t` database before recreating it, so rerunning the example removes any existing documents in that collection.

```bash
docker exec docdb-test mongosh \
  --host localhost --port 10260 \
  --username testuser --password testpass123 --authenticationDatabase admin \
  --quiet --eval '
    db = db.getSiblingDB("coll_t");
    db.c.drop();
    db.createCollection("c", {
      collation: { locale: "en", strength: 2 }
    });
    db.c.insertMany([{x:"b"},{x:"a"},{x:"B"},{x:"A"}]);

    db.c.createIndex({ x: 1 }, {
      collation: { locale: "en", strength: 2 }
    });

    printjson(
      db.c.find({ x: "a" })
          .collation({ locale: "en", strength: 2 })
          .toArray()
    );

    printjson(db.getCollectionInfos({ name: "c" }));
    printjson(db.c.getIndexes());
'
```

The collection defines its default collation, and the example specifies the same collation on the index and query explicitly.

## 4. Check the results

The query should return both documents with `x: "a"` and `x: "A"`, each with its generated `_id`. Don't depend on their order: the query doesn't specify a sort.

The metadata calls let you check the configuration:

- `db.getCollectionInfos({ name: "c" })` should show the collection collation.
- `db.c.getIndexes()` should show the collation on the `x_1` index.

Matching the query and index collation allows a supported collated index to serve the query. These metadata checks confirm the configuration, not which query plan was selected.

### Why the sample index is non-unique

A collated unique index rejects values that compare equal under its collation. With `strength: 2`, the sample contains two such pairs: `"a"`/`"A"` and `"b"`/`"B"`.

The `x_1` index is deliberately non-unique so all four documents can coexist. If you need case-insensitive uniqueness, choose a collated unique index and remove conflicting values before building it.

## Cleanup

When you're finished, remove the disposable container:

```bash
docker rm -f docdb-test
```

This step removes the sample container and its database data stored in the container's writable layer.

## Keep the boundaries in mind

- OSS v1.3 supports collated collection creation for **unsharded collections**.
- Enable **all five required flags** before creating the collection, including the two unique-index flags even if your application index isn't unique.
- Choose the comparison strength deliberately: case-insensitive and accent-insensitive are different behaviors.
- Use a query collation that matches the index when you want a supported collated index to serve it.
- Schema validation with collation requires its own additional flag.

Start with this small example to check the behavior your application needs, and then apply the same locale and comparison rules consistently to your collections, indexes, and queries.
