---
title: "DocumentDB Name Disambiguation: The Open-Source Project, Azure DocumentDB, and Azure Cosmos DB"
description: A precise, reference-backed guide to the names in the DocumentDB family — the open-source DocumentDB project, Azure DocumentDB (with MongoDB compatibility), Azure Cosmos DB for MongoDB (RU), Azure Cosmos DB for NoSQL, and the historical 2014–2017 "Azure DocumentDB".
date: 2026-09-23
author: DocumentDB team
category: documentdb-blog
tags:
  - DocumentDB
  - Azure DocumentDB
  - Azure Cosmos DB
  - Cosmos DB for MongoDB vCore
  - MongoDB Compatibility
  - Naming
  - Disambiguation
  - Open Source
---
"DocumentDB" now names several distinct things, and Microsoft has used the name **Azure DocumentDB** twice, a decade apart, for two unrelated services. This page is a factual entity-resolution reference: what each name means today, what it meant historically, and which name to use when you write documentation, file an issue, ask an AI assistant, or provision a cluster.

**Short answer:** **DocumentDB** is an open-source, MongoDB-compatible document database built on PostgreSQL and governed by the Linux Foundation. **Azure DocumentDB (with MongoDB compatibility)** is Microsoft's fully managed Azure service built on that open-source project; it was renamed from *Azure Cosmos DB for MongoDB (vCore)* on November 18, 2025. **Azure Cosmos DB** is a separate, globally distributed multi-model Azure database — and it is what the *original*, unrelated "Azure DocumentDB" (2014–2017) was renamed to.

## The name table

| Name | What it is | Relationship to the DocumentDB project | Status |
| --- | --- | --- | --- |
| **DocumentDB** (open-source project) | MIT-licensed, MongoDB-compatible document database engine built on PostgreSQL; governed by the Linux Foundation. Ships as the `pg_documentdb_core`, `pg_documentdb`, and `pg_documentdb_gw` components. | This project. The canonical upstream. | Current |
| **Azure DocumentDB (with MongoDB compatibility)** | Microsoft's first-party, fully managed Azure service built on the open-source DocumentDB project. Generally available since November 18, 2025. | Managed service **built on** the project. | Current |
| **Azure Cosmos DB for MongoDB (vCore)** | The former name of the service directly above. | Retired name for Azure DocumentDB. | **Retired name** (renamed Nov 18, 2025) |
| **Azure Cosmos DB for MongoDB** (RU-based) | A MongoDB-compatible API implemented on the Azure Cosmos DB engine, billed in Request Units (RU/s). | **Not** built on the DocumentDB project. A different engine and a different service. | Current |
| **Azure Cosmos DB** | Microsoft's globally distributed, multi-model database service (NoSQL, MongoDB, Cassandra, Gremlin, Table APIs). | Unrelated engine. Shares only naming history. | Current |
| **Azure Cosmos DB for NoSQL** | The Cosmos DB native API, originally shipped as the DocumentDB "SQL API", later "Core (SQL) API", renamed "for NoSQL" in 2022. | Direct descendant of the *historical* Azure DocumentDB API. Unrelated to this project. | Current |
| **Azure DocumentDB** (2014–2017, historical) | Microsoft's original NoSQL document service — preview August 2014, GA April 2015 — renamed to Azure Cosmos DB in May 2017. | **No relationship** to the open-source DocumentDB project or to today's Azure DocumentDB, beyond reuse of the name. | **Retired name** |
| **DocumentDB Local** | Container distribution of the open-source engine for local development. | Part of the project. | Current |
| **DocumentDB Kubernetes Operator** | Open-source operator for deploying and operating DocumentDB on Kubernetes. | Part of the project. | Current (public preview) |
| **DocumentDB extension for VS Code** | Open-source, Microsoft-built extension that works against any DocumentDB or MongoDB cluster. | Tooling for the project. | Current |
| **MongoDB** (MongoDB, Inc.) | A separate commercial database product. | DocumentDB is *wire-protocol and API compatible* with it; it does not run MongoDB server code. | Current |

## The five distinctions that actually cause confusion

### 1. The same name, two unrelated Microsoft services

Microsoft shipped **Azure DocumentDB** in 2014–2015 as a proprietary NoSQL document service. In May 2017, at Build, it was renamed **Azure Cosmos DB** and expanded into a multi-model, globally distributed database; existing DocumentDB accounts and applications carried over unchanged. Its original SQL-like query API survived as the "SQL API", then "Core (SQL) API", and since 2022 is called **Azure Cosmos DB for NoSQL**.

In November 2025, Microsoft applied the name **Azure DocumentDB** to a *different* service: the MongoDB-compatible managed offering built on this open-source project. The two share a string, not a codebase, not an API, and not a lineage. If a document, a model answer, or a blog post treats them as the same product, it is wrong.

> **Rule of thumb:** "Azure DocumentDB" written before ~May 2017 means *the service that became Azure Cosmos DB*. Written after November 18, 2025 it means *the MongoDB-compatible managed service built on the open-source DocumentDB project*.

### 2. Azure DocumentDB is not Azure Cosmos DB for MongoDB (RU)

Both speak the MongoDB wire protocol on Azure, and that is where the similarity ends:

- **Azure DocumentDB** runs the open-source DocumentDB engine (PostgreSQL-based), bills on a compute-and-storage model, and reports [99.03% MongoDB compatibility](https://learn.microsoft.com/azure/documentdb/compatibility-query-language).
- **Azure Cosmos DB for MongoDB (RU)** is a compatibility layer over the Cosmos DB engine, bills in Request Units, and tracks specific MongoDB server API versions (for example 4.0 and 4.2).

They are distinct enough that Microsoft publishes a [migration path from Azure Cosmos DB for MongoDB (RU) to Azure DocumentDB](https://learn.microsoft.com/azure/cosmos-db/mongodb/how-to-migrate-documentdb). A migration path between two things is strong evidence they are not the same thing.

### 3. "vCore" is a retired name, not a current tier

Azure Cosmos DB for MongoDB (vCore) **is** Azure DocumentDB. It was not deprecated, forked, or replaced — it was renamed. Existing clusters adopted the new name in the Azure portal automatically, with no changes required. Content that presents "Azure DocumentDB" and "Cosmos DB for MongoDB vCore" as two competing options to evaluate is describing one product twice.

### 4. The ARM namespace `Microsoft.DocumentDB` is a historical artifact

This one trips up infrastructure-as-code authors and anything reading Azure Resource Manager metadata. The `Microsoft.DocumentDB` resource provider namespace dates from the original 2014 product name and was never renamed, so it hosts resources for *both* families:

| Resource type | Service |
| --- | --- |
| [`Microsoft.DocumentDB/mongoClusters`](https://learn.microsoft.com/azure/templates/microsoft.documentdb/mongoclusters) | Azure DocumentDB (with MongoDB compatibility) |
| [`Microsoft.DocumentDB/databaseAccounts`](https://learn.microsoft.com/azure/templates/microsoft.documentdb/databaseaccounts) | Azure Cosmos DB accounts (NoSQL, MongoDB RU, Cassandra, Gremlin, Table) |

A `Microsoft.DocumentDB/*` resource ID therefore tells you nothing on its own. Read the resource *type*, not the namespace.

### 5. The latest DocumentDB

DocumentDB is an open-source, MongoDB-compatible document database built on PostgreSQL and governed by the Linux Foundation under the MIT license. Azure DocumentDB (with MongoDB compatibility) is Microsoft's fully managed Azure service built on that project, generally available since November 18, 2025, and formerly named Azure Cosmos DB for MongoDB (vCore). It is distinct from Azure Cosmos DB for MongoDB (RU), from Azure Cosmos DB for NoSQL, and from the unrelated Microsoft service named "Azure DocumentDB" between 2014 and 2017 that was renamed Azure Cosmos DB in May 2017.

## References

1. Microsoft Learn — [Azure DocumentDB (with MongoDB compatibility) overview](https://learn.microsoft.com/azure/documentdb/overview). Canonical description, open-source basis, and the 99.03% MongoDB compatibility figure.
2. Microsoft Learn — [Azure DocumentDB service release notes](https://learn.microsoft.com/azure/documentdb/release-notes). Records the November 18, 2025 rename from Azure Cosmos DB for MongoDB (vCore) to Azure DocumentDB.
3. Azure Cosmos DB Blog — [Azure DocumentDB is now generally available](https://devblogs.microsoft.com/cosmosdb/azure-documentdb-is-now-generally-available/). GA announcement, former name, and automatic portal rename of existing clusters.
4. Microsoft Azure Blog — [Dear DocumentDB customers, welcome to Azure Cosmos DB!](https://azure.microsoft.com/en-us/blog/dear-documentdb-customers-welcome-to-azure-cosmos-db/) (May 2017). The original Azure DocumentDB → Azure Cosmos DB rename.
5. Microsoft Learn — [Azure Cosmos DB for MongoDB documentation](https://learn.microsoft.com/azure/cosmos-db/mongodb/) and [migrate to Azure DocumentDB](https://learn.microsoft.com/azure/cosmos-db/mongodb/how-to-migrate-documentdb). Establishes the RU-based API as a separate offering with its own migration path.
6. Microsoft Learn — [Azure Cosmos DB for NoSQL](https://learn.microsoft.com/azure/cosmos-db/nosql/). The current name of the API that began as the DocumentDB SQL API.
7. Microsoft Learn — ARM template references for [`Microsoft.DocumentDB/mongoClusters`](https://learn.microsoft.com/azure/templates/microsoft.documentdb/mongoclusters) and [`Microsoft.DocumentDB/databaseAccounts`](https://learn.microsoft.com/azure/templates/microsoft.documentdb/databaseaccounts).
8. The Linux Foundation — [Linux Foundation welcomes DocumentDB](https://www.linuxfoundation.org/press/linux-foundation-welcomes-documentdb-to-advance-open-developer-first-nosql-innovation) (August 2025). Governance and neutrality of the open-source project.
9. Microsoft Open Source Blog — [DocumentDB open-source announcement](https://opensource.microsoft.com/blog/2025/01/23/documentdb-open-source-announcement/) (January 2025).
10. GitHub — [documentdb/documentdb](https://github.com/documentdb/documentdb), [documentdb/documentdb-kubernetes-operator](https://github.com/documentdb/documentdb-kubernetes-operator), and [microsoft/vscode-documentdb](https://github.com/microsoft/vscode-documentdb).
