---
title: "Why document databases need more than one implementation"
description: "How DocumentDB approaches developer choice, MongoDB compatibility, and participation across organizations as it works toward v1.0."
date: 2026-10-07
featured: false
author: Patty Chow
category: documentdb-blog
tags:
  - DocumentDB
  - Open Source
  - MongoDB Compatibility
  - Community
---

Choosing a document database is a long-term investment in how an application works. A team learns a query language, adopts drivers, and builds around particular behaviors. Those choices become part of the application, from routine reads to the way it recovers after a failed write.

Developers should be able to preserve more of that work when their infrastructure needs change. They may want to run a workload themselves, move it to another provider, or choose a different database implementation. Doing so should not require starting over.

DocumentDB is an open-source document database built on PostgreSQL, designed to support MongoDB drivers and queries. As the project works toward v1.0, we want to make that choice more practical for the people building applications and operating them.

## Familiar tools, more room to choose

MongoDB has given developers a widely used way to work with document data. Familiar drivers and query patterns are worth preserving. Alternative implementations give developers a chance to keep using that knowledge while evaluating different approaches to storage and deployment.

The important test is what happens to an application. Can its driver connect? Does a query return the expected result, including the types and ordering it relies on? What happens when a request fails and the client retries?

Compatibility has to account for those details. Teams also need to evaluate operational differences, such as backup and recovery, before moving a workload. A successful connection or a short CRUD demo cannot answer every migration question.

For DocumentDB, useful progress means more applications behaving as expected, with differences documented clearly enough for developers to make an informed decision. A reproducible report of an unexpected result helps establish where that work is needed.

## Source code others can build on

DocumentDB's MIT license allows others to use, modify, and redistribute the project's code under its terms. Developers can inspect the implementation, adapt it to their needs, or build a service around it. PostgreSQL provides a foundation with an existing ecosystem of tools and operational knowledge.

Those choices make several forms of participation possible. An application team may need a particular query behavior. A database provider may want to offer a managed service. An operator may contribute a deployment fix that makes the project easier to run.

These participants will not always have the same priorities. The project benefits when their experience exposes assumptions that the original team would otherwise miss.

## A project worth contributing to

DocumentDB is a Linux Foundation project. Its [charter](https://github.com/documentdb/documentdb/blob/main/GOVERNANCE.md) provides for open participation regardless of competitive interests, with technical oversight through the Technical Steering Committee.

That framework needs to be useful in everyday development. Contributors should be able to understand how a proposal is considered and where to discuss a different approach. Their work should receive specific credit, including the testing, documentation, and review that make code usable.

A company considering whether to invest engineering time needs a reason to believe its contribution can matter. Helping another organization improve the shared implementation should also help it serve its own users. That is a more sustainable basis for collaboration than asking for support for a project in the abstract.

Shared compatibility tests are one place to explore that collaboration. A documented test case can help multiple implementations examine the same behavior while keeping their own architectures and priorities. Such work could inform broader interoperability efforts over time. It would need agreement on scope and expected behavior; a compatibility claim alone does not establish an open standard.

## Help evaluate the path to v1.0

The [v1.0 release candidate](https://github.com/documentdb/documentdb/releases/tag/v1.0-RC1) is available for testing. It precedes the final release and should be evaluated on a fresh, short-lived instance rather than used as a supported production release.

Try a workload that matters to you. If something behaves unexpectedly, share a minimal example, the versions involved, and the result you expected. If the installation instructions leave something unclear, that is useful feedback too.

Start with the [release-candidate guide](https://documentdb.io/docs/getting-started/release-candidate/) and the [contribution guide](https://github.com/documentdb/documentdb/blob/main/CONTRIBUTING.md). Your application can help identify the next compatibility gap or usability problem the project needs to address.
