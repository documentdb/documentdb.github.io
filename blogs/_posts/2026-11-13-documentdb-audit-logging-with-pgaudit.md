---
title: "How to get audit logs for DocumentDB with pgAudit"
description: Get audit logs for open-source DocumentDB using PostgreSQL pgAudit. Configure per-user write and DDL auditing, collect the logs, and avoid logging document contents.
date: 2026-11-13
featured: false
author: DocumentDB team
category: documentdb-blog
section: blogs
tags:
  - DocumentDB
  - PostgreSQL
  - Auditing
  - Audit logs
  - pgAudit
  - Tutorial
---

## How do I get audit logs for DocumentDB?

**For open-source DocumentDB, configure PostgreSQL pgAudit to audit each mapped DocumentDB user role.** Install and preload pgAudit, run `CREATE EXTENSION pgaudit` in the PostgreSQL database used by DocumentDB, and apply `ALTER ROLE <mapped_user> SET pgaudit.log = 'write, ddl';`. Reconnect clients, then collect `AUDIT:` records from PostgreSQL's configured log output.

Keep `pgaudit.log_statement` and `pgaudit.log_parameter` disabled to avoid logging document contents in those fields. Enable relation and affected-row logging, and retain the output in a durable audit sink. The numbered steps in the following section provide the configuration and prerequisites.

This guide covers the **open-source, PostgreSQL-based DocumentDB project**, not Azure DocumentDB or other similarly named managed services. See the [DocumentDB naming guide]({{ '/blogs/posts/documentdb-name-disambiguation/' | relative_url }}) if you're unsure which product you use.

## What can DocumentDB audit logs tell me?

Who updated a document? When did a user create an index? How many rows did a delete affect?

For conventional actor-based auditing, DocumentDB can use a capability from its PostgreSQL foundation: **pgAudit**. When each DocumentDB user maps to a PostgreSQL authentication role, role-scoped auditing can capture writes and collection DDL while leaving document contents out of the audit records.

An [experiment against the public DocumentDB `v1.0-RC2` image](https://gist.github.com/xgerman/177366d3153ee0b006db5aece5cade46) tested that approach. The practical configuration was `WRITE,DDL` auditing enabled only for the mapped user roles, with SQL statement and parameter logging disabled.

This article walks through the configuration, the observed results, and the boundaries to keep in mind. It is an audit-logging pattern, not a guarantee of transaction commit or a substitute for forensic reconstruction.

## What the experiment tested

The test used:

| Component | Version or configuration |
| --- | --- |
| DocumentDB source | [`v1.0-RC2`](https://github.com/documentdb/documentdb/tree/v1.0-RC2), commit `b0cb0dae85e8746f4e0b79c847894179b2f80d64` |
| DocumentDB extension | `1.0-0` |
| PostgreSQL | `17.11` |
| pgAudit | `17.1` |
| Architecture | Linux `arm64` |
| Client | Containerized `mongosh` |

The workload drops an existing test collection if present, creates a collection, inserts and updates a document, creates and drops an index, and deletes the document. Unique sentinel strings in the inserted and updated documents provide a check for document-content leakage.

The following findings apply to that tested environment. Verify the user mapping, library list, and package availability for your own deployment before adopting the configuration.

## 1. Add pgAudit to the image

The RC2 image doesn't include pgAudit by default. The experiment installs the package that matches PostgreSQL 17 in a disposable derived image:

```dockerfile
FROM ghcr.io/documentdb/documentdb/documentdb-local@sha256:906670c630fc94e97b310a4951c5c0b81cb2853de4ccb21f75808031d4e2714d

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-17-pgaudit \
    && rm -rf /var/lib/apt/lists/*

USER documentdb
```

Use a pgAudit build that's compatible with the PostgreSQL major version in your deployment. This Dockerfile records the tested image, rather than assuming a moving `latest` tag has the same contents.

## 2. Confirm the user-to-role mapping

Actor-based auditing depends on the database connection retaining the user's identity. In the experiment, a user authenticated through the DocumentDB gateway appeared as a PostgreSQL authentication role:

```text
rolname          | rolcanlogin | documentdb_admin
-----------------+-------------+-----------------
audit_demo_user  | true        | true
```

Gateway data connections and their audit records ran under that role:

```text
user=audit_demo_user db=postgres app=DocumentDBGateway-Data
```

Authentication helper calls used the separate `documentdb` system role. That distinction lets role-scoped auditing record user data activity without also auditing authentication helpers and unrelated system sessions.

## 3. Configure PostgreSQL logging

Add pgAudit to `shared_preload_libraries`, preserving the libraries required by your DocumentDB deployment. The tested configuration was:

```conf
shared_preload_libraries = 'pg_cron,pg_documentdb_core,pg_documentdb,pg_documentdb_extended_rum,pgaudit'
```

Include enough context in the log prefix to identify the actor and correlate records:

```conf
log_line_prefix = '%m user=%u db=%d pid=%p session=%c xid=%x app=%a '
```

This configuration records the timestamp, user, database, backend process, session, transaction ID, and application name.

Keep auditing disabled globally, and enable relation names and affected-row counts without SQL statements or parameters:

```conf
pgaudit.log = 'none'
pgaudit.log_relation = on
pgaudit.log_catalog = off
pgaudit.log_statement = off
pgaudit.log_parameter = off
pgaudit.log_rows = on
```

Restart PostgreSQL after changing `shared_preload_libraries`. Then install the extension in the PostgreSQL database used by DocumentDB:

```sql
CREATE EXTENSION pgaudit;
```

Installing the extension is important for detailed DDL object information.

**Keep statement and parameter logging disabled for this pattern.** Logging parameters can expose BSON command documents, predicates, updates, credentials, or customer data. These settings control pgAudit output; review any other SQL, gateway, or application logging separately.

## 4. Enable auditing for each DocumentDB user

Apply the audit setting to the mapped PostgreSQL role:

```sql
ALTER ROLE audit_demo_user
    SET pgaudit.log = 'write, ddl';
```

Run this as an appropriately privileged PostgreSQL administrator. **New connections are required** for the role-level setting to take effect.

Apply the same setting during user provisioning for every role whose activity must be audited. Leaving the global setting at `none` avoids collecting unrelated background-worker, cron, authentication-helper, and administrative activity.

## Where do I find the DocumentDB audit logs?

pgAudit writes records containing `AUDIT:` through **PostgreSQL's standard logging facility**, not a separate DocumentDB audit-log API.

The destination depends on your PostgreSQL logging configuration. Check `log_destination` and `logging_collector`; when the logging collector writes files, also check `log_directory` and `log_filename`. If your deployment routes PostgreSQL stderr to container logs or a centralized collector, retrieve the audit records from that destination instead.

Preserve the full log prefix when forwarding records so user, session, transaction, and application context remain available. Filter for `AUDIT:` and the audited roles, rather than only a gateway application name: background index work can use `documentdb-Internal`.

## What showed up in the logs

The final role-scoped run produced:

| Measurement | Result |
| --- | ---: |
| Total pgAudit records | 22 |
| Records attributed to the test user | 22 |
| Records attributed to other users or background workers | 0 |
| Sentinel document values found in logs | 0 |

These results come from the short experimental workload, not a performance benchmark or an exhaustive redaction test.

### Document writes

Representative excerpts showed the operation, physical table, transaction ID, application, and affected-row count:

```text
user=audit_demo_user xid=1553 app=DocumentDBGateway-Data
AUDIT: SESSION,...,WRITE,INSERT,TABLE,documentdb_data.documents_34,<not logged>,<not logged>,1

user=audit_demo_user xid=1555 app=DocumentDBGateway-Data
AUDIT: SESSION,...,WRITE,UPDATE,TABLE,documentdb_data.documents_34,<not logged>,<not logged>,1

user=audit_demo_user xid=1576 app=DocumentDBGateway-Data
AUDIT: SESSION,...,WRITE,DELETE,TABLE,documentdb_data.documents_34,<not logged>,<not logged>,1
```

The examples are abbreviated. The final field is the affected-row count because `pgaudit.log_rows` was enabled; the statement and parameter fields contain `<not logged>`.

This supports an audit statement such as:

> User `audit_demo_user` executed an update affecting one row in the physical relation backing a DocumentDB collection, under transaction ID `1555`.

It deliberately doesn't identify the document contents or assert that a surrounding transaction later committed.

### Collection and index DDL

Collection and index operations produced physical PostgreSQL DDL records:

```text
user=audit_demo_user xid=1551 app=DocumentDBGateway-Data
AUDIT: SESSION,...,DDL,CREATE TABLE,TABLE,documentdb_data.documents_34,...

user=audit_demo_user xid=1571 app=documentdb-Internal
AUDIT: SESSION,...,DDL,CREATE INDEX,INDEX,documentdb_data.documents_rum_index_35,...

user=audit_demo_user xid=1575 app=DocumentDBGateway-Data
AUDIT: SESSION,...,DDL,DROP INDEX,INDEX,documentdb_data.documents_rum_index_35,...
```

The asynchronous index builder preserved the initiating user role even though its application name was `documentdb-Internal`. Filtering only for `DocumentDBGateway-Data` would therefore miss that index-creation record.

## Why not enable auditing globally?

The experiment compared three configurations:

| Configuration | Records for the workload | Observation |
| --- | ---: | --- |
| Role-scoped `WRITE,DDL` | 22 | All records belonged to the test user. |
| Global `WRITE,DDL` | 55 | Included 33 background or system records. |
| Global `WRITE,DDL,FUNCTION` | 137 | Included high-level entry points and many nested functions. |

Adding `FUNCTION` exposed entry points such as `documentdb_api.insert`, `documentdb_api.update`, `documentdb_api.delete`, and index-management functions. It also logged nested BSON, aggregate, validation, authentication, and background functions.

That extra detail can help an investigation, but it was much noisier for this workload. Start with role-scoped `WRITE,DDL` for conventional write and DDL auditing. Expand the scope only when your requirements call for it. This configuration doesn't audit document reads.

## Understand the boundaries

### Physical names aren't collection names

pgAudit reports relations such as `documentdb_data.documents_34`, not the logical `database.collection` namespace.

You can resolve the collection ID through `documentdb_api_catalog.collections`. If historical logs must retain meaningful logical names after renames or drops, retain the corresponding catalog mapping history.

### One Mongo command can produce several records

A collection operation can involve catalog writes, table creation or deletion, constraints, indexes, and background work. The 22 records don't represent 22 client commands.

Use the user, database, session, and transaction context to correlate related records. Asynchronous work might need extra correlation across transactions. The records describe PostgreSQL activity, not a verbatim reconstruction of the original Mongo command.

### Execution doesn't establish final commit

pgAudit records statement execution. A successful statement can still be part of a multi-statement transaction that later rolls back.

Transaction IDs help correlation, but WAL remains the authoritative source for commit and abort outcomes. If your requirement is to prove which changes committed, pgAudit alone isn't enough.

### Content redaction limits reconstruction

Disabling statement and parameter logging keeps document contents out of these audit fields. It also means the records can't reconstruct a document, its object ID, or the original predicate and update.

pgAudit doesn't provide a DocumentDB-aware mode that extracts only the logical database and collection while redacting the rest of a BSON command.

### Retention is part of the solution

pgAudit uses PostgreSQL's standard logging facility. A production audit design must also provide durable log collection, rotation, retention, access control, tamper resistance, and monitoring for dropped or unavailable logs.

If auditing wasn't enabled, or the logs were deleted, pgAudit can't reconstruct that historical activity.

## A practical starting point

For conventional actor-based auditing of writes and collection DDL:

1. Package pgAudit for your PostgreSQL major version.
2. Preload it alongside the existing DocumentDB libraries and install the extension.
3. Verify that gateway data connections use the mapped DocumentDB user roles.
4. Leave global auditing disabled and enable `write, ddl` on each audited role.
5. Keep SQL statement and parameter logging disabled; enable relation and row-count logging.
6. Reconnect clients and verify the resulting records with a representative workload.
7. Send logs to a durable, access-controlled Microsoft Purview Audit sink.
8. Retain catalog mapping history if consumers require logical collection names.

For authoritative commit outcomes, document reconstruction, or recovery after ordinary Audit logs are lost, complement this approach with [WAL-based forensic analysis](https://github.com/xgerman/documentdb-wal-audit) and an appropriate WAL-retention strategy.

The useful distinction is simple: **pgAudit records actor-attributed PostgreSQL activity; WAL-based analysis addresses what committed and what can be reconstructed.** Choose the evidence your audit requirements actually need.
