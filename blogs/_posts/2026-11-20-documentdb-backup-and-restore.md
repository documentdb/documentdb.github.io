---
title: "Backing up and restoring DocumentDB: snapshots and logical backups"
description: Back up DocumentDB with Kubernetes volume snapshots, mongodump, or PostgreSQL logical backups, including manual metadata registration and phased restore.
date: 2026-11-20
featured: false
author: DocumentDB team
category: documentdb-blog
section: blogs
tags:
  - DocumentDB
  - PostgreSQL
  - Backup
  - Restore
  - Kubernetes
  - Tutorial
---

A backup is useful only if you can restore it and use the recovered data. For DocumentDB, that means recovering more than document rows: collections must be discoverable, indexes must work, and new writes must succeed.

This guide covers the open-source, PostgreSQL-based DocumentDB project. See the [DocumentDB naming guide]({{ '/blogs/posts/documentdb-name-disambiguation/' | relative_url }}) if you are unsure which project you use.

There are three approaches worth understanding:

| Approach | Best fit | Important boundary |
| --- | --- | --- |
| Kubernetes volume snapshots | Recovering an operator-managed cluster | Requires snapshot-capable storage; not a PostgreSQL major-version migration |
| `mongodump` and `mongorestore` | Logical export and restore through the document endpoint | Pause writes for the entire export |
| `pg_dump` and `pg_restore` | PostgreSQL-level logical backup | Today, manually register the required metadata and handle scheduled jobs during restore |

Our Kubernetes operator uses volume snapshots. PostgreSQL logical backup can also be used today, but a plain dump-and-restore command pair is not sufficient on affected versions. We are working to simplify that workflow; [issue #737](https://github.com/documentdb/documentdb/issues/737) tracks the missing-metadata problem.

### What we verified

Both logical backup approaches below were verified against `documentdb-local:latest` on November 20, 2026:

| Component | Tested version |
| --- | --- |
| DocumentDB extension | `1.2-0` |
| PostgreSQL | `17.12`, Linux `arm64` |
| `pg_cron` | `1.6` |
| Database Tools | `100.18.0` |

The image resolved to `ghcr.io/documentdb/documentdb/documentdb-local@sha256:5da68829e51e55d32ccf6fb09e5733716c312a823a986976cbf817867cc3b299`. Pin the image when reproducing these results; `latest` will change.

Each logical round trip recovered five documents across two application collections, preserved representative BSON types and secondary indexes, enforced uniqueness, and allowed a new collection, write, and index afterward. The PostgreSQL test used a fresh destination database, matching roles and extension versions, and the manual registration SQL below. The operator snapshot workflow is documented separately by the operator project.

## 1. Volume snapshots with the Kubernetes operator

The [DocumentDB Kubernetes operator](https://github.com/documentdb/documentdb-kubernetes-operator) backs up the primary instance's persistent volume using Kubernetes `VolumeSnapshot` resources.

With the required CSI driver, snapshot CRDs, and `VolumeSnapshotClass` installed, an on-demand backup looks like this:

```yaml
apiVersion: documentdb.io/v1
kind: Backup
metadata:
  name: before-upgrade
  namespace: default
spec:
  cluster:
    name: my-documentdb-cluster
  retentionDays: 14
```

Apply the manifest and check that the backup completes:

```bash
kubectl apply -f backup.yaml
kubectl get backups -n default
```

For regular protection, create a scheduled backup:

```yaml
apiVersion: documentdb.io/v1
kind: ScheduledBackup
metadata:
  name: nightly
  namespace: default
spec:
  cluster:
    name: my-documentdb-cluster
  schedule: "0 2 * * *"
  retentionDays: 14
```

Restore into a **new cluster**, referencing the completed backup in its configuration:

```yaml
spec:
  bootstrap:
    recovery:
      backup:
        name: before-upgrade
```

This last snippet is part of a cluster manifest, not a complete manifest. Choose a compatible `documentDBVersion`, ideally the version used when the snapshot was taken. Do not restore onto an older schema version or use a physical snapshot to move between PostgreSQL major versions.

These snapshots do not provide continuous point-in-time recovery. Writes after the snapshot are not included. Snapshot retention also is not the same as an independent, off-cluster copy: consider what happens if the storage account, region, or Kubernetes environment is lost.

See the operator's [backup and restore guide](https://github.com/documentdb/documentdb-kubernetes-operator/blob/main/docs/operator-public-documentation/v1/operations/backup-and-restore.md) for storage prerequisites, retention behavior, and complete restore manifests.

## 2. Logical backups through the document endpoint

`mongodump` and `mongorestore` provide a logical path through DocumentDB's wire-protocol-compatible endpoint. Run them from a machine that can reach the source and destination; do not assume the Database Tools are installed in the database image.

Our test used Database Tools 100.18.0. Validate your own tool and DocumentDB versions before relying on them. The disposable test instances used self-signed certificates; the examples below assume certificates trusted by the client.

### Pause writes before exporting

Stop application writers, ingestion, administrative changes, and any background activity that changes the exported data, including TTL deletion. Wait for in-flight work to finish.

**Keep writes paused until the entire dump finishes.** Separate collections are not necessarily read at the same instant, and this endpoint does not provide an oplog-based point-in-time dump. Do not add `--oplog` or assume a successful exit makes a live export consistent.

### Export an application database

The following examples use TLS and prompt for the password rather than putting it in the command line. Replace the hosts and usernames with your own; provide a CA file if your certificates require one.

```bash
umask 077

mongodump \
  --uri='mongodb://source.example:10260/?tls=true&authSource=admin' \
  --username=backup_user \
  --db=shop \
  --archive=shop.archive.gz \
  --gzip
```

Resume source writes only after the command succeeds. Keep the archive encrypted at rest and restrict access to it.

### Restore into an empty destination database

Keep application traffic away from the destination while restoring:

```bash
mongorestore \
  --uri='mongodb://restore.example:10260/?tls=true&authSource=admin' \
  --username=restore_user \
  --archive=shop.archive.gz \
  --gzip \
  --nsInclude='shop.*' \
  --stopOnError
```

Use an empty destination rather than merging with existing data. The example deliberately omits `--drop`, which deletes destination collections before restoring them.

Do not use `--noIndexRestore` if you expect the archive's indexes to be recreated. Review the restore output for document failures and unsupported collection or index options.

This is an application-database export, not a complete deployment backup. Provision users, permissions, certificates, and service configuration separately.

## 3. PostgreSQL logical backups today

PostgreSQL logical backup is the direction we want to make simpler and preferred for PostgreSQL-level exports. You do not need to wait for the fix to use it, but **the order of operations matters**.

### Why the extra steps?

On versions affected by [#737](https://github.com/documentdb/documentdb/issues/737), `pg_dump` includes the physical document tables but omits the extension-owned collection and index catalog contents. Restoring those tables alone can leave documents on disk while the document endpoint reports that the namespace does not exist.

Collection and index ID sequences matter too: restoring existing IDs without their sequence state can break later collection or index creation.

There is a separate restore concern: creating the extensions can schedule maintenance jobs before archived `pg_cron` rows are loaded. Those generated rows can conflict with the archived jobs.

The workaround below registers the missing metadata and sequences before taking the dump, then restores in phases so generated jobs can be removed before archived jobs are loaded. No new DocumentDB binaries or restore hooks are required.

### Scope and prerequisites

This is an advanced, same-version procedure for a **single-node, self-managed DocumentDB installation**, not a distributed-cluster or cross-major migration recipe.

Before starting:

- Rehearse on disposable instances with your exact PostgreSQL, DocumentDB, and extension versions.
- Use the same PostgreSQL major and exact extension versions on both ends. Ensure the target's default extension versions match the source, because archive extension creation does not necessarily pin the source version.
- Install the required extension binaries and configure required preload libraries on the destination.
- Prepare an otherwise empty target database in a separate PostgreSQL instance. Do not run this restore over an active or already populated DocumentDB installation.
- Restore into the database configured by `cron.database_name`, commonly `postgres`.
- Provision the PostgreSQL roles referenced by the archive, including ownership and grants. `pg_dump` does not back up cluster-wide roles. Do not add `--no-owner` as a shortcut.
- Connect using the same extension-owner role on the destination as on the source. The examples use the `documentdb` administrative role from the tested image; substitute your actual administrative role.
- Use a matching PostgreSQL toolchain. Configure authentication through a protected password file or another appropriate mechanism.

The examples use the public DocumentDB schema names. They intentionally do not call any new pre-restore or post-restore hooks.

### Step 1: Quiesce the source and disable scheduled jobs

Stop application writes, schema changes, and index builds. On both instances, disable `pg_cron` job launches before proceeding:

```sql
ALTER SYSTEM SET cron.launch_active_jobs = off;
SELECT pg_reload_conf();
```

This is instance-wide. Record the original setting first, confirm the new setting has taken effect, and wait for already-running jobs and writes to finish. Disabling launches does not cancel jobs already executing. Also stop any writers outside `pg_cron`.

Check the effective setting from a new connection:

```sql
SELECT name, setting, source
FROM pg_catalog.pg_settings
WHERE name = 'cron.launch_active_jobs';
```

The setting must be `off`. A server command-line option overrides `ALTER SYSTEM`; if one is present, change that startup option and perform a controlled restart rather than assuming a reload disabled the scheduler.

Keep the source quiesced through registration and the dump. Keep destination gateways stopped until restoration finishes.

### Step 2: Register the metadata on the source

PostgreSQL normally registers extension-owned backup data with `pg_extension_config_dump()`. However, that function can only run inside an extension installation or update script, not as a standalone `SELECT` in `psql`.

The temporary administrator workaround is to add the equivalent entries to `pg_catalog.pg_extension`. **This directly modifies a PostgreSQL system catalog and requires superuser privileges.** It is not routine application SQL. Rehearse it on a disposable copy, retain an independent recovery option, and do not run it concurrently with extension installation or upgrades.

Run the following on the source using `psql` with error stopping enabled. It preserves existing registrations and adds only missing entries for the four relations involved in #737. It also checks that each relation belongs to the expected extension.

```sql
\set ON_ERROR_STOP on

BEGIN;
LOCK TABLE pg_catalog.pg_extension IN SHARE ROW EXCLUSIVE MODE;

DO $registration$
DECLARE
    extension_oid oid;
    relation_name text;
    relation_oid oid;
    registration_position integer;
    existing_condition text;
BEGIN
    SELECT oid INTO STRICT extension_oid
    FROM pg_catalog.pg_extension
    WHERE extname = 'documentdb';

    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_extension
        WHERE oid = extension_oid
          AND coalesce(cardinality(extconfig), 0)
              <> coalesce(cardinality(extcondition), 0)
    ) THEN
        RAISE EXCEPTION 'Existing extension dump registration is inconsistent';
    END IF;

    FOREACH relation_name IN ARRAY ARRAY[
        'documentdb_api_catalog.collections',
        'documentdb_api_catalog.collections_collection_id_seq',
        'documentdb_api_catalog.collection_indexes',
        'documentdb_api_catalog.collection_indexes_index_id_seq'
    ]
    LOOP
        relation_oid := relation_name::regclass::oid;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_catalog.pg_depend
            WHERE classid = 'pg_catalog.pg_class'::regclass
              AND objid = relation_oid
              AND objsubid = 0
              AND refclassid = 'pg_catalog.pg_extension'::regclass
              AND refobjid = extension_oid
              AND deptype = 'e'
        ) THEN
            RAISE EXCEPTION
                '% is not a member of the documentdb extension',
                relation_name;
        END IF;

        SELECT array_position(extconfig, relation_oid)
        INTO registration_position
        FROM pg_catalog.pg_extension
        WHERE oid = extension_oid;

        IF registration_position IS NULL THEN
            UPDATE pg_catalog.pg_extension
            SET extconfig = array_append(
                    coalesce(extconfig, ARRAY[]::oid[]), relation_oid),
                extcondition = array_append(
                    coalesce(extcondition, ARRAY[]::text[]), '')
            WHERE oid = extension_oid;
        ELSE
            SELECT extcondition[registration_position]
            INTO existing_condition
            FROM pg_catalog.pg_extension
            WHERE oid = extension_oid;

            IF existing_condition IS DISTINCT FROM '' THEN
                RAISE EXCEPTION
                    '% already has a filtered dump registration; investigate',
                    relation_name;
            END IF;
        END IF;
    END LOOP;
END;
$registration$;

COMMIT;
```

If anything fails, stop and investigate. Do not bypass an ownership or registration check. A successful registration persists for subsequent dumps of this database; it does not repair previously created archives.

### Step 3: Take and inspect the dump

Run these commands from a new, protected backup directory:

```bash
set -euo pipefail
umask 077
mkdir documentdb-backup
cd documentdb-backup

SOURCE_PG='host=source.example port=9712 dbname=postgres user=documentdb'

pg_dump --dbname="$SOURCE_PG" \
  --format=custom \
  --file=documentdb.dump

pg_restore --list documentdb.dump > archive.list

pg_dumpall --dbname="$SOURCE_PG" --roles-only --file=roles.sql

grep -E 'TABLE DATA documentdb_api_catalog (collections|collection_indexes) |SEQUENCE SET documentdb_api_catalog (collections_collection_id_seq|collection_indexes_index_id_seq) ' \
  archive.list
```

Verify that the archive contains **all four** entries: table data for `collections` and `collection_indexes`, and sequence state for their two ID sequences. A successful `pg_dump` exit alone is not enough.

Keep the archive, role export, and source version information together. `roles.sql` can contain password hashes and must be protected like the database backup. Review it and provision the required roles on the destination before restoring; do not blindly replay role creation over roles that already exist. If an archive entry is missing or an export fails, do not treat the backup as complete.

After the export and archive inspection succeed, restore the source's original scheduler setting and resume source traffic.

### Step 4: Restore structure, then data

On the isolated destination, keep scheduled job launches disabled and the gateway stopped. From the same backup directory:

```bash
set -euo pipefail

TARGET_PG='host=restore.example port=9712 dbname=postgres user=documentdb'

pg_restore --dbname="$TARGET_PG" \
  --section=pre-data \
  --exit-on-error \
  documentdb.dump
```

The pre-data phase creates extensions and tables. Compare the source and target extension versions before continuing.

On this fresh destination only, remove jobs generated during extension creation so the archive can supply the source job rows:

```bash
psql -X --dbname="$TARGET_PG" --set=ON_ERROR_STOP=1 \
  --command='TRUNCATE TABLE cron.job;'

pg_restore --dbname="$TARGET_PG" \
  --section=data \
  --exit-on-error \
  documentdb.dump
```

The archive now supplies the collection metadata and sequence state along with document data. Finish by restoring the post-data objects:

```bash
pg_restore --dbname="$TARGET_PG" \
  --section=post-data \
  --exit-on-error \
  documentdb.dump
```

The post-data phase restores objects such as indexes and constraints. Do not ignore errors or enable traffic after a partially successful restore.

### Step 5: Reconcile jobs and restart the gateway

Inspect restored `cron.job` entries before allowing them to run. Check their database, username, connection settings, schedules, and commands against the destination. A source hostname or port is not necessarily valid on a new instance. Confirm that required maintenance jobs are present and that the job ID sequence will not reuse an existing job ID.

Run the metadata registration SQL on the destination as well before taking future backups from it. Registration changes made directly to the source system catalog are not themselves reproduced by `CREATE EXTENSION` during restore.

Restore the destination's intended scheduler setting only after those checks pass. Start or restart the gateway so it discovers the recovered catalog state, then verify the restored data through the document endpoint.

The work tracked by #737 aims to remove manual metadata handling and make this process less error-prone. Until that is available in your installed version, follow the full procedure rather than relying on a plain `pg_dump` / `pg_restore` round trip.

## Verify recovery, not just command completion

For every approach, restore to an isolated environment before calling the backup strategy ready. Check that:

- Expected databases and collections are visible through the document endpoint.
- Counts and representative document contents match, including dates, decimals, arrays, nested objects, and nulls.
- Index definitions are present and unique indexes reject duplicate values.
- You can create a new collection, insert a document, and create a new index.
- Required users and permissions are in place, and maintenance jobs target the recovered instance.

Measure how long the restore and verification take. Your recovery plan needs both an acceptable recovery point and enough time to bring a usable service back.

For operator-managed recovery, start with volume snapshots. For a straightforward application-level logical export, use `mongodump` with writes paused. For PostgreSQL-level logical backup today, preserve the missing metadata explicitly and follow the restore phases carefully.
