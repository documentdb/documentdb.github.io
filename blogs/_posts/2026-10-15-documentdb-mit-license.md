---
title: "DocumentDB and the MIT License: What to Know Before You Build, Deploy, and Distribute"
description: "A practical comparison of DocumentDB's MIT license, Apache 2.0, and MongoDB Community Server's SSPL: what changes when you build, deploy, distribute, or offer a database as a service."
date: 2026-10-15
author: DocumentDB team
category: documentdb-blog
tags:
  - DocumentDB
  - MIT License
  - Apache 2.0
  - SSPL
  - Open Source
  - Indie Developer
  - Startup
---
If you build, deploy, or distribute software that uses open-source components, a database license is part of the architecture and release process, not just fine print. It can determine whether you may keep changes private, what notices must accompany a product, when source code must be offered, and whether a hosted service creates additional obligations.

Those questions apply whether you are an independent developer, a startup, an enterprise platform team, or a software vendor. The answer can also change over time: an internal prototype can become a customer-facing service, and a deployment image can become a product distributed to other organizations.

**The short version:** The open-source [DocumentDB project](https://github.com/documentdb/documentdb) is a MongoDB-compatible database built on PostgreSQL and released under the [MIT license](https://github.com/documentdb/documentdb/blob/main/LICENSE). MIT and Apache 2.0 are permissive, [OSI-approved open-source licenses](https://opensource.org/licenses). They allow commercial use, modification, distribution, and hosting without requiring you to publish the source code of your database service. By contrast, [MongoDB's official Community Edition licensing policy](https://www.mongodb.com/legal/licensing/community-edition) states that its database server uses the Server Side Public License (SSPL) "for all versions released after October 16, 2018, including patch fixes for prior versions." Its terms can require publication of the *service stack's* source code when you offer the database itself as a service to third parties. **SSPL is not OSI-approved as an open-source license**; source-available is not the same thing as open source under the [Open Source Definition](https://opensource.org/osd).

This article is about the **open-source DocumentDB project's code license**. [Azure DocumentDB (with MongoDB compatibility)](https://learn.microsoft.com/azure/documentdb/overview) is a separate, managed service built on that project; using the Azure service is subject to its own service terms and pricing.

## The licenses, side by side

| Question | DocumentDB: MIT | An Apache 2.0-licensed database | MongoDB Community Server: SSPL |
| --- | --- | --- | --- |
| Can I use and modify it for a commercial product? | Yes. | Yes. | Yes, subject to the SSPL terms. SSPL does not forbid commercial use. |
| Can I keep my database changes private while hosting a service? | Yes; MIT has no network-use source disclosure requirement. | Yes; Apache 2.0 has no network-use source disclosure requirement. | If you offer the **database's functionality** as a service to third parties, [Section 13, "Offering the Program as a Service"](https://www.mongodb.com/legal/licensing/server-side-public-license), requires you to make the Service Source Code available by network download to everyone at no charge under SSPL (or obtain another license). |
| Can I distribute my own build? | Yes; include the copyright and MIT license notice in copies or substantial portions. | Yes; include the license, mark changed files, preserve applicable notices, and reproduce applicable NOTICE attributions when the original includes them. | Yes, but distribution carries copyleft, notice, and corresponding-source obligations. |
| What about patents? | The MIT text has no *express* patent grant. | Apache 2.0 includes an express, conditional contributor patent grant. | The SSPL includes patent terms; the key difference for a hosted database is its service-source requirement. |
| OSI-approved open source? | Yes. | Yes. | No. |

**What Section 13 covers:** The provision applies when you make the functionality of an SSPL-licensed program or modified version available to third parties as a service. Its examples include letting third parties interact with that functionality remotely, offering a service whose value derives primarily from the program, or offering a service that accomplishes the program's primary purpose. The required **Service Source Code** includes the Corresponding Source for the program and for all programs used to provide the service, such that a user could run an instance of the service from the source you make available.

DocumentDB is **MIT-licensed, not Apache-licensed**; Apache 2.0 is included here as another example of a permissive open-source license. PostgreSQL, the foundation DocumentDB runs on, has its [own permissive PostgreSQL License](https://www.postgresql.org/about/licence/). A distribution can include dependencies with other licenses, so read the notices for the actual build you ship.

## What changes when you build, deploy, or distribute?

### You run a database behind your application

Suppose users interact with your application's interface or API while the database remains an internal implementation detail. You can use DocumentDB under MIT without publishing your application or database changes. **Do not confuse that with offering the database itself as a service.** Simply using MongoDB Community Server behind an application does *not*, by itself, mean the application must be published under SSPL: the [SSPL's Section 13](https://www.mongodb.com/legal/licensing/server-side-public-license) concerns making the *functionality of the licensed program* available to third parties as a service. The boundaries depend on what the service actually exposes.

### A common SSPL pitfall: your application becomes a database service

Consider a team whose product begins as a conventional hosted application with MongoDB Community Server behind it. Later, the team adds a feature that lets customers create isolated database instances, connect with MongoDB-compatible clients, run database queries, and manage their own collections. Engineering may see this as an incremental product feature, but the licensing analysis has changed: third parties can now interact with the database's functionality as a service.

Under SSPL Section 13, offering MongoDB Community Server this way requires the **Service Source Code** to be available to everyone at no charge under SSPL. Publishing only changes to the database server is not enough. The definition extends to programs used to provide the service, including management software, user interfaces, APIs, automation, monitoring, backup, storage, and hosting software, such that a user could run an instance of the service from the released source.

The practical trap is failing to revisit the license when the product architecture changes. A team may have built a proprietary control plane before realizing that a database-as-a-service feature brings it within the service-source requirement. At that point, the choices may include complying with SSPL, obtaining different license rights, redesigning the offering, or selecting a permissively licensed engine. SSPL does **not** prohibit hosting, and not every application that uses MongoDB is a database service; the distinction depends on what functionality is made available to third parties.

With DocumentDB's MIT license, a team can offer hosted database instances, modify the engine, and keep its management software private without an MIT obligation to publish service source. It must still preserve the copyright and MIT license notice where the license requires it and comply with the licenses of other components in the service.

### You publish a container or ship an on-premises product

Running software internally and giving someone else a copy are different licensing events. Under MIT, keep the DocumentDB copyright and license notice with copies or substantial portions of the software you distribute; you are not required by MIT to publish your changes. Apache 2.0 permits a similar proprietary distribution but has additional license, modification, and applicable NOTICE-attribution requirements. SSPL has copyleft obligations on distributed covered works *even when you are not hosting a database service*, separate from its Section 13 service provision.

Containers, virtual-machine images, installers, appliances, and on-premises bundles can all carry third-party software. Check the license of every component in the artifact you publish; a MongoDB-compatible wire protocol does not give you permission to copy a differently licensed database server.

## A license checklist before deployment or release

Before publishing a product or opening a service to users:

1. **Inventory the exact components and versions.** Include the database, extensions, drivers, images, operating-system packages, and bundled tools. A software bill of materials can help, but it does not replace reading the licenses.
2. **Classify how each component is used.** Internal use, modification, distribution, and making functionality available over a network can carry different obligations.
3. **Prepare the required notices.** Preserve applicable copyright notices, license texts, attribution notices, and modification notices in the locations required by each license.
4. **Plan for source obligations before release.** If a license requires Corresponding Source or Service Source Code, determine what must be included, how recipients will obtain it, and how long it must remain available.
5. **Review product changes, not just dependency updates.** Adding direct database access, customer-managed clusters, downloadable images, or an on-premises edition can change the analysis even when the database version stays the same.
6. **Check the whole distribution.** A permissively licensed database does not override the licenses of its dependencies, plugins, drivers, or management tools.

## Why "open source" matters here

Open source is about what you may **do** with the code, not just whether you can read it on GitHub. The OSI's [Open Source Definition](https://opensource.org/osd) includes use in any field of endeavor. MIT and Apache 2.0 meet that standard; the [OSI says the SSPL does not](https://opensource.org/blog/the-sspl-is-not-an-open-source-license). MongoDB explains its rationale differently: it designed SSPL to require those offering its software as a service to release the software used to provide that service ([MongoDB's SSPL announcement](https://www.mongodb.com/company/newsroom/press-releases/mongodb-issues-new-server-side-public-license-for-mongodb-community-server)). Both positions are worth understanding before picking an engine; "source-available" is a more precise description than "OSI-approved open source" for SSPL-licensed MongoDB Community Server.

DocumentDB is a PostgreSQL-based implementation of a MongoDB-compatible API, not a copy of MongoDB's server code. MongoDB-supported [drivers are Apache 2.0-licensed](https://www.mongodb.com/legal/licensing/community-edition). Connecting with a compatible driver does not change DocumentDB's MIT license or import the server's SSPL into your own code. Compatibility is not identity: check supported features and behavior for your workload before migrating.

**Bottom line:** For developers, startups, platform teams, and software vendors, the MIT license permits experimentation, commercial use, distribution, and managed DocumentDB services while requiring preservation of its copyright and license notice in copies or substantial portions. It does not impose a license-triggered requirement to publish a hosting stack. Apache 2.0 provides similar flexibility with additional conditions and an express patent grant. SSPL permits many uses too, but distribution and database-as-a-service plans require careful attention to its copyleft terms and Section 13. Licensing does not replace performance testing, security work, support planning, or review of other components' terms.

## References

- [DocumentDB project license (MIT)](https://github.com/documentdb/documentdb/blob/main/LICENSE) and [project README](https://github.com/documentdb/documentdb#readme)
- [Open Source Initiative: MIT license](https://opensource.org/license/mit), [Apache License 2.0](https://opensource.org/license/Apache-2.0), and [Open Source Definition](https://opensource.org/osd)
- [Apache Software Foundation: Apache License 2.0, sections 3 and 4](https://www.apache.org/licenses/LICENSE-2.0)
- [MongoDB: Community Edition licensing](https://www.mongodb.com/legal/licensing/community-edition) and [SSPL, especially sections 4–6 and 13](https://www.mongodb.com/legal/licensing/server-side-public-license)
- [Open Source Initiative: The SSPL Is Not an Open Source License](https://opensource.org/blog/the-sspl-is-not-an-open-source-license)
- [PostgreSQL License](https://www.postgresql.org/about/licence/) and [Linux Foundation: DocumentDB joins under the MIT license](https://www.linuxfoundation.org/press/linux-foundation-welcomes-documentdb-to-advance-open-developer-first-nosql-innovation)

This is a practical summary of published license terms, not legal advice. For a product or hosting model where the boundary between an app and a database service is unclear, review the licenses and consult qualified counsel.
