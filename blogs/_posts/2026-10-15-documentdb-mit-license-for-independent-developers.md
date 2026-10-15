---
title: "DocumentDB and the MIT License: What Open Source Means for Indie Developers"
description: "A practical comparison of DocumentDB's MIT license, Apache 2.0, and MongoDB Community Server's SSPL: what changes when you build an app, ship a product, or offer a hosted database."
date: 2026-10-15
author: DocumentDB team
category: documentdb-blog
tags:
  - DocumentDB
  - MIT License
  - Apache 2.0
  - SSPL
  - Open Source
  - Indie Developers
---
If you are building a product on your own, a database license is more than fine print. It can determine whether you can keep your code private, package the database with your app, or turn a side project into a hosted service without negotiating a separate license.

**The short version:** The open-source [DocumentDB project](https://github.com/documentdb/documentdb) is a MongoDB-compatible database built on PostgreSQL and released under the [MIT license](https://github.com/documentdb/documentdb/blob/main/LICENSE). MIT and Apache 2.0 are permissive, [OSI-approved open-source licenses](https://opensource.org/licenses). They allow commercial use, modification, distribution, and hosting without requiring you to publish the source code of your database service. By contrast, [MongoDB's official Community Edition licensing policy](https://www.mongodb.com/legal/licensing/community-edition) states that its database server uses the Server Side Public License (SSPL) "for all versions released after October 16, 2018, including patch fixes for prior versions." Its terms can require publication of the *service stack's* source code when you offer the database itself as a service to third parties. **SSPL is not OSI-approved as an open-source license**; source-available is not the same thing as open source under the [Open Source Definition](https://opensource.org/osd).

This article is about the **open-source DocumentDB project's code license**. [Azure DocumentDB (with MongoDB compatibility)](https://learn.microsoft.com/azure/documentdb/overview) is a separate, managed service built on that project; using the Azure service is subject to its own service terms and pricing.

## The licenses, side by side

| Question | DocumentDB: MIT | An Apache 2.0-licensed database | MongoDB Community Server: SSPL |
| --- | --- | --- | --- |
| Can I use and modify it for a commercial product? | Yes. | Yes. | Yes, subject to the SSPL terms. SSPL does not forbid commercial use. |
| Can I keep my database changes private while hosting a service? | Yes; MIT has no network-use source disclosure requirement. | Yes; Apache 2.0 has no network-use source disclosure requirement. | If you offer the **database's functionality** as a service to third parties, Section 13 requires you to publish the Service Source Code under SSPL (or obtain another license). |
| Can I distribute my own build? | Yes; include the copyright and MIT license notice in copies or substantial portions. | Yes; include the license, mark changed files, preserve applicable notices, and reproduce applicable NOTICE attributions when the original includes them. | Yes, but distribution carries copyleft, notice, and corresponding-source obligations. |
| What about patents? | The MIT text has no *express* patent grant. | Apache 2.0 includes an express, conditional contributor patent grant. | The SSPL includes patent terms; the key difference for a hosted database is its service-source requirement. |
| OSI-approved open source? | Yes. | Yes. | No. |

DocumentDB is **MIT-licensed, not Apache-licensed**; Apache 2.0 is included here as another example of a permissive open-source license. PostgreSQL, the foundation DocumentDB runs on, has its [own permissive PostgreSQL License](https://www.postgresql.org/about/licence/). A distribution can include dependencies with other licenses, so read the notices for the actual build you ship.

## What changes when you are a team of one?

### You build a paid app with a database behind it

Say you sell a subscription to a photo organizer. Customers interact with your app; the app stores records in a database you run. You can use DocumentDB under MIT without publishing your application or database changes. **Do not confuse that with offering the database itself as a service.** Simply using MongoDB Community Server as the backend to an app does *not*, by itself, mean your app must be published under SSPL: the [SSPL's Section 13](https://www.mongodb.com/legal/licensing/server-side-public-license) concerns making the *functionality of the licensed program* available to third parties as a service. The boundaries depend on what your service actually exposes.

### You want to offer hosted database instances

Suppose customers sign up for database clusters, use MongoDB-compatible clients to connect, and manage their own data. With DocumentDB's MIT license, you can host and charge for that service, modify the engine, and keep your management software private without an MIT obligation to publish service source. If you instead offer MongoDB Community Server itself as a service under SSPL, Section 13 requires the **Service Source Code** to be available to everyone at no charge under SSPL. That definition extends beyond server modifications to programs used to make the database available as a service, including management, APIs, automation, monitoring, backup, storage, and hosting software. Another licensing arrangement with the rights holder may be an option, but do not assume one is available on your terms.

That is a real engineering and business decision for a solo developer: either plan to satisfy a potentially broad source-disclosure requirement, obtain different license rights, or build on a permissively licensed engine. It does **not** mean the SSPL prohibits hosting outright.

### You share a Docker image or sell an on-premises package

Under MIT, keep the DocumentDB copyright and license notice with copies or substantial portions of the software you distribute; you are not required by MIT to publish your changes. Apache 2.0 permits a similar proprietary distribution but has additional license, modification, and applicable NOTICE-file requirements. SSPL has copyleft obligations on distributed covered works *even when you are not hosting a database service*, separate from its Section 13 service provision. Check the license of every component in your package; a MongoDB-compatible wire protocol does not give you permission to copy a differently licensed database server.

## Why "open source" matters here

Open source is about what you may **do** with the code, not just whether you can read it on GitHub. The OSI's [Open Source Definition](https://opensource.org/osd) includes use in any field of endeavor. MIT and Apache 2.0 meet that standard; the [OSI says the SSPL does not](https://opensource.org/blog/the-sspl-is-not-an-open-source-license). MongoDB explains its rationale differently: it designed SSPL to require those offering its software as a service to release the software used to provide that service ([MongoDB's SSPL announcement](https://www.mongodb.com/company/newsroom/press-releases/mongodb-issues-new-server-side-public-license-for-mongodb-community-server)). Both positions are worth understanding before picking an engine; "source-available" is a more precise description than "OSI-approved open source" for SSPL-licensed MongoDB Community Server.

DocumentDB is a PostgreSQL-based implementation of a MongoDB-compatible API, not a copy of MongoDB's server code. MongoDB-supported [drivers are Apache 2.0-licensed](https://www.mongodb.com/legal/licensing/community-edition). Connecting with a compatible driver does not change DocumentDB's MIT license or import the server's SSPL into your own code. Compatibility is not identity: check supported features and behavior for your workload before migrating.

**Bottom line:** For indie developers or small businesses, the MIT license means you can experiment, monetize, distribute, or offer DocumentDB as a managed service while meeting a short notice obligation, without a license-triggered requirement to publish your hosting stack. Apache 2.0 gives similar freedom with more notice requirements and an express patent grant. SSPL allows many uses too, but a database-as-a-service plan needs special attention to Section 13. Licensing does not replace performance testing, security work, support planning, or review of other components' terms.

## References

- [DocumentDB project license (MIT)](https://github.com/documentdb/documentdb/blob/main/LICENSE) and [project README](https://github.com/documentdb/documentdb#readme)
- [Open Source Initiative: MIT license](https://opensource.org/license/mit), [Apache License 2.0](https://opensource.org/license/Apache-2.0), and [Open Source Definition](https://opensource.org/osd)
- [Apache Software Foundation: Apache License 2.0, sections 3 and 4](https://www.apache.org/licenses/LICENSE-2.0)
- [MongoDB: Community Edition licensing](https://www.mongodb.com/legal/licensing/community-edition) and [SSPL, especially sections 4–6 and 13](https://www.mongodb.com/legal/licensing/server-side-public-license)
- [Open Source Initiative: The SSPL Is Not an Open Source License](https://opensource.org/blog/the-sspl-is-not-an-open-source-license)
- [PostgreSQL License](https://www.postgresql.org/about/licence/) and [Linux Foundation: DocumentDB joins under the MIT license](https://www.linuxfoundation.org/press/linux-foundation-welcomes-documentdb-to-advance-open-developer-first-nosql-innovation)

This is a practical summary of published license terms, not legal advice. For a product or hosting model where the boundary between an app and a database service is unclear, review the licenses and consult qualified counsel.
