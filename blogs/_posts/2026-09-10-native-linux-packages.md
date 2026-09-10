---
title: "Native Linux packages for DocumentDB: start simple, keep control"
description: Run DocumentDB directly on Linux with apt or dnf and guided setup. Start with the complete stack, use your own local PostgreSQL, or install only the extension.
date: 2026-09-10
featured: true
author: DocumentDB team
category: documentdb-blog
tags:
  - DocumentDB
  - Linux
  - PostgreSQL
  - APT
  - RPM
---
{% assign site_root = site.baseurl | replace: '/blogs', '' %}

You want to try DocumentDB on a Linux host without building from source or making containers part of your environment. Native Linux packages give you that option: familiar package managers, guided setup, and a choice about how much of the stack you manage.

DocumentDB is an open-source, MongoDB API compatible document database built on PostgreSQL. The native package experience brings the PostgreSQL extension, gateway, setup tools, and systemd services together, so you can start with a complete installation instead of assembling individual components.

**Start simple. Keep control.** Use the complete stack for a new instance, or choose an advanced path for PostgreSQL you already manage.

## Start with the complete stack

The recommended path creates a new private PostgreSQL instance and a DocumentDB gateway on your Linux host. You do not need PostgreSQL installed beforehand. Package-managed services and persistent database storage give you a host installation you can inspect, stop, and restart with familiar Linux tools.

Installation and setup are separate steps:

1. **Install with apt or dnf.** Follow the [Linux installation guide]({{ site_root }}/docs/getting-started/packages/) to configure the signed DocumentDB and PostgreSQL repositories, meet the distribution prerequisites, and install the complete-stack package for your selected PostgreSQL major. This changes system-wide package sources and installs dependencies.
2. **Run guided setup.** The guide's `documentdb-setup` command explicitly creates a new private instance, configures the database and gateway, and starts the services. Installing packages alone does not create a working endpoint. Enter the administrator password at the terminal prompt, not in a connection URI or shell history.
3. **Connect and query.** Install `mongosh` separately if you want to use the shell examples or load the optional sample data. Follow the guide's connection instructions before running your first insert and read.

This is a guided installation, not a one-command path from an unprepared machine to production.

## Try a write, then keep it across a restart

After setup and an authenticated connection in `mongosh`, insert a document and read it back:

```javascript
use native_packages_demo
db.notes.insertOne({ message: "Start simple. Keep control." })
db.notes.findOne({ message: "Start simple. Keep control." })
```

The query should return the inserted document, including its `_id`. On a systemd host, follow [Services and paths]({{ site_root }}/docs/linux-packages/#services-and-paths) to restart the complete-stack target for your selected PostgreSQL major. Reconnect, select `native_packages_demo`, and repeat the query to check that the same data remains. A service restart is not a data reset.

The [operations guide]({{ site_root }}/docs/linux-packages/) keeps service commands, storage paths, troubleshooting, and removal guidance in one place.

## Keep control of PostgreSQL

The complete stack is the starting point, not the only option.

**Use an existing local PostgreSQL instance.** Keep ownership of its service and data while configuring DocumentDB and the gateway alongside it. This requires explicit configuration changes and can require an operator-controlled PostgreSQL restart. Back up first and follow [the existing-instance guide]({{ site_root }}/docs/linux-packages/#adopt-an-existing-postgre-sql-instance). The gateway and PostgreSQL must be on the same host; a remote PostgreSQL backend is not supported.

**Install only the PostgreSQL extension.** Choose this when you want the DocumentDB extension in PostgreSQL without the gateway or package-managed private instance. Extension-only installation does not create a MongoDB-compatible network endpoint. Review the component choices on the install page rather than treating this as a substitute for the complete-stack quickstart.

## Supported platforms and release boundaries

These details describe [v0.117-0](https://github.com/documentdb/documentdb/releases/tag/v0.117-0), the current release as of September 10, 2026. Native packages are not new to this release.

The shipped native matrix covers Ubuntu 24.04 with APT and RHEL/Rocky Linux 9 with RPM/dnf, on PostgreSQL 17 or 18 and amd64 or arm64. RPM names those architectures x86_64 and aarch64. RHEL requires registration and the documented repository prerequisites. PostgreSQL 18 is the default: `documentdb` selects it, while `documentdb-17` and `documentdb-18` select a specific major.

**These pre-GA packages are for fresh installations. In-place upgrades from earlier releases are not supported.** Use a clean host or a new, empty PostgreSQL instance. Uninstalling packages preserves database files and in-database content; reinstalling does not make an existing database fresh.

The default auto-generated self-signed TLS certificate is a development convenience only. The gateway listens on all interfaces by default, so restrict network access before setup on anything other than a private development machine. Follow [the network and TLS guidance]({{ site_root }}/docs/linux-packages/#before-exposing-it-to-a-network) before exposing the endpoint, and use a trusted certificate instead of treating a certificate-validation bypass as a production setting.

## Choose your installation path

**[Install DocumentDB on Linux]({{ site_root }}/packages/?method=packages)** for the complete, current prerequisites and install/setup commands.

Prefer containers, or evaluating on macOS or Windows? [Use Docker]({{ site_root }}/packages/?method=docker). It remains an option on Linux, macOS, and Windows.
