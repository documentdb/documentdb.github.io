---
title: "Long-term support or development? An explanation of DocumentDB's versioning"
description: A comparison of DocumentDB's long-term support, development, and release-candidate builds
date: 2026-10-01
featured: false
author: DocumentDB team
category: documentdb-blog
tags:
  - DocumentDB
  - "1.0"
  - Release
  - Version
---

**Update, October 19, 2026:** DocumentDB 1.0 is now available. [Read the announcement]({{ site.release_announcement_url | relative_url }}).

DocumentDB is releasing v1.0-RC1 for testing. This release candidate precedes the full 1.0 release.
After the full release, DocumentDB will split development into two branches: a main development branch that continues with 1.1 and later, and an LTS branch that stays at 1.0.
This split is meant to ensure there's a stable version of the platform for users who don't need the latest features.

This article also clarifies what support really means, describes how we'll handle future minor version updates such as 1.1 and 1.2, and explains when updates to the different tracks will happen.

## Release candidates

Release candidates use the `-RC` suffix. For example, a release candidate for version 3 could be tagged `v3.0-RC1`, followed by a final release tag such as `v3.0-0`. 
After the final release, `release/v3` becomes the supported branch for version 3, while `main` moves on to development for version 4. The previous `release/v2` branch remains supported during its grace period.

These experimental versions aren't intended for long-term use, and they won't be supported past the full release. They're for testing only; run them on a short-lived, fresh instance.

### Release candidate installation

> **Update, October 19, 2026:** The 1.0 release candidates are retired and no longer get fixes. [Install DocumentDB 1.0](https://documentdb.io/packages/) instead. A host or data volume that ran an RC has no upgrade path to 1.0; start from a clean one.

If you find any problems, please [create an issue on GitHub](https://github.com/documentdb/documentdb/issues).

## Definition of support

This policy is a proposal under discussion in [documentdb/documentdb#597](https://github.com/documentdb/documentdb/pull/597). The final policy will be published with 1.0.

DocumentDB aims to publish one new major version each year. The major versions are on branches such as `release/v3`. 
Security fixes will be backported to supported release branches, with new artifacts built until support ends. Other bug fixes will be backported case by case.
A major version will be supported until three months after the next major version is released.

Backports of security fixes will be added to the LTS version with a patch version bump. For example, a security fix could bump the long-term support branch to v3.0-1, but not v3.1-0.
The long-term support track won't get any minor updates, only patch updates.

## The main development track

Major releases are time-based. Minor releases, however, will continue to be pushed out as development work completes.
The artifacts on the main development track will be built only on minor version releases. At that point the previous minor is deprecated and all development track users should update immediately.
In this way, development-track users will get all security and bug fixes by rolling forward to the latest minor release.

## Upgrade paths

DocumentDB will support direct in-place upgrades between consecutive long-term support major versions.
For example, if you're using v1.0-2, and v2.0-0 is released as part of a new major, there will be instructions for how to update to that next version before v1.0 falls out of support.

There's also a direct upgrade path from the current major release to the latest minor release of that same major. This path will allow for a simple switch from long-term support to the latest builds.

Release candidates are different. DocumentDB doesn't support upgrades from release candidate versions. Release candidates use the same extension version as the first full release for that major, so there's no reliable extension upgrade path from an RC to the final release.
