# Why are there many document databases now? A Perspective from an open-source DocumentDB

Modern applications often work with documents before they work with databases. A customer profile arrives as JSON. A product has nested attributes. A content item combines text, tags, permissions, and references to media. An AI application associates those records with embeddings.

Document databases let developers persist and query data in a form close to these application objects. Their appeal is not simply that they avoid tables. It is that, for suitable workloads, they reduce the distance between how an application represents information and how its database stores and retrieves it.

**MongoDB deserves recognition as a trailblazer in bringing this approach to mainstream application development.** It did not invent document databases, but helped popularize a compelling combination: flexible JSON-like documents, collections, document-oriented queries and updates, and drivers that make those operations accessible from application code. Its [document model and query capabilities](https://www.mongodb.com/docs/manual/) remain a foundational reference point for implementations supporting MongoDB APIs.

That influence goes beyond storing documents. Developers have invested in MongoDB APIs, tools, frameworks, and expertise. Compatible implementations can preserve part of that investment while offering different engines, operating models, or licensing terms. Compatibility is therefore a useful bridge, not the entire reason to build another document database.

But the document model does not dictate a single database engine, license, or hosting provider. That helps explain why there are multiple document databases: organizations want similar development experiences with different choices about infrastructure, operations, compatibility, and ownership.

The open-source [DocumentDB project](https://github.com/documentdb/documentdb) illustrates one approach: implement selected MongoDB wire-protocol commands and support compatible drivers, using PostgreSQL as the underlying engine, and distribute the project under the MIT License. The opportunity is to make that familiar development model available through a permissively licensed implementation that organizations can inspect, operate, and extend -- adding choices rather than dismissing MongoDB's contribution.

*A naming distinction matters: open-source DocumentDB, Amazon DocumentDB, and Azure DocumentDB are not interchangeable names for one product. Amazon DocumentDB is an AWS managed service. Azure DocumentDB describes itself as a managed service built on the open-source DocumentDB foundation. Shared terminology and MongoDB compatibility do not establish identical implementations or feature sets.*

## Why choose a document database?

A document database stores records as documents containing fields, nested objects, and arrays. Documents within a collection can have different attributes.

Consider a product catalog:

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

A book in the same catalog might have an author and ISBN rather than camera specifications. A document model accommodates these differences without requiring a column for every possible attribute or a separate table for every product category.

The practical advantages are conditional, but meaningful:

- **Evolving attributes:** adding an optional document field can avoid a database-wide table-schema change.
- **Nested application objects:** related information frequently read together can be stored together.
- **Heterogeneous records:** different record types can retain their relevant attributes without populating a large set of irrelevant columns.
- **Document-oriented queries:** applications can filter fields, project selected values, and aggregate documents through an API suited to their data model.

None of this means "no schema." Applications still need agreements about field names, types, required values, and versioning. Flexible storage moves some schema decisions out of table definitions; it does not remove the need for data discipline.

Nor are these capabilities exclusive to dedicated document databases. PostgreSQL has [native JSON and JSONB types, document-processing operators, and JSONB indexing](https://www.postgresql.org/docs/current/datatype-json.html). Applications that prefer SQL can already combine relational and document-shaped data without adopting a separate document API.

That native support should not be confused with MongoDB compatibility. PostgreSQL's JSONB is not BSON, and PostgreSQL does not natively expose the MongoDB wire protocol. DocumentDB adds BSON support through an extension, together with collection management, document operations, indexing behavior, and a gateway implementing selected MongoDB wire-protocol commands. Its additional value is this document-database interface and implementation -- not merely the ability to store JSON.

## A broad category, with different interfaces and deployment choices

As [an overview of document-oriented databases](https://en.wikipedia.org/wiki/Document-oriented_database), it describes a broad category, not a common application interface. MongoDB, Azure Cosmos DB, Amazon DynamoDB, Apache CouchDB, and Couchbase all support document-shaped data, but that does not make their clients, queries, or deployment models interchangeable.

These products compete on developer interfaces, workload capabilities, operational services, and ownership. **MongoDB API compatibility connects some of them to an established application ecosystem; portability is a possible benefit, not the defining feature of document databases.** A database can be document-oriented without accepting MongoDB commands. Conversely, a service can accept MongoDB commands without making its underlying engine available for self-hosting.

### Similar documents do not imply compatible applications

| Database or API | Document-oriented capabilities and interface | What changes when moving a MongoDB application? |
|---|---|---|
| **Amazon DynamoDB** | Flexible items with nested attributes, accessed through DynamoDB operations and AWS SDKs. | Database calls and access patterns generally need adaptation; storing nested data is not MongoDB protocol compatibility. |
| **Azure Cosmos DB for NoSQL** | Flexible document storage through Cosmos DB APIs and SDKs, with its own partitioning, consistency, and throughput model. | MongoDB calls must be replaced or translated, and database-specific behavior must be reconsidered. |
| **Azure Cosmos DB for MongoDB** | A separate Cosmos DB API supporting the MongoDB wire protocol and existing MongoDB drivers. | Some client code can be retained, but supported operations and service semantics still need testing. |
| **Apache CouchDB** | Documents exposed through a RESTful HTTP API, with document revisions and optimistic conflict handling. | HTTP operations and revision handling are not substitutes for MongoDB commands; application adaptation is required. |
| **Couchbase** | JSON documents queried with SQL++, alongside its other data-access interfaces. | SQL++ queries are not MongoDB aggregation pipelines; application queries and database calls need adaptation. |

These distinctions are grounded in the products' own documentation. [DynamoDB's data model](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html) permits varying attributes and nested documents, while its [`Query` operation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html) requires a specific partition-key value, optionally refined by a sort-key condition. Secondary indexes provide additional access paths. This encourages deliberate key and access-pattern design rather than treating every document field as an interchangeable query entry point.

[Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/overview) combines document storage with managed global distribution and other data models. Crucially, **"Cosmos DB" alone is not precise enough for a compatibility comparison**: [Cosmos DB for MongoDB](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/overview) explicitly supports the MongoDB wire protocol. It belongs in MongoDB comparisons too. Microsoft currently directs readers considering MongoDB migrations or MongoDB Query Language features toward Azure DocumentDB, while retaining Cosmos DB for MongoDB as a distinct offering.

[CouchDB's HTTP interface](https://docs.couchdb.org/en/stable/intro/overview.html) and [Couchbase's SQL++ queries](https://docs.couchbase.com/server/current/n1ql/n1ql-intro/queriesandresults.html) illustrate why document storage alone does not establish a shared API. They are alternatives in the broader database-selection discussion, even when they are not direct substitutes for an existing MongoDB application.

### What does "portable" actually mean?

Portability has several independent dimensions:

- **Data portability:** can records be exported and imported while preserving identifiers, numeric types, dates, and other values? JSON export alone may lose distinctions represented in BSON or other typed formats.
- **Application portability:** can drivers, commands, queries, and transaction behavior be retained? A shared wire protocol reduces rewriting, but does not guarantee matching results or supported features.
- **Deployment portability:** can a production-capable implementation run on-premises or with a different infrastructure provider?
- **Operational portability:** can backup, recovery, authentication, monitoring, and provisioning workflows move too? Those often remain specific to an engine or cloud service.

For example, Amazon DocumentDB improves application portability for supported MongoDB workloads, but its managed service is an AWS offering, not a self-hostable distribution of the open-source DocumentDB engine. Its [supported-API matrix](https://docs.aws.amazon.com/documentdb/latest/devguide/mongo-apis.html) and functional-difference documentation matter more than the shared product name.

Open-source DocumentDB adds a different dimension: the implementation is available to operate and modify on infrastructure an organization controls. That expands deployment choice, but does not make PostgreSQL data files interchangeable with MongoDB's, or eliminate migration and compatibility testing.

Local development also should not be confused with production deployment freedom. The [Cosmos DB emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/emulator) is intended for development, not production. [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) supports offline development and testing. AWS now also documents [ExtendDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ExtendDB.html), an independent open-source DynamoDB-compatible adapter using backends such as SQLite or PostgreSQL. This is an important counterexample to a blanket claim that DynamoDB APIs cannot be implemented outside AWS; however, AWS describes the documented development image as local/CI-only, not suitable for production or shared networks.

### Narrowing the comparison to implementations supporting MongoDB APIs

For teams that specifically want to preserve MongoDB drivers and document operations, the relevant comparison includes **open-source DocumentDB, Amazon DocumentDB, Azure DocumentDB, and Cosmos DB for MongoDB**, alongside MongoDB itself.

MongoDB itself also offers deployment choices. [MongoDB Atlas supports AWS, Azure, and Google Cloud](https://www.mongodb.com/docs/atlas/reference/cloud-providers/), demonstrating that multicloud hosting is not exclusive to open-source DocumentDB. Choosing a cloud provider within one managed product, switching database implementations, and obtaining permissive rights to operate or redistribute an engine are nevertheless different freedoms.

The practical conclusion is not that broader document databases are unsuitable. DynamoDB or Cosmos DB may be a strong fit when their access models and managed capabilities match the application. **Choose the document model for the data, the API for the application, and the deployment and license for the organization's portability requirements.**

## What makes open-source DocumentDB a database, rather than a JSON storage wrapper?

The implementation provides a useful way to evaluate the claims.

At a high level, its architecture is:

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

### BSON is a native PostgreSQL type

DocumentDB uses BSON, a binary document format that supports nested structures and typed values beyond plain JSON, including binary data and additional numeric and identifier types.

The core extension [registers a PostgreSQL BSON type](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb_core/sql/types/bson--0.10-0.sql), with text and binary input/output functions. The document representation is therefore integrated into PostgreSQL's type system, rather than stored only as application-managed text.

The collection-creation code supplies another concrete detail: [it creates PostgreSQL tables](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/commands/create_collection_core.c#L319-L369) containing a BSON `document` column and a separate BSON `object_id` column.

This explains how flexible documents and relational storage coexist. The physical table has a defined structure; the document inside a row can carry varying fields.

### Familiar drivers connect to a document-aware backend

The Rust gateway parses MongoDB wire-protocol messages and translates operations into PostgreSQL calls. Its [query catalog](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb_gw/documentdb_gateway_core/src/postgres/query_catalog.rs#L674-L683) includes calls for inserting, finding, updating, deleting, and aggregating documents.

The benefit is a familiar application interface without requiring the storage engine itself to be MongoDB. The project's quickstart, for example, connects using PyMongo.

However, **support for MongoDB drivers and selected commands does not mean identical behavior to every MongoDB version or feature**. Applications should test their actual commands, query semantics, transaction requirements, and driver behavior before migrating.

The gateway is also not a REST API. A browser-facing HTTP application normally needs an application service that handles authentication, business logic, and database access.

### Documents can be queried and indexed -- not just retrieved whole

The [aggregation implementation](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/aggregation/bson_aggregation_pipeline.c) generates backend queries for document pipelines, including stages such as `$match`, `$project`, and `$group`.

Document indexes are integrated with PostgreSQL access methods. The [index-handler selection code](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/commands/create_indexes.c#L699-L734), for example, selects a RUM-based handler by default and checks whether an alternative handler supports the requested index capabilities.

The architectural advantage is that document queries can use database execution and indexing machinery rather than requiring an application to fetch every record and inspect it.

This is not a universal performance claim. Query selectivity, index choice, document size, update frequency, and supported optimizations still determine results. Indexes also consume storage and add write overhead.

### Flexibility can coexist with validation

The [schema-validation implementation](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/schema_validation/schema_validation.c#L28-L103) checks updated documents against configured validators and distinguishes validation behavior for different modes.

That matters for evolving applications: teams can allow optional attributes while still enforcing important invariants. Availability and behavior should be checked against the deployed release and configuration; the code includes a feature gate.

### Vector search builds on PostgreSQL extensions

For AI-oriented applications, the source includes definitions for [IVFFlat and HNSW vector indexes](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/vector/vector_index_kind_impl.c#L108-L130). It also [generates index expressions](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/pg_documentdb/src/vector/vector_utilities.c#L145-L220) that extract document vectors and use PostgreSQL vector types and distance operator classes.

This can bring document content, metadata, and similarity search into one database system. It does not eliminate the need to generate embeddings, enforce access controls, or evaluate retrieval quality.

These source references demonstrate implementation mechanisms in the inspected revision -- not a promise that every capability is enabled in every packaged release or managed service.

## Which applications benefit most?

AWS's [document-database use cases](https://docs.aws.amazon.com/documentdb/latest/devguide/document-database-use-cases.html) identify user profiles, operational data, and content management. These are useful starting points because their suitability follows from the shape and access patterns of the data.

| Application | Why documents can fit | Important design boundary |
|---|---|---|
| **User profiles and preferences** | Users supply different optional attributes; settings often form nested objects read together. | Keep frequently updated or unbounded activity histories separate from the profile. |
| **Product catalogs** | Categories have different specifications, while applications share common search fields. | Standardize the fields used for filtering, sorting, and validation. |
| **Content management** | Articles, comments, and other content types combine common metadata with type-specific fields. | Large images and videos are often better kept in object storage, with references in documents. |
| **Operational events and telemetry** | Sources produce evolving payloads that can be filtered and aggregated near ingestion. | Retention, ingestion throughput, and analytical query costs still need explicit planning. |
| **AI knowledge applications** | Content, provenance, metadata, and embeddings can be associated with the same records. | Retrieval quality, authorization, and model integration remain application responsibilities. |

The strongest fit is often an **application aggregate**: a bounded object whose information belongs together and is commonly retrieved together.

A document model is less compelling when the workload depends on extensive joins, shared entities that must be updated consistently across many records, or database-enforced relationships. Relational tables may be clearer for accounting, inventory invariants, and highly interconnected transactional data.

Embedding can reduce joins for suitable reads, but excessive embedding can create oversized documents, duplicated information, and expensive updates. The right question is not "Are documents better than tables?" It is "Which representation best matches this application's consistency and access requirements?"

## Why PostgreSQL underneath matters

Building on PostgreSQL separates two decisions that are often bundled together: the application's document interface and the underlying database engine.

DocumentDB can use PostgreSQL's storage, transaction, query-execution, and extension infrastructure while adding document-specific behavior. For organizations already familiar with PostgreSQL, this offers a recognizable foundation for operations and troubleshooting.

It also creates an opportunity to reuse existing database expertise rather than introduce an entirely unfamiliar engine. PostgreSQL's extension ecosystem is visible in the vector-search implementation, for example.

There are limits to that benefit. Existing PostgreSQL tooling must be validated with DocumentDB's extensions, metadata, and gateway. Backup restoration must recover a working DocumentDB system, not merely produce a successful PostgreSQL restore command.

Likewise, PostgreSQL underneath does not automatically guarantee complete MongoDB transaction semantics, effortless horizontal scaling, or managed-service availability. Those depend on the DocumentDB implementation and deployment architecture.

**The advantage is a mature foundation -- not exemption from database engineering.**

## Why the MIT License matters -- and where SSPL changes the calculation

The project's [MIT License](https://github.com/documentdb/documentdb/blob/a5f1636269e5062fa22a24bfa4d58d3cc92a0bc7/LICENSE) permits using, modifying, distributing, sublicensing, and selling the software, subject to preserving the required copyright and permission notices.

For an organization building applications, this provides considerable freedom to:

- Operate the database on its own infrastructure.
- Package it with a commercial product.
- Modify the implementation for specific requirements.
- Build hosting or support services around it.

The MIT License does not impose a requirement to publish the surrounding application or hosting stack merely because the database is offered as a service. Dependencies have their own licenses, however, and should be reviewed separately.

That differs materially from the **Server Side Public License (SSPL)**: [Section 13 of the SSPL](https://www.mongodb.com/legal/licensing/server-side-public-license) requires that, when the program's functionality is offered to third parties as a service, the defined "Service Source Code" be made available to everyone by network download at no charge under the SSPL. Its definition includes software used to provide the service, such as management, monitoring, backup, and hosting software.

This is especially relevant to database-hosting businesses and products that expose database functionality. It should **not** be reduced to the claim that every application using an SSPL database must publish all its code. The applicable obligations depend on what is being offered and how; legal review is appropriate for a specific business model.

The [Open Source Initiative does not recognize SSPL as an open-source license](https://opensource.org/blog/the-sspl-is-not-an-open-source-license). Publicly readable source and permissively licensed open source are different propositions.

MIT licensing reduces this particular licensing friction. It does not supply a warranty, pay infrastructure bills, or remove operational responsibilities.

## The opportunity: organizations can own their database-backed applications

The broader vision, and like the reality, is not that every organization should create a new database engine. It is that organizations should be able to adopt, inspect, operate, and -- when necessary -- adapt the database on which their applications depend.

An open, permissively licensed implementation of a familiar document interface can broaden participation: application teams gain deployment choices, software vendors can serve customer-hosted environments, and contributors and service providers can build on a shared foundation. Those benefits can extend beyond the users of any one hosting service. This builds on the developer experience MongoDB helped establish, while using PostgreSQL's database infrastructure rather than requiring every project to create a storage engine from scratch.

An open-source document database makes that practical without requiring an immediate commitment to a particular managed service. A team can begin locally, validate its data model, test its real queries, and understand the implementation before deciding where production should run.

That can suit customer-hosted software, on-premises deployments, private environments, and teams with established PostgreSQL operations.

Ownership is not the same as isolation from the cloud. The same application may use cloud compute, object storage, identity, and monitoring while retaining a self-operated database. Alternatively, the team may conclude that managed database operations provide better value.

Either way, the starting point can be an application requirement rather than a hosting commitment.

## When cloud hosting or database-as-a-service is the better choice

Self-hosting is not automatically cheaper or safer. Operating a production database requires patching, capacity planning, access management, monitoring, backup verification, incident response, and recovery exercises.

Managed services become particularly valuable in these scenarios:

| Scenario | Why managed hosting can help |
|---|---|
| **A small team needs production reliability** | Database maintenance and on-call work would otherwise compete with application development. |
| **Availability and recovery objectives are demanding** | Managed failover, backups, and recovery capabilities can reduce implementation and operational effort. |
| **Capacity changes significantly** | Provider-supported scaling can simplify provisioning, subject to service limits and pricing. |
| **Enterprise controls must integrate with cloud infrastructure** | Private networking, encryption-key management, monitoring, and governance may be easier to standardize. |
| **The application is part of a broader cloud solution** | Database operations can be integrated with application hosting, identity, event processing, storage, analytics, and AI services. |

[Amazon DocumentDB](https://docs.aws.amazon.com/documentdb/latest/devguide/what-is.html) provides a fully managed service supporting selected MongoDB APIs and drivers. Its documentation describes automated backups and point-in-time recovery, replica-based failover, VPC isolation, and encryption integrated with AWS KMS.

[Azure DocumentDB](https://azure.microsoft.com/en-us/products/documentdb) describes an open-source-based managed document database with high-availability options, backups, scaling, and Azure integrations for security, monitoring, application hosting, and AI.

Neither service should be selected by name or compatibility status alone. Evaluate supported operations, regional availability, recovery objectives, workload performance, migration effort, and total cost. Managed-service features are not automatically capabilities of a standalone open-source deployment.

### Cloud-provider services versus specialist database vendors

Azure DocumentDB and Amazon DocumentDB are not the only managed choices. Specialist database vendors also operate services on public clouds. Examples include MongoDB Atlas and Couchbase Capella; "specialist" here describes their database-centered offerings, not an absence of cloud integrations.

| Service | Distinctive consideration | What to evaluate |
|---|---|---|
| **Azure DocumentDB** | An Azure-managed service built on the open-source DocumentDB foundation, with Azure resource management and identity integration. | Supported application behavior, service-tier capabilities, and how closely the managed deployment matches a self-operated deployment. |
| **Amazon DocumentDB** | An AWS-managed database supporting selected MongoDB APIs, integrated with AWS infrastructure and services. | Supported commands and semantics, cluster-specific capabilities, and fit with existing AWS operations. |
| **MongoDB Atlas** | A managed offering from the vendor developing MongoDB, available on AWS, Azure, and Google Cloud. | Required MongoDB features, deployment options, cloud integrations, and total cost. |
| **Couchbase Capella** | A managed document database with SQL++ querying, search, eventing, and mobile/edge synchronization options. | Whether those capabilities fit the application better than retaining MongoDB APIs, and the cost of changing application interfaces. |

The [Atlas cloud-provider documentation](https://www.mongodb.com/docs/atlas/reference/cloud-providers/) establishes its hosting choices. [Capella's documentation](https://docs.couchbase.com/cloud/get-started/intro.html) describes its database, search, eventing, and mobile capabilities, while its [cluster-creation guide](https://docs.couchbase.com/cloud/clusters/create-database.html) documents cloud-provider selection and private-networking options.

**Managed backups, scaling, and private networking are not exclusive advantages of a cloud provider's own database service.** The more useful comparison is how much work remains to integrate each service into the organization's operating environment, and whether its database capabilities meet the workload.

### What does the surrounding cloud ecosystem actually buy?

The benefit is usually less integration and operational work across the complete application, not an automatic improvement in document-query performance.

**Shared identity and governance.** A database that fits existing identity and resource-management practices can reduce separate credential systems and administrative workflows. Azure DocumentDB supports [Microsoft Entra ID authentication, including managed identities](https://learn.microsoft.com/en-us/azure/documentdb/how-to-connect-role-based-access-control). Amazon DocumentDB exposes [resource-management permissions through AWS IAM](https://docs.aws.amazon.com/documentdb/latest/devguide/security-iam.html). Resource administration and permission to read or write database records are different layers; one must not be mistaken for the other.

**Private application-to-database connectivity.** Using private network paths can avoid exposing a database endpoint publicly and align connectivity with existing network controls. Azure DocumentDB documents [Private Link connectivity](https://learn.microsoft.com/en-us/azure/documentdb/how-to-private-link), while Amazon DocumentDB runs within a VPC. This is not an exclusive cloud-provider advantage: [Atlas supports private endpoints](https://www.mongodb.com/docs/atlas/security-private-endpoint/) through AWS PrivateLink, Azure Private Link, and Google Cloud Private Service Connect on supported deployments. Network proximity can help latency and transfer costs, but depends on region, routing, and pricing -- not on the database vendor's name.

**A common monitoring workflow.** Integrating database diagnostics with an existing operations platform can simplify alert routing and incident investigation. Azure DocumentDB can send [diagnostic logs to Azure Monitor and Log Analytics](https://learn.microsoft.com/en-us/azure/documentdb/how-to-monitor-diagnostics-logs), allowing operators to investigate database requests within their Azure monitoring environment. This requires configuration, and the documented resource-log feature excludes some lower tiers. Integration does not automatically provide end-to-end application tracing.

**Managed event-processing connections.** A documented service integration can replace some custom plumbing. For example, [AWS Lambda can process Amazon DocumentDB change streams](https://docs.aws.amazon.com/lambda/latest/dg/with-documentdb.html) through an event-source mapping, supporting workflows such as updating a search index when records change. The integration has engine-version and cluster-type restrictions, and delivery is at least once, so application handlers must tolerate duplicate events. "Integrated" does not mean unrestricted or exactly once.

**A smaller procurement and support coordination burden.** Where an organization already standardizes on a cloud provider, its database service may fit existing purchasing, resource inventories, cost allocation, and support processes. That can be valuable even without a unique database feature. However, contractual coverage, support plans, marketplace purchasing, and charges must be checked; specialist vendors may fit those processes too.

Specialist services can offer many of the same connections. For example, [Atlas supports AWS IAM database authentication](https://www.mongodb.com/docs/atlas/security/aws-iam-authentication/), including roles used by applications on AWS compute. It would therefore be misleading to frame this choice as "cloud integration versus no integration."

The tradeoff is between **database-specific strengths, integration effort, and platform dependence**. Cloud-native identities, event mappings, and operational APIs can reduce work today while making a later move more involved. A specialist service may preserve one database interface across multiple clouds, but still introduces dependencies on its own management platform. Neither model eliminates lock-in or guarantees lower cost.

For a team already operating its application in Azure or AWS, an integrated database service can be the simplest complete solution. For a team prioritizing particular database features, mobile synchronization, or a consistent managed offering across clouds, a specialist vendor may be a better fit. For organizations requiring customer-hosted deployments or direct control of the engine, open-source DocumentDB remains another starting point.

The final architecture is usually larger than the database:

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

The database is a component of that system, not a replacement for it.

## Start with the application, keep deployment choices open

There are many document databases because the document model solves a recurring application problem, while organizations have different requirements for implementation, licensing, and operations.

Open-source DocumentDB offers a concrete combination: a document-oriented interface, BSON and document operations integrated with PostgreSQL, and a permissive MIT License. Its value is not that it makes every workload faster or every deployment simpler. Its value is that teams can adopt the document model while retaining meaningful control over the software and infrastructure.

A sensible starting point is the [open-source quickstart](https://github.com/documentdb/documentdb#get-started): build a representative application, test compatibility, measure real queries, and verify backup and recovery procedures. Then choose self-hosting or a managed service according to production requirements.

**Choose documents because they fit the application. Choose hosting because it fits the organization.**
