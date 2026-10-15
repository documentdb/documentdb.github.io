---
title: "Long-term support or development? An explanation of DocumentDB's versioning"
description: A comparison of DocumentDB's long-term support, development, and release-candidate builds
date: 2026-10-01
featured: true
author: DocumentDB team
category: documentdb-blog
tags:
  - DocumentDB
  - "1.0"
  - Release
  - Version
---

DocumentDB is releasing v1.0-RC1 for testing. This is a release candidate preceding the full 1.0 release.
Following the full release, DocumentDB will split the main development branch that will continue with 1.1 and beyond from the LTS branch that will stay at 1.0.
This is to ensure there is a stable version of the platform for users who don't need the latest features.

This post will also clarify what support really means, describe how we will handle future minor version updates (1.1, 1.2, etc.), and explain when updates to the different tracks will happen.

## Release candidates

Release candidates use the `-RC` suffix. For example, a release candidate for version 3 could be tagged `v3.0-RC1`, followed by a final release tag such as `v3.0-0`. 
After the final release, `release/v3` becomes the supported branch for version 3, while `main` moves on to development for version 4. The previous `release/v2` branch remains supported during its grace period.

These experimental versions are not intended for long-term use, nor will they be supported past the full release. They are only for testing purposes, and if used should be used on a short-lived fresh instance.

### Release candidate installation

> **Update:** [v1.0-RC2](https://github.com/documentdb/documentdb/releases/tag/v1.0-RC2) replaces RC1 for testing. Use `rc2` and `v1.0-RC2` in place of `rc1` and `v1.0-RC1` below. The RC2 image sends anonymous usage telemetry by default; add `-e DOCUMENTDB_USAGE_TELEMETRY=false` to opt out.

With Docker:

```bash
docker run -dt --name docdb-rc1 -p 127.0.0.1:10260:10260 \
  ghcr.io/documentdb/documentdb/documentdb-local:pg17-1.0-rc1 \
  --username '<YOUR_USERNAME>' --password '<YOUR_PASSWORD>'
```

Or on Ubuntu 24.04 or RHEL 9:

```bash
curl -fsSLo documentdb-install.sh \
  https://documentdb.io/install.sh &&
sudo sh documentdb-install.sh --version v1.0-RC1
```

See [Try the 1.0 release candidate](https://documentdb.io/docs/getting-started/release-candidate/) for details.

If you find any problems with the RC, please [create an issue on GitHub](https://github.com/documentdb/documentdb/issues).

## Definition of support

This policy is a proposal under discussion in [documentdb/documentdb#597](https://github.com/documentdb/documentdb/pull/597). The final policy will be published with 1.0.

DocumentDB aims to publish one new major version each year. The major versions are on branches such as `release/v3`. 
Security fixes will be backported to supported release branches, with new artifacts built until support ends. Other bug fixes will be backported case by case.
A major version will be supported until three months after the next major version is released.

Backports of security fixes will be added to the LTS version with a patch version bump. For example, a security fix could bump the long-term support branch to v3.0-1, but not v3.1-0.
The long-term support track will not get any minor updates, only patch updates.

## The main development track

Major releases are time-based. Minor releases, however, will continue to be pushed out as development work completes.
The artifacts on the main development track will be built only on minor version releases. At that point the previous minor is deprecated and all development track users should update immediately.
In this way, all security and bug fixes will come as a user of the development track rolls forward with the latest minor updates.

## Upgrade paths

DocumentDB will support direct in-place upgrades between consecutive long-term support major versions.
For example, if you are using v1.0-2, and v2.0-0 is released as part of a new major, there will be instructions for how to update to that next version before v1.0 falls out of support.

There is also a direct upgrade path from the current major release to the latest minor release of that same major. This will allow for a simple switch from long-term support to the latest builds.

Release candidates are different. Upgrades from release candidate versions will not be supported. Release candidates use the same extension version as the first full release for that major, so there is no reliable extension upgrade path from an RC to the final release.
