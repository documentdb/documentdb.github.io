---
title: "DocumentDB on GitHub Open Source Friday: building toward v1.0"
description: "Watch the September 11 conversation with Patty Chow about running DocumentDB locally, developer choice, and contributing to the project."
date: 2026-09-11
featured: false
author: Patty Chow
category: documentdb-blog
tags:
  - DocumentDB
  - Open Source
  - GitHub
  - Community
  - "1.0"
---

What should developers expect from an open-source document database, and how can they help shape it? On GitHub's Open Source Friday, Patty Chow joined host Sarah to discuss DocumentDB's work toward v1.0 and demonstrate getting started locally.

The conversation covered familiar MongoDB workflows on PostgreSQL, the experience of using DocumentDB through VS Code, and the role of feedback from people trying the project. Viewers also asked where DocumentDB fits alongside MongoDB and PostgreSQL with pgvector.

[Watch the full episode on GitHub's YouTube channel](https://www.youtube.com/watch?v=TkxGupjwdxE).

## A local starting point

The [demo introduction begins at 16:31](https://www.youtube.com/watch?v=TkxGupjwdxE&t=991s). Using a local Docker instance and the DocumentDB extension for VS Code, Patty walks through creating a database and collection, importing home-listing data, and querying it in a playground.

That workflow gives developers a way to explore the project in an editor they already use. The sample data makes it possible to inspect documents and try queries without first building a complete application. The episode demonstrates the introductory steps of a larger booking-agent sample; it does not walk through the full application or its vector-search features.

For an up-to-date setup, use the [getting-started guide](https://documentdb.io/docs/getting-started/). Installation details can change after a recording.

## What the work toward v1.0 is meant to improve

At [14:27](https://www.youtube.com/watch?v=TkxGupjwdxE&t=867s), the discussion turns to what makes a release ready for more people to build on. Patty describes work on collation and aggregation behavior, query planning and indexes, and easier installation.

These are practical concerns for an application team evaluating a database. Setup needs to be understandable, queries need to behave as expected, and users need enough information to judge whether a particular release fits their workload.

The episode discusses goals for v1.0. For current release status and supported usage, consult the [release notes](https://github.com/documentdb/documentdb/releases) rather than treating the recording as a production-support statement.

## Giving developers another option

A [viewer question at 22:54](https://www.youtube.com/watch?v=TkxGupjwdxE&t=1374s) asks why someone familiar with both MongoDB and PostgreSQL would choose DocumentDB. The answer covers DocumentDB's permissive MIT license and PostgreSQL foundation, alongside its support for MongoDB drivers and queries.

Later, at [35:00](https://www.youtube.com/watch?v=TkxGupjwdxE&t=2100s), Patty acknowledges that PostgreSQL with pgvector can remain a good fit for developers already comfortable with that setup. DocumentDB offers another approach for applications built around document data and MongoDB-style access.

The longer-term discussion includes collaboration across cloud companies and an ambition to improve interoperability between document databases. That is a direction to explore with other builders, not an announcement of a completed standard.

## Contributing starts with trying it

At [54:09](https://www.youtube.com/watch?v=TkxGupjwdxE&t=3249s), Patty explains how evaluating the project and sharing feedback can help its development. A question about installation or a reproducible example of unexpected behavior gives maintainers something concrete to work with.

You do not need to know how to fix the database before reporting a problem. Describe what you were trying to do, include the relevant versions, and show what happened compared with the result you expected.

Read the [contribution guide](https://github.com/documentdb/documentdb/blob/main/CONTRIBUTING.md) for the project's discussion channels and contribution process. The episode is a useful introduction; trying a workload of your own is the next step.
