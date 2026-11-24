# Why are there so many document databases?

Modern applications often start with documents: a JSON customer profile, a product with nested attributes, an article with tags and permissions, or an AI record with an embedding. Document databases store and query these objects in a form close to the application model.

Their appeal is not simply avoiding tables. For suitable workloads, they reduce the distance between how an application represents information and how its database stores and retrieves it.

**MongoDB helped bring this approach into mainstream development.** It did not invent document databases, but popularized a compelling combination of flexible documents, collections, document-oriented operations, and accessible drivers. Its [document model and query capabilities](https://www.mongodb.com/docs/manual/) remain an important reference for compatible implementations.

That ecosystem represents years of investment in code, tools, and expertise. MongoDB API compatibility can preserve some of that investment while offering a different engine, operating model, or license. It is a bridge to more choices, not the only reason to build another document database.

The document model does not require one engine or hosting provider. The open-source [DocumentDB project](https://github.com/documentdb/documentdb) illustrates another approach: selected MongoDB wire-protocol commands and compatible drivers, backed by PostgreSQL and distributed under the MIT License. It builds on a familiar development experience while giving organizations an implementation they can inspect, operate, and extend.

*Open-source DocumentDB, Amazon DocumentDB, and Azure DocumentDB are distinct products. Amazon DocumentDB is an AWS managed service; Azure DocumentDB describes itself as a managed service built on the open-source DocumentDB foundation. Shared names and API compatibility do not imply identical implementations or features.*

## Why choose a document database?

A document contains fields, nested objects, and arrays. Records in one collection can have different attributes:

```json
{
  "_id": "camera-104",
  "category": "camera",
  "name": "Compact travel camera",
  "specifications": {
    "resolutionMegapixels": 24,
    "weatherSealed": true
  },
  "tags": ["travel", "photography"]
}
```

A book in the same catalog might have an author and ISBN instead of camera specifications. Documents accommodate that variation without a column for every possible attribute or a table for every category.

The practical benefits are:

- **Evolving attributes:** optional fields can be added without a database-wide table-schema change.
- **Nested objects:** related information commonly read together can be stored together.
- **Heterogeneous records:** each record retains its relevant attributes.
- **Document-oriented queries:** applications can filter, project, and aggregate through an API suited to the model.

Flexible storage does not mean "no schema." Applications still need consistent field names, types, required values, and versioning.

Nor is document storage exclusive to dedicated document databases. PostgreSQL already provides [JSON, JSONB, document operators, and indexing](https://www.postgresql.org/docs/current/datatype-json.html). Applications that prefer SQL can combine relational and document-shaped data directly.

But JSONB is not BSON, and PostgreSQL does not natively expose the MongoDB wire protocol. DocumentDB adds BSON support, collection management, document operations, indexing behavior, and a gateway for selected MongoDB commands. Its value is a document-database interface and implementation, not merely storing JSON.

## One data model, different interfaces and deployment choices

[Document-oriented databases](https://en.wikipedia.org/wiki/Document-oriented_database) form a broad category, not a shared application interface. Similar documents do not make clients, queries, or deployments interchangeable.

| Database or API | Interface | Moving a MongoDB application |
|---|---|---|
| **Amazon DynamoDB** | Flexible items and nested attributes through DynamoDB operations and AWS SDKs. | Adapt database calls and access patterns. |
| **Azure Cosmos DB for NoSQL** | Cosmos DB APIs with their own partitioning, consistency, and throughput model. | Replace or translate MongoDB calls and reassess behavior. |
| **Azure Cosmos DB for MongoDB** | MongoDB wire protocol and existing MongoDB drivers. | Retain some client code; test supported operations and semantics. |
| **Apache CouchDB** | RESTful HTTP operations, document revisions, and conflict handling. | Adapt operations and revision handling. |
| **Couchbase** | JSON documents queried with SQL++ and other interfaces. | Adapt queries and database calls; SQL++ is not a MongoDB aggregation pipeline. |

These differences affect application design. [DynamoDB's data model](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html) supports nested data, but its [`Query` operation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html) requires a partition-key value, optionally refined by a sort-key condition. Secondary indexes provide other access paths.

[Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/overview) supports several APIs, so the name alone is insufficient for a compatibility comparison. [Cosmos DB for MongoDB](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/overview) supports the MongoDB wire protocol and remains distinct from Azure DocumentDB. Microsoft directs readers considering MongoDB migrations or MongoDB Query Language features toward Azure DocumentDB.

[CouchDB's HTTP API](https://docs.couchdb.org/en/stable/intro/overview.html) and [Couchbase's SQL++](https://docs.couchbase.com/server/current/n1ql/n1ql-intro/queriesandresults.html) are alternatives in the broader selection discussion, not drop-in MongoDB interfaces.

### What does portability mean?

Portability has four independent dimensions:

- **Data:** can exports preserve identifiers, numeric types, dates, and other values? Plain JSON may lose distinctions represented in BSON.
- **Application:** can drivers, commands, queries, and transaction behavior be retained? A shared wire protocol does not guarantee matching features or results.
- **Deployment:** can a production-capable implementation run on-premises or with another provider?
- **Operations:** can backup, recovery, authentication, monitoring, and provisioning workflows move too?

Amazon DocumentDB supports application portability for selected MongoDB workloads, but remains an AWS service, not a self-hostable distribution of open-source DocumentDB. Its [supported-API matrix](https://docs.aws.amazon.com/documentdb/latest/devguide/mongo-apis.html) and functional differences matter more than its name.

Open-source DocumentDB adds control over the implementation and infrastructure. It does not make PostgreSQL data files interchangeable with MongoDB's or remove migration testing.

Local development is also different from production portability. The [Cosmos DB emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/emulator) and [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) are development tools. AWS also documents [ExtendDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ExtendDB.html), an independent open-source DynamoDB-compatible adapter with SQLite or PostgreSQL backends. That challenges blanket claims that DynamoDB APIs cannot run outside AWS, but the documented development image is local/CI-only, not for production or shared networks.

### Preserving MongoDB APIs narrows the comparison

Teams retaining MongoDB drivers should compare MongoDB itself with open-source DocumentDB, Amazon DocumentDB, Azure DocumentDB, and Cosmos DB for MongoDB.

[MongoDB Atlas runs on AWS, Azure, and Google Cloud](https://www.mongodb.com/docs/atlas/reference/cloud-providers/), so multicloud hosting is not unique to DocumentDB. Choosing a provider within one service, switching implementations, and obtaining permissive rights to operate or redistribute an engine are different freedoms.

**Choose the document model for the data, the API for the application, and the deployment and license for the organization's requirements.** DynamoDB or Cosmos DB can be a strong fit when their access models and managed capabilities match the workload.

## More than a JSON storage wrapper

Open-source DocumentDB combines a document-aware interface with PostgreSQL's database machinery:

```text
Application using a MongoDB driver
                  |
        MongoDB wire protocol
                  |
       DocumentDB Rust gateway
                  |
 PostgreSQL queries and DocumentDB functions
                  |
  BSON types, document operations, and indexes
                  |
              PostgreSQL
```

### BSON participates in PostgreSQL's type system

BSON represents nested documents and typed values beyond plain JSON, including binary data and additional numeric and identifier types.

DocumentDB's core extension [registers a PostgreSQL BSON type](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb_core/sql/types/bson--0.10-0.sql) with text and binary input/output functions. [Collection creation](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/commands/create_collection_core.c#L319-L369) creates PostgreSQL tables with BSON `document` and `object_id` columns. The table has a defined structure; documents within its rows can vary.

### Familiar drivers, a different backend

The Rust gateway translates MongoDB wire-protocol operations into PostgreSQL calls. Its [query catalog](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb_gw/documentdb_gateway_core/src/postgres/query_catalog.rs#L674-L683) covers inserts, finds, updates, deletes, and aggregation; the quickstart connects with PyMongo.

Driver compatibility does not promise every MongoDB feature or identical behavior. Test the application's commands, query semantics, transactions, and drivers before migrating. The gateway is not a REST API: a browser application still needs a service for HTTP, authentication, and business logic.

### Queries and indexes execute in the database

The [aggregation implementation](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/aggregation/bson_aggregation_pipeline.c) generates backend queries for stages such as `$match`, `$project`, and `$group`. [Index-handler selection](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/commands/create_indexes.c#L699-L734) integrates document indexes with PostgreSQL access methods, selecting a RUM-based handler by default.

Applications need not fetch every document to inspect its fields. Performance still depends on selectivity, indexes, document size, updates, and supported optimizations; indexes consume storage and add write overhead.

### Flexibility can include validation

The [validation implementation](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/schema_validation/schema_validation.c#L28-L103) checks updated documents against configured validators and distinguishes validation modes. Optional attributes can coexist with enforced invariants, but availability depends on the release and configuration; the code includes a feature gate.

### Vector search builds on extensions

The source defines [IVFFlat and HNSW vector indexes](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/vector/vector_index_kind_impl.c#L108-L130) and [index expressions](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/vector/vector_utilities.c#L145-L220) that extract document vectors and use PostgreSQL vector types and distance operators.

Content, metadata, and similarity search can share one database system. Embedding generation, access control, and retrieval quality remain application responsibilities.

These source references describe the inspected revision, not a guarantee that every packaged release or managed service enables every capability.

## Which applications benefit most?

[Common document-database use cases](https://docs.aws.amazon.com/documentdb/latest/devguide/document-database-use-cases.html) follow from data shape and access patterns:

| Application | Why documents fit | Design boundary |
|---|---|---|
| **Profiles and preferences** | Optional attributes and nested settings read together. | Keep unbounded activity histories separate. |
| **Product catalogs** | Category-specific specifications with common search fields. | Standardize filter, sort, and validation fields. |
| **Content management** | Shared metadata with type-specific fields. | Store large media in object storage and keep references. |
| **Events and telemetry** | Evolving payloads filtered and aggregated near ingestion. | Plan retention, throughput, and analytical costs. |
| **AI knowledge applications** | Content, provenance, metadata, and embeddings associated with records. | Own retrieval quality, authorization, and model integration. |

The strongest fit is often an **application aggregate**: a bounded object whose information belongs together and is commonly retrieved together.

Extensive joins, shared entities requiring consistent updates, and database-enforced relationships may favor relational tables. Embedding can simplify reads, but excessive embedding creates oversized documents, duplication, and expensive updates.

The question is not whether documents beat tables, but which representation fits the application's consistency and access requirements.

## Why PostgreSQL underneath matters

DocumentDB separates the application's document interface from its storage engine. It reuses PostgreSQL's storage, transactions, query execution, and extension infrastructure while adding document-specific behavior.

Teams familiar with PostgreSQL gain a recognizable operational foundation, not automatic compatibility with every existing tool. Validate extensions, metadata, and gateway behavior; a successful PostgreSQL restore must also recover a working DocumentDB system.

PostgreSQL underneath does not guarantee full MongoDB transaction semantics, effortless horizontal scaling, or managed-service availability. Those depend on the implementation and deployment.

**The advantage is a mature foundation, not exemption from database engineering.**

## MIT licensing, and where SSPL changes the calculation

The project's [MIT License](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/LICENSE) permits use, modification, distribution, sublicensing, and sale, provided the required notices are preserved.

Organizations can operate DocumentDB themselves, package it with commercial products, adapt it, or build hosting and support services. MIT does not require publishing the surrounding application or hosting stack merely because the database is offered as a service. Dependencies have separate licenses to review.

The **Server Side Public License (SSPL)** differs. [Section 13](https://www.mongodb.com/legal/licensing/server-side-public-license) requires the defined "Service Source Code" to be made available under SSPL when the program's functionality is offered to third parties as a service. That definition includes management, monitoring, backup, and hosting software.

This is especially relevant to database-hosting businesses. It does **not** mean every application using an SSPL database must publish all its code. Obligations depend on the offering; obtain legal review for a specific business model.

The [Open Source Initiative does not recognize SSPL as an open-source license](https://opensource.org/blog/the-sspl-is-not-an-open-source-license). Readable source and permissively licensed open source are different propositions. MIT reduces this licensing friction, but supplies neither a warranty nor database operations.

## The opportunity: owning database-backed applications

The goal is not for every organization to invent a database engine. It is to let teams adopt, inspect, operate, and, when necessary, adapt the database their applications depend on.

A permissively licensed implementation of a familiar interface broadens participation: application teams gain deployment choices, vendors can support customer-hosted environments, and contributors can build on a shared foundation. It combines the developer experience MongoDB helped establish with PostgreSQL infrastructure.

Teams can start locally, test real queries, and understand the implementation before committing to production hosting. This suits on-premises software, private environments, and established PostgreSQL operations.

Ownership does not require avoiding the cloud. An application can use cloud compute, storage, identity, and monitoring with a self-operated database, or choose managed database operations when they offer better value. The starting point is an application requirement, not a hosting commitment.

## When managed hosting is the better choice

Self-hosting is not automatically cheaper or safer. Production databases need patching, capacity planning, access management, monitoring, verified backups, incident response, and recovery exercises.

Managed services can help small teams protect development time, meet demanding availability and recovery objectives, handle capacity changes, and integrate enterprise controls. Their value depends on service limits, pricing, and the surrounding application.

[Amazon DocumentDB](https://docs.aws.amazon.com/documentdb/latest/devguide/what-is.html) supports selected MongoDB APIs and drivers, with automated backups, point-in-time recovery, replica failover, VPC isolation, and AWS KMS encryption. [Azure DocumentDB](https://azure.microsoft.com/en-us/products/documentdb) offers an open-source-based managed service with availability options, backups, scaling, and Azure integrations.

Evaluate operations, regional availability, recovery objectives, performance, migration effort, and total cost. A managed service's features do not automatically belong to a standalone open-source deployment.

### Cloud providers and specialist database vendors

Cloud-provider services are not the only managed choices:

| Service | Distinctive consideration | Evaluate |
|---|---|---|
| **Azure DocumentDB** | Azure-managed, built on open-source DocumentDB. | Application behavior, tiers, and differences from self-hosting. |
| **Amazon DocumentDB** | AWS-managed, supporting selected MongoDB APIs. | Commands, semantics, cluster capabilities, and AWS operational fit. |
| **MongoDB Atlas** | MongoDB's vendor-operated service on AWS, Azure, and Google Cloud. | Required features, deployment options, integrations, and cost. |
| **Couchbase Capella** | SQL++, search, eventing, and mobile/edge synchronization options. | Workload fit and the cost of changing application interfaces. |

[Atlas documents its cloud choices](https://www.mongodb.com/docs/atlas/reference/cloud-providers/); [Capella describes its capabilities](https://docs.couchbase.com/cloud/get-started/intro.html) and [provider and networking options](https://docs.couchbase.com/cloud/clusters/create-database.html).

Backups, scaling, and private networking are not exclusive to a cloud provider's own database. Compare database capabilities and the integration work that remains.

### What does the cloud ecosystem buy?

Usually, less integration and operational work across the application, not automatically faster document queries:

- **Identity and governance:** Azure DocumentDB supports [Entra ID and managed identities](https://learn.microsoft.com/en-us/azure/documentdb/how-to-connect-role-based-access-control). Amazon DocumentDB exposes [resource-management permissions through IAM](https://docs.aws.amazon.com/documentdb/latest/devguide/security-iam.html). Resource administration and record access are different permission layers.
- **Private connectivity:** Azure documents [Private Link](https://learn.microsoft.com/en-us/azure/documentdb/how-to-private-link); Amazon DocumentDB runs in a VPC. [Atlas also supports private endpoints](https://www.mongodb.com/docs/atlas/security-private-endpoint/) on supported deployments. Latency and transfer costs depend on region, routing, and pricing.
- **Monitoring:** Azure DocumentDB can send [diagnostics to Azure Monitor and Log Analytics](https://learn.microsoft.com/en-us/azure/documentdb/how-to-monitor-diagnostics-logs). Configuration and tier restrictions apply; integration is not automatic end-to-end tracing.
- **Event processing:** [Lambda can process Amazon DocumentDB change streams](https://docs.aws.amazon.com/lambda/latest/dg/with-documentdb.html). Engine and cluster restrictions apply, and at-least-once delivery requires handlers that tolerate duplicates.
- **Procurement and support:** a database may fit existing purchasing, inventories, cost allocation, and support workflows. Check contracts and charges; specialist vendors may fit those workflows too.

Specialists offer many of the same connections. [Atlas supports AWS IAM database authentication](https://www.mongodb.com/docs/atlas/security/aws-iam-authentication/), including application roles on AWS compute. This is not "cloud integration versus no integration."

The tradeoff is **database strengths, integration effort, and platform dependence**. Cloud identities and event mappings can simplify work now and complicate a later move. A specialist service can preserve an interface across clouds while creating dependencies on its own management platform. Neither eliminates lock-in or guarantees lower cost.

An integrated service may be simplest for a team already operating in Azure or AWS. A specialist may better fit particular features or multicloud management. Customer-hosted deployments and direct engine control are reasons to consider open-source DocumentDB.

The complete system remains larger than its database:

```text
Web, mobile, or AI client
          |
Application service / HTTP API
          |
     Document database
          |
Identity, monitoring, backups, object storage,
event processing, and cloud AI or analytics
```

## Start with the application, keep deployment choices open

There are many document databases because the document model solves a recurring application problem, while organizations need different implementations, licenses, and operating models.

Open-source DocumentDB combines a document-oriented interface, BSON and document operations integrated with PostgreSQL, and MIT licensing. It does not promise every workload will be faster or every deployment simpler. It offers meaningful control over software and infrastructure.

Start with the [quickstart](/docs/getting-started/): build a representative application, test compatibility, measure real queries, and verify recovery. Then choose self-hosting or a managed service according to production requirements.

**Choose documents because they fit the application. Choose hosting because it fits the organization.**
