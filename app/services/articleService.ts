import fs from 'fs';
import path from 'path';
import { load as loadYaml } from 'js-yaml';
import matter from 'gray-matter';
import { Article } from '../types/Article';
import { Link } from '../types/Link';
import {
  buildAptInstallCommand,
  buildRpmInstallCommand,
  buildSetupCommand,
} from '../lib/packageInstall';
import { documentdbDiscordUrl } from './externalLinks';

const articlesDirectory = path.join(process.cwd(), 'articles');

// Sections served entirely from this file rather than from the cloned
// articles/ tree. Getting Started holds quick starts only; the longer-form
// deployment guides live in their own section, alongside DocumentDB Local.
const virtualSections: Record<string, { landingTitle: string; pages: { slug: string; title: string }[] }> = {
  'linux-packages': {
    landingTitle: 'Linux Packages',
    pages: [
      { slug: '', title: 'Operating a Package Install' },
      { slug: 'offline', title: 'Offline / Air-gapped Install' },
    ],
  },
};

const dockerGuideContent = `# Docker Quick Start

Run DocumentDB locally with Docker and verify the setup before moving to driver code. For installation choices, open [Docker installation](/packages?method=docker) or [Native Linux installation](/packages?method=packages).

## Prerequisites

- [Docker](https://www.docker.com/)
- [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/) for the fastest connection check
- A local port available for DocumentDB (the examples use \`10260\`)

## Start DocumentDB

If you do not already have the image locally, pull it first:

\`\`\`bash
docker pull ghcr.io/documentdb/documentdb/documentdb-local:latest
\`\`\`

Then start the container:

\`\`\`bash
docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username '<YOUR_USERNAME>' \\
  --password '<YOUR_PASSWORD>' \\
  --init-data true
\`\`\`

> Replace \`<YOUR_USERNAME>\` and \`<YOUR_PASSWORD>\` with your own credentials.
>
> \`-p 127.0.0.1:10260:10260\` keeps the endpoint on loopback. A bare \`-p 10260:10260\`
> publishes it on **every** interface, which is rarely what you want on a laptop.
>
> \`--init-data true\` seeds the built-in sample data into \`StoreData\`, which the
> verification step below queries. It is **not** enabled by default — without it the
> container starts with no \`StoreData\` database and \`use StoreData\` returns nothing. The data is
> seeded once per data volume. Existing volumes are not migrated automatically;
> re-create the volume to seed again. See
> [DocumentDB Local](/docs/documentdb-local) for \`--init-data-path\`, certificate setup,
> and additional runtime options.

## Verify the container

\`\`\`bash
docker ps --filter "name=documentdb"
\`\`\`

You should see the container in an \`Up\` state with port \`10260\` published.

> [!IMPORTANT]
> \`docker ps\` reports \`Up\` well before DocumentDB accepts connections. Wait for the
> readiness banner, or the first \`mongosh\` call fails with a connection error:
>
> \`\`\`bash
> until docker logs documentdb 2>&1 | grep -q "=== DocumentDB is ready ==="; do sleep 2; done
> \`\`\`

## Verify the connection

Use \`mongosh\` to confirm authentication, TLS, and the gateway endpoint are working:

The certificate bypass below is for **local development only**. Use a trusted certificate before connecting over a shared or public network.

\`\`\`bash
mongosh localhost:10260 \\
  -u '<YOUR_USERNAME>' \\
  -p '<YOUR_PASSWORD>' \\
  --authenticationMechanism SCRAM-SHA-256 \\
  --tls \\
  --tlsAllowInvalidCertificates
\`\`\`

Then run a quick health check. The sample data below needs \`--init-data true\` on the \`docker run\` above — without it \`StoreData\` does not exist:

\`\`\`javascript
db.runCommand({ ping: 1 })

use StoreData

db.stores.find({}, { _id: 0, name: 1, city: 1, "sales.revenue": 1 }).limit(3)
\`\`\`

Write and read back your own document; this does not require sample data:

\`\`\`javascript
use quickstart
db.orders.insertOne({ item: "widget", qty: 5 })
db.orders.find({ item: "widget" })
\`\`\`

If you prefer certificate validation instead of \`--tlsAllowInvalidCertificates\`, follow the certificate steps in [DocumentDB Local](/docs/documentdb-local).

## Persistence and initialization

The quick start command above is ideal for disposable local environments. When you need more control:

- Use \`--data-path\` with a mounted host directory to keep data across container restarts
- Omit \`--init-data true\` if you want an empty instance instead of the \`StoreData\` collections
- Use \`--init-data-path\` to run your own \`.js\` initialization scripts with \`mongosh\` at startup

The built-in \`StoreData\` sample dataset includes 41,505 documents in \`stores\` and 2 documents in \`ratings\`.

## Stop, start, and remove

\`\`\`bash
docker stop documentdb       # stop, keep the data
docker start documentdb      # bring it back later
docker restart documentdb
docker logs documentdb       # gateway and startup output
\`\`\`

To update the image or start over:

\`\`\`bash
# DESTROYS the container and its anonymous data volume
docker rm -fv documentdb
docker pull ghcr.io/documentdb/documentdb/documentdb-local:latest
# then run the Start DocumentDB command again
\`\`\`

Until you remove it, re-running \`docker run --name documentdb\` fails with
\`Conflict. The container name "/documentdb" is already in use\`. Mount a named volume
(\`-v documentdb-data:/data\`) before storing anything you want to keep.

## Troubleshooting and debugging

If something does not work as expected:

- Confirm port \`10260\` is available and that \`docker ps\` shows the container running
- Inspect startup, authentication, and TLS errors with \`docker logs documentdb\`
- For more gateway detail, re-create the container with \`-e DOCUMENTDB_LOG_LEVEL=debug\`. The \`--log-level\` flag is validated at startup but does not currently change what the container logs, and environment variables are fixed at \`docker run\` — \`docker restart\` cannot change either.
- Use the certificate flow in [DocumentDB Local](/docs/documentdb-local) if your client should validate TLS certificates
- Use [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart) for a fuller shell walkthrough

## Next steps

- [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart)
- [Node.js Quick Start](/docs/getting-started/nodejs-setup)
- [Python Quick Start](/docs/getting-started/python-setup)
- [DocumentDB Local](/docs/documentdb-local)
- [Samples Gallery](/samples)
- [Linux Packages Quick Start](/docs/getting-started/packages)
- [Install DocumentDB](/packages?method=packages)
`;

export const linuxPackagesGuideContent = `# Linux Packages Quick Start

Install DocumentDB from the published package repository and get a MongoDB-compatible endpoint on your own host.

The current official release publishes the full stack — extension, gateway, setup wizard and systemd units — for **Ubuntu 24.04 and EL9, on PostgreSQL 17 or 18, amd64 or arm64**. EL9 includes Rocky Linux, AlmaLinux, CentOS Stream, and registered Red Hat Enterprise Linux; [Native Linux installation](/packages?method=packages) supplies the prerequisite command for each family. Starting with v0.116, this is a deliberately smaller prebuilt matrix than earlier releases. The website repository mirrors only the current release assets and does not carry older packages forward to make other targets appear current.

**Recommended:** install the complete stack, then create a new private PostgreSQL 18 instance. The commands detect architecture on the Linux host where you run them. For containers or macOS/Windows evaluation, choose [Docker installation](/packages?method=docker).

> [!IMPORTANT]
> This pre-GA release supports **fresh installation only**, not in-place package upgrades from earlier releases. Use a clean host or a new, empty PostgreSQL instance. Removing packages preserves database files; reinstalling is not a data reset.

> [!NOTE]
> Need another distribution or PostgreSQL major? We welcome community builds. Check out the matching release tag and use the version-parameterized [packaging scripts](https://github.com/documentdb/documentdb/blob/v0.117-0/packaging/README.md). \`build_packages.sh\` builds the extension, \`gateway/build_gateway_packages.sh\` builds the gateway, and \`build_extra_packages.sh\` builds the common, tools, stand-alone, and meta packages. PostgreSQL 15 is extension-only because the setup tools require PostgreSQL 16 or newer. These builds are on demand and are not official release assets hosted by documentdb.io.

You do not need PostgreSQL already installed — the setup wizard creates and manages its own instance. The install does add the PGDG repository and pull PostgreSQL, PostGIS and around 160 packages (about 140 MB), so pick a host you are willing to have PGDG on.

## Install

### Ubuntu 24.04, PostgreSQL 18 (APT)

\`\`\`bash
${buildAptInstallCommand('ubuntu24', 'auto', '18')}
\`\`\`

### Rocky Linux, AlmaLinux, or CentOS Stream 9, PostgreSQL 18 (RPM)

\`\`\`bash
${buildRpmInstallCommand('rocky9', 'auto', '18')}
\`\`\`

### Registered Red Hat Enterprise Linux 9, PostgreSQL 18 (RPM)

This command requires an active Red Hat subscription. RHEL exposes CodeReady Builder through
\`subscription-manager\`, not through the \`crb\` repository ID used by Rocky-family systems.

\`\`\`bash
${buildRpmInstallCommand('rhel9', 'auto', '18')}
\`\`\`

For PostgreSQL 17, select it in [Native Linux installation](/packages?method=packages) to generate matching install and setup commands for \`documentdb-17\`; there is no \`documentdb-16\`. Both EL9 flows enable CodeReady Builder, which supplies \`libqhull_r.so.7\` for PostGIS dependencies.

Then install \`mongosh\`, which you need to talk to the endpoint:

\`\`\`bash
# Ubuntu 24.04
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/mongodb.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb.gpg] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt update && sudo apt install -y mongodb-mongosh

# EL9
printf '[mongodb-org-8.0]\\nname=MongoDB\\nbaseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/8.0/$basearch/\\ngpgcheck=1\\nenabled=1\\ngpgkey=https://pgp.mongodb.com/server-8.0.asc\\n' | sudo tee /etc/yum.repos.d/mongodb.repo
sudo dnf install -y mongodb-mongosh
\`\`\`

## Set up and connect

> [!IMPORTANT]
> The wizard binds the gateway on **all interfaces** (\`0.0.0.0:10260\`) with a self-signed certificate. Firewall port \`10260\` before you run it on anything but a private machine, then read [Before exposing it to a network](/docs/linux-packages#before-exposing-it-to-a-network).

Installing the packages puts files on disk; it does not create a database or start the endpoint. The setup wizard does that:

\`\`\`bash
${buildSetupCommand('18')}
\`\`\`

It creates a new private PostgreSQL 18 instance, installs the extensions, starts the gateway, and enables it at boot. It **prompts for the admin password**. The explicit major and fresh-instance flags keep another installed PostgreSQL major or an existing system cluster from being selected accidentally.

Sample data is opt-in. Add \`--load-sample-data\` to the setup command to seed the \`StoreData\` database with 41,505 documents in \`stores\` and 2 documents in \`ratings\`. This requires \`mongosh\`; the command above leaves the new instance empty.

For automation, use the complete [unattended setup](/docs/linux-packages#unattended-setup) command. To use PostgreSQL you already manage on this host, follow [Adopt an existing PostgreSQL instance](/docs/linux-packages#adopt-an-existing-postgre-sql-instance); it changes configuration and may require an administrator-controlled restart. For SQL-only use without a gateway, see [Install the PostgreSQL extension only](/docs/linux-packages#install-the-postgre-sql-extension-only).

Now open a shell against the endpoint. The password prompt uses the admin password you chose during setup. The self-signed certificate bypass is for **local development only**; use a trusted certificate for network access.

\`\`\`bash
mongosh localhost:10260 -u admin -p --authenticationMechanism SCRAM-SHA-256 \\
        --tls --tlsAllowInvalidCertificates
\`\`\`

A database and collection are created on first write:

\`\`\`javascript
> use quickstart
> db.orders.insertOne({ item: "widget", qty: 5 })
{ acknowledged: true, insertedId: ObjectId('...') }

> db.orders.find()
[ { _id: ObjectId('...'), item: 'widget', qty: 5 } ]
\`\`\`

**That is a working DocumentDB.** Confirm the service state with \`sudo documentdb-setup --status\` and the version with \`documentdb-gateway --version\`.

## Where to go next

- Build an application: [Node.js Quick Start](/docs/getting-started/nodejs-setup) or [Python Quick Start](/docs/getting-started/python-setup)
- Secure it, manage services, run SQL, upgrade, uninstall, and hosts without systemd: [Operating a package install](/docs/linux-packages)
- Install without internet access: [Offline / air-gapped install](/docs/linux-packages/offline)
- Choose between the published distributions, architectures and PostgreSQL majors: [Native Linux installation](/packages?method=packages)

## Troubleshooting

- \`Unable to locate package documentdb-18\` (apt) / \`No match for argument: documentdb-18\` (dnf) — the DocumentDB repository was not added, or the host is not in the current release matrix. Check [Native Linux installation](/packages?method=packages)
- \`documentdb-18 : Depends: postgresql-18 but it is not installable\` — PGDG was not added first
- \`nothing provides libqhull_r.so.7\` — CRB or CodeReady Builder was not enabled for the selected EL9 family
- \`MongoServerError: Invalid key\` — empty or wrong password; a bare \`-p\` prompts, so a non-interactive shell sends nothing
- Anything else — \`sudo documentdb-setup --status\` reports the listener, service states and resolved paths

More failure modes, including hosts without systemd: [Operating a package install](/docs/linux-packages#troubleshooting).

## If you used an earlier repository target

documentdb.io no longer publishes packages for Ubuntu 22.04, Debian 11/12/13, RHEL-compatible 8, or PostgreSQL 16. Existing installations keep running, but receive no package updates and cannot reinstall those packages from documentdb.io.

Empty signed metadata remains at the retired repository URLs so \`apt update\` and \`dnf makecache\` continue to work. Remove the source on a host that will not move to the current matrix:

\`\`\`bash
# Debian / Ubuntu
sudo rm -f /etc/apt/sources.list.d/documentdb.list
sudo apt update

# RHEL-compatible
sudo rm -f /etc/yum.repos.d/documentdb.repo
sudo dnf clean all
\`\`\`

To remain on an older target, use its GitHub release assets or build from the matching source tag. Neither path is part of the current hosted support matrix.
`;

export const linuxPackagesOperationsContent = `# Operating a package install

Day-2 operations for a DocumentDB installed from Linux packages: securing the endpoint, managing services, running SQL, upgrading, and removal. Install first with the [Linux Packages Quick Start](/docs/getting-started/packages).

## Before exposing it to a network

The gateway binds **all interfaces** (\`0.0.0.0:10260\` and \`[::]:10260\`) by default. The PostgreSQL instance behind it stays on loopback.

Before using this anywhere but a private machine:

- Restrict the listener with \`DOCUMENTDB_LISTEN_ADDR=127.0.0.1:10260\` in \`/etc/documentdb/local/<major>/gateway.env\` and restart the service, or firewall port \`10260\`. **Re-running \`documentdb-setup\` silently resets this to a wildcard bind**, so re-check with \`grep DOCUMENTDB_LISTEN_ADDR /etc/documentdb/local/<major>/gateway.env\` afterwards. A firewall rule is the more durable control.
- Use a strong admin password and create per-application users rather than sharing \`admin\`.

### Replace the self-signed certificate

\`tlsAllowInvalidCertificates=true\` disables server authentication. To use a real certificate,
set all three values in \`/etc/documentdb/local/<major>/gateway.env\`:

\`\`\`ini
DOCUMENTDB_TLS_AUTO_GENERATE=false
DOCUMENTDB_TLS_CERT_FILE=/etc/documentdb/tls/server.crt
DOCUMENTDB_TLS_KEY_FILE=/etc/documentdb/tls/server.key
\`\`\`

The gateway runs as \`documentdb-gateway\`. Every parent directory must be traversable by that
account; keep the private key restricted but readable, for example
\`root:documentdb-gateway\` with mode \`0640\`. Restart
\`documentdb-gateway-local@<major>.service\`, verify it is active, and then remove
\`tlsAllowInvalidCertificates=true\` from clients.

## Services and paths

\`\`\`bash
sudo documentdb-setup --status      # gateway listener, service states, resolved paths
documentdb-gateway --version        # DocumentDB version
dpkg -l | grep documentdb           # or: rpm -qa | grep documentdb
\`\`\`

| Thing | Where |
| --- | --- |
| Gateway port | \`10260\` |
| PostgreSQL port | \`9700 + <major>\` (9718 for PG 18), loopback only |
| Gateway log | systemd: \`journalctl -u documentdb-gateway-local@18.service\` · otherwise \`/var/lib/documentdb-gateway/gateway.log\` |
| PostgreSQL log | systemd: \`journalctl -u documentdb-postgresql@18.service\` · otherwise \`/var/lib/documentdb-local/<major>/data/pglog.log\` |
| Setup state / gateway env | \`/etc/documentdb/local/<major>/setup.conf\`, \`.../gateway.env\` |

On a systemd host both services log to the journal; the log **files** above exist only when \`documentdb-setup\` falls back to its non-systemd \`nohup\` mode. \`documentdb-setup --status\` prints whichever applies to your host.

Units are templated per PostgreSQL major:

\`\`\`bash
sudo systemctl status  documentdb-local@18.target
sudo systemctl restart documentdb-local@18.target
sudo systemctl stop    documentdb-local@18.target
\`\`\`

## Adopt an existing PostgreSQL instance

Use this mode only when PostgreSQL already exists **locally on the gateway host** and its service and data remain
operator-owned; remote PostgreSQL adoption is not supported. You need administrator access to change PostgreSQL configuration and restart its service. Back up the instance first. The wizard does not create, delete, start, or stop
that PostgreSQL instance, but it does add managed configuration blocks, create the gateway role,
install the DocumentDB extensions, and register the gateway.

Identify the instance as \`<major>/<name>\`. On Ubuntu, run \`pg_lsclusters\`; a typical instance
is \`18/main\`. The standard PGDG layout on EL9 has one instance per major and also uses
\`18/main\`; add \`--pg-port\` when it listens on a non-default port.

\`\`\`bash
sudo documentdb-setup --target-postgres-instance 18/main --admin-user admin
\`\`\`

If \`shared_preload_libraries\` changed, the first run prints a restart handoff instead of
finishing setup. Restart the operator-managed PostgreSQL service, then re-run the exact setup
command it prints. Typical service names are \`postgresql@18-main.service\` on Ubuntu and
\`postgresql-18.service\` on EL9. The wizard intentionally does not restart an adopted
PostgreSQL instance for you.

The wizard's default \`default_toast_compression\` setting applies to newly written values in
every database on an adopted instance. If other workloads must retain PostgreSQL's own default,
prefix both setup runs with \`sudo DOCUMENTDB_TOAST_COMPRESSION=default\`.

## Install the PostgreSQL extension only

Choose this advanced path for SQL-facing DocumentDB capabilities in PostgreSQL you manage.
It does **not** create a MongoDB-compatible network endpoint, install the gateway, or run
\`documentdb-setup\`. Shell, driver, and VS Code quick starts require the complete stack instead.

Use the extension package for your PostgreSQL major: \`postgresql-N-documentdb\` on Ubuntu
or \`postgresqlN-documentdb\` on EL9. You own PostgreSQL configuration, extension activation,
and service restarts. Follow the matching release's [manual package instructions](https://github.com/documentdb/documentdb/blob/v0.117-0/packaging/README.md),
or the [extension-only offline instructions](/docs/linux-packages/offline#smaller-offline-cases)
when PostgreSQL and all extension dependencies are already installed.

## Running SQL against a package-managed private instance

A greenfield PostgreSQL instance runs as the \`documentdb-local\` user on a socket, so a bare
\`psql\` will not find it:

\`\`\`bash
sudo -u documentdb-local psql -h /run/documentdb-local/18/postgresql -p 9718 -d postgres
\`\`\`

\`\`\`sql
SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'documentdb%';
\`\`\`

For an adopted instance, use the operator's existing PostgreSQL connection instead.

## Upgrading

> [!WARNING]
> In-place package upgrades from earlier releases are not supported yet. Use a clean host
> or a new, empty PostgreSQL instance and follow the current
> [fresh installation](/docs/getting-started/packages). Removing packages alone does not
> create a fresh database: package removal preserves PostgreSQL data and in-database content,
> and a later setup run reuses an initialized data directory. Upgrading only
> \`postgresql-N-documentdb\` does not install the gateway, tools, common payload, or
> \`documentdb-N\`.

For a later point release that uses the same multi-package layout, move the entire stack
together. On a package-managed private PostgreSQL 18 instance:

\`\`\`bash
sudo systemctl stop documentdb-gateway-local@18.service

# Debian / Ubuntu
sudo apt update
sudo apt install --only-upgrade documentdb-18 postgresql-18-documentdb \\
  documentdb-common documentdb-gateway documentdb-postgresql-tools

# EL9: use this instead of the apt commands above
sudo dnf upgrade documentdb-18 postgresql18-documentdb \\
  documentdb-common documentdb-gateway documentdb-postgresql-tools

# PostgreSQL has the old shared library loaded until it restarts.
sudo systemctl restart documentdb-postgresql@18.service
\`\`\`

Then update the extensions in **every database** that has DocumentDB installed:

\`\`\`sql
ALTER EXTENSION documentdb_core UPDATE;
ALTER EXTENSION documentdb UPDATE;
ALTER EXTENSION documentdb_extended_rum UPDATE;  -- only if installed
\`\`\`

Finally restart the gateway:

\`\`\`bash
sudo systemctl start documentdb-gateway-local@18.service
\`\`\`

PostgreSQL applies intermediate upgrade scripts automatically. Take a backup first. For an
adopted PostgreSQL instance, restart its operator-managed PostgreSQL service instead of
\`documentdb-postgresql@18.service\`.

## Remove or reset

### Greenfield: destroy the package-managed instance

\`\`\`bash
# Reset reads setup.conf before removing it, stops the services, and destroys
# the package-managed data directory. Do not run --restore first.
sudo documentdb-local-reset --pg-version 18 --confirm-destroy    # DESTROYS the data directory

# Name the package you installed AND the extension: autoremove does not reap
# postgresql-18-documentdb, and 'remove' would leave config behind.
sudo apt purge --autoremove documentdb-18 postgresql-18-documentdb
sudo dnf remove documentdb-18 postgresql18-documentdb && sudo dnf autoremove
\`\`\`

### Brownfield: detach from an existing PostgreSQL instance

Before restoring, run \`sudo documentdb-setup --status\` and note the gateway port for the major
you are removing.

On a systemd host, a scoped restore stops and disables that major's gateway:

\`\`\`bash
sudo documentdb-setup --restore --pg-version 18
\`\`\`

On a host without systemd, the current setup tooling cannot safely attribute a nohup gateway process to one
PostgreSQL major. If only one DocumentDB major is configured, use an unscoped restore so the
orphan gateway sweep runs:

\`\`\`bash
sudo documentdb-setup --restore --yes
\`\`\`

If more than one DocumentDB major is configured without systemd, schedule a maintenance window
and use the same unscoped restore. It detaches every configured major and stops the nohup
gateways; re-run setup for the majors you are keeping afterward. A scoped restore alone is not
sufficient on a no-systemd host.

Restart the adopted PostgreSQL service after restore to apply removal of the managed settings.
On an unscoped multi-major restore, restart each operator-managed PostgreSQL service involved.

Verify that the target gateway port is no longer listening before removing packages. Substitute
the port you noted above; the command should produce no output:

\`\`\`bash
ss -lnt | grep ':10260'
\`\`\`

Then remove the selected major:

\`\`\`bash
sudo apt purge --autoremove documentdb-18 postgresql-18-documentdb
sudo dnf remove documentdb-18 postgresql18-documentdb && sudo dnf autoremove
\`\`\`

Do not run \`documentdb-local-reset\` for brownfield installations: the PostgreSQL instance and
its data belong to the operator. Do not run restore before a greenfield reset either; restore
deletes the state that identifies custom data directories and protects adopted clusters.

On a systemd multi-major host, remove one major at a time and re-check the survivor:
\`documentdb-common\` owns the shared tooling and only \`documentdb-N\` holds it.

## Known package-install issues

These are defects in this release, not expected behaviour. Most need a host without systemd to hit; the status issue also affects systemd hosts.

| Area | Issue | Affects |
| --- | --- | --- |
| Status | \`documentdb-setup --status\` can report "active" for any process holding port 10260 | **any host** |
| Restart | Re-running \`documentdb-setup\` to restart can hang; redirecting output to a file avoids it | no systemd |
| Stop | A scoped \`documentdb-setup --restore --pg-version N\` cannot stop a nohup gateway; follow the no-systemd brownfield removal steps above | no systemd |
| Minimal RHEL | Install \`procps-ng\` first, or \`--restore\` reports success while the gateway keeps serving and a later run fails with \`Port 10260 is already in use\` | no systemd |

**Prefer a systemd host for anything you care about**, where the service lifecycle is managed by systemd rather than by the setup script.

## Multiple PostgreSQL majors

Install the matching \`documentdb-N\` for every major you configure. \`documentdb-setup\` refuses a major whose extension package is missing:

\`\`\`text
ERROR: The DocumentDB extension package is not installed for PostgreSQL 17
(/usr/share/postgresql/17/extension/documentdb.control is missing).
\`\`\`

Each major also needs its own gateway port — the second one fails on \`Gateway port 10260 is already in use\` unless you pass \`--gateway-port\`:

\`\`\`bash
sudo documentdb-setup --pg-version 17 --use-new-postgres-instance \\
  --gateway-port 10261 --admin-user admin
\`\`\`

## Troubleshooting

Failure modes beyond the four in the [quick start](/docs/getting-started/packages#troubleshooting):

- \`Bad GPG signature\` on \`pgdg-common\` — wrong architecture in the PGDG repository URL
- \`apt install\` hangs in a container — \`export DEBIAN_FRONTEND=noninteractive\` first, and drop the leading \`sudo\` when running as \`root\` (minimal images often have no \`sudo\`). Keep \`sudo -u <user>\`, which switches user; \`su documentdb-local -c\` fails because that account has \`/usr/sbin/nologin\`, so use \`su -s /bin/bash documentdb-local -c '...'\`
- \`ss: command not found\` on a minimal EL9 host — install \`iproute\`; the DocumentDB packages do not pull it in
- \`db.version()\` and \`buildInfo\` in \`mongosh\` report the emulated MongoDB wire version, not DocumentDB's — use \`documentdb-gateway --version\`

## Unattended setup

\`documentdb-setup\` prompts for the admin password. For servers and CI, provide exactly one
password source and pass \`--yes\`. For a new private instance:

\`\`\`bash
printf '%s' "$ADMIN_PW" | sudo documentdb-setup --pg-version 18 \\
  --use-new-postgres-instance --admin-user admin --admin-password-stdin --yes
\`\`\`

For brownfield adoption, replace \`--pg-version 18 --use-new-postgres-instance\` with
\`--target-postgres-instance 18/main\`. You can use
\`--admin-password-file /path/to/protected/file\` instead of stdin.
`;

const linuxPackagesOfflineContent = `# Offline / air-gapped install

An air-gapped host has no route to PGDG either, and DocumentDB pulls PostgreSQL, \`pg_cron\`, \`pgvector\` and PostGIS from there — the release assets alone are not enough. Stage the full dependency closure on a connected machine with the **same distribution, release and architecture** as the target.

For a connected host, use the [Linux Packages Quick Start](/docs/getting-started/packages) instead.

## Stage the bundle (connected machine)

Configure the repositories exactly as for an online install: run the whole [Install](/docs/getting-started/packages#install) block for your distribution **except the final \`sudo apt install -y documentdb-18\` / \`sudo dnf install -y documentdb-18\` line** — delete that line and the \`&& \\\` that precedes it. On RHEL the DocumentDB repository is written by the \`tee /etc/yum.repos.d/documentdb.repo\` line near the end, so stopping earlier leaves \`dnf download\` with nothing to find. Then:

\`\`\`bash
# Debian / Ubuntu
sudo apt-get install -y dpkg-dev
mapfile -t PKGS < <(apt-cache depends --recurse --no-recommends --no-suggests \\
    --no-conflicts --no-breaks --no-replaces --no-enhances documentdb-18 \\
  | grep '^[a-zA-Z0-9]' | sort -u)
mkdir -p bundle && cd bundle
apt-get download "\${PKGS[@]}"
dpkg-scanpackages . /dev/null > Packages && gzip -k Packages
\`\`\`

\`\`\`bash
# RHEL-compatible
sudo dnf install -y dnf-plugins-core createrepo_c
mkdir -p bundle
sudo dnf download --resolve --alldeps --destdir bundle documentdb-18
createrepo_c bundle
\`\`\`

> [!NOTE]
> **Use the full-closure flags, not \`--download-only\`.** \`apt-get install --download-only\` and a bare \`dnf download --resolve\` skip whatever is already installed on the staging machine; the bundle looks complete and the target dies with \`Depends: adduser but it is not installable\`.

Expect ~200 packages / 200 MB (DEB) or ~270 / 170 MB (RPM), mostly PostGIS and GDAL. That is more than an online install downloads, because the closure includes packages already present on the staging machine. The \`unsandboxed as root\` and \`dpkg-scanpackages ... override file\` warnings are harmless.

## Install from the bundle (air-gapped target)

Copy \`bundle/\` across — including the \`Packages\`/\`Packages.gz\` or \`repodata/\` index inside it, which is what makes the next step resolve — and point the package manager at it:

\`\`\`bash
# Debian / Ubuntu
echo "deb [trusted=yes] file:///path/to/bundle ./" \\
  | sudo tee /etc/apt/sources.list.d/documentdb-offline.list
sudo apt-get update
sudo apt install -y documentdb-18
\`\`\`

\`\`\`bash
# RHEL-compatible
printf '%s\\n' '[documentdb-offline]' 'name=DocumentDB offline bundle' \\
  'baseurl=file:///path/to/bundle' 'enabled=1' 'gpgcheck=0' \\
  | sudo tee /etc/yum.repos.d/documentdb-offline.repo
sudo dnf install -y --disablerepo='*' --enablerepo=documentdb-offline documentdb-18
\`\`\`

> [!IMPORTANT]
> The \`--disablerepo\`/\`--enablerepo\` pair is not optional. DNF **aborts the whole transaction** if any enabled repository is unreachable, and every RHEL-compatible image ships \`baseos\`, \`appstream\` and \`extras\` enabled — so without it the install fails with \`Error: Failed to download metadata for repo 'baseos'\` even though your bundle is perfectly good. APT differs here: it only warns about unreachable sources and continues.

\`[trusted=yes]\` / \`gpgcheck=0\` accept the unsigned local directory. Upstream signatures were verified at staging time; \`sha256sum\` the transfer if it crosses an untrusted boundary.

Then continue with [Set up and connect](/docs/getting-started/packages#set-up-and-connect) — \`documentdb-setup\` needs no network.

\`mongosh\` is **not** part of the bundle and the target cannot reach the MongoDB repository, so stage it in the same pass if you want to verify from the air-gapped host — add \`mongodb-mongosh\` to the package list after configuring the MongoDB repository shown in the quick start. Otherwise verify with \`sudo documentdb-setup --status\` and connect from a machine that does have \`mongosh\`.

## Smaller offline cases

If the target already has PostgreSQL, the PGDG extension dependencies (\`postgresql-N-cron\`, \`-pgvector\`, \`-postgis-3\`) and \`jq\`, you do not need a bundle:

- **Extension only, one file** — \`sudo apt install ./ubuntu24.04-postgresql-18-documentdb_0.117-0_amd64.deb\`. No gateway and no \`documentdb-setup\`.
- **Full stack from the release assets** — pass the five packages for the selected PostgreSQL major to a *single* \`apt install\` / \`dnf install\`: \`documentdb-N\`, the matching \`postgresql-N-documentdb\` / \`postgresqlN-documentdb\` extension, \`documentdb-common\`, \`documentdb-gateway\`, and \`documentdb-postgresql-tools\`. For PostgreSQL 18 only, the optional \`documentdb\` meta package may be included; it selects \`documentdb-18\`. Local files resolve dependencies only against enabled repositories, so a package whose dependencies are not included still fails.
`;

const clientInstancePrerequisiteContent = `## Have a running DocumentDB instance?

If yes, keep it and continue with the client prerequisites below. Otherwise, choose one server installation:

- [Native Linux](/packages?method=packages): install the complete stack, then create a private PostgreSQL instance with the setup wizard.
- [Docker](/packages?method=docker): run a local container, including for macOS or Windows evaluation.

The [Linux Packages Quick Start](/docs/getting-started/packages) and [Docker Quick Start](/docs/getting-started/docker) include the full server instructions. Do not start a second instance if one is already running.

These examples connect to \`localhost:10260\`, so run the client on the same host as DocumentDB. Use username \`admin\` and the password chosen during native setup, or the credentials chosen for Docker. If you changed the endpoint, use its configured host and port.

Self-signed certificate bypasses below are for **local development only**. For network access, use a trusted certificate. Native setup binds the gateway on **all interfaces** by default: firewall port \`10260\` before setup and follow [network and certificate guidance](/docs/linux-packages#before-exposing-it-to-a-network). Docker examples publish only on loopback.
`;

const driverCredentialsContent = `## Set your client credentials

Set these in the terminal that will run your application. Replace the placeholders with your existing instance's credentials (\`admin\` and your setup password for the recommended native installation). The driver passes them as raw values, not embedded in a connection URI.

\`\`\`bash
export DOCUMENTDB_USERNAME='<YOUR_USERNAME>'
export DOCUMENTDB_PASSWORD='<YOUR_PASSWORD>'
\`\`\`
`;

const optionalSampleDataContent = `Sample data is **opt-in**, not required for your first insert and read. Native installations can add \`--load-sample-data\` during setup, which separately requires [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/). Docker installations can start with \`--init-data true\`. Without these options, \`StoreData\` does not exist. Existing Docker volumes are not migrated automatically; do not delete data you need just to load a sample.`;

const vscodeQuickStartGuideContent = `# Visual Studio Code Quick Start

Use DocumentDB for VS Code to connect to DocumentDB and insert and read your first document without leaving the editor.

${clientInstancePrerequisiteContent}

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- The [DocumentDB for VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-documentdb)
- Optional: [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/) for independent connection checks

## Install the extension

Install the extension from the VS Code marketplace, or run:

\`\`\`bash
code --install-extension ms-azuretools.vscode-documentdb
\`\`\`

If VS Code prompts you to reload after installation, do that before creating a connection.

## Optional: start a Docker instance

Skip this if you installed native packages or already have a running instance. If you chose Docker and have [Docker](https://www.docker.com/) installed:

\`\`\`bash
docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username '<YOUR_USERNAME>' \\
  --password '<YOUR_PASSWORD>'
\`\`\`

Replace the placeholders with your own credentials. Wait for the readiness banner in \`docker logs documentdb\` before connecting; see [Docker Quick Start](/docs/getting-started/docker#verify-the-container).

## Add a local connection in VS Code

1. Open the **DocumentDB** view in the VS Code activity bar.
2. In the local connection area, select **DocumentDB Local** and start the **New Local Connection** flow.
3. Enter port \`10260\`, your username, and your password.
4. At the TLS/SSL prompt:
   - For **local development only**, choose **Disable TLS/SSL (Not recommended)** if you are using the default self-signed local setup and have not configured trust for the certificate yet.
   - Keep **Enable TLS/SSL (Default)** if you already configured a trusted local certificate.
5. Finish the wizard and confirm the new connection appears in the connections tree.

## Verify the connection in the extension

Once connected:

1. Expand the connection and create a \`quickstart\` database and an \`orders\` collection from the context menu.
2. Add a test document:

\`\`\`json
{
  "name": "VS Code Quick Start",
  "source": "vscode",
  "status": "connected"
}
\`\`\`

3. Refresh the \`orders\` collection and find the document with \`"source": "vscode"\`. Read it back in the **Table**, **Tree**, or **JSON** view to confirm that both writing and reading work.

If you prefer to validate outside the extension first, use [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart).

### Optional: browse sample data

${optionalSampleDataContent}

If you loaded it, open \`StoreData\`, then the \`stores\` or \`ratings\` collection.

## Import, export, and querying

After the connection works, the extension can help you continue without leaving VS Code:

- Import JSON documents into a collection
- Export query results or full collections
- Browse documents in multiple views with pagination
- Open the query editor and continue with commands from the [API Reference](/docs/reference)

## Troubleshooting and debugging

If the extension does not connect on the first try:

- Verify the extension is installed and reload VS Code if the DocumentDB view does not appear
- Confirm your local DocumentDB instance is actually running before you connect
- If you used Docker, check \`docker ps\` and \`docker logs documentdb\`
- If you used native packages, check \`sudo documentdb-setup --status\`; for a manually built gateway, confirm its process is listening on the port you entered
- If the local connection wizard fails on security, retry and choose the TLS/SSL option that matches your certificate setup
- Use \`mongosh\` to confirm the endpoint works independently of VS Code

For extension-specific help or bugs:

- [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-documentdb)
- [GitHub repository](https://github.com/microsoft/vscode-documentdb)
- [GitHub discussions](https://github.com/microsoft/vscode-documentdb/discussions)
- [GitHub issues](https://github.com/microsoft/vscode-documentdb/issues)
- [DocumentDB Discord](${documentdbDiscordUrl})

## Next steps

- [DocumentDB for VS Code docs](https://github.com/microsoft/vscode-documentdb/tree/main/docs)
- [Docker Quick Start](/docs/getting-started/docker)
- [Linux Packages Quick Start](/docs/getting-started/packages)
- [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart)
- [Node.js Quick Start](/docs/getting-started/nodejs-setup)
- [Python Quick Start](/docs/getting-started/python-setup)
- [API Reference](/docs/reference)
`;

const nodejsGuideContent = `# Node.js Quick Start

Connect to DocumentDB from Node.js using the official MongoDB driver.

${clientInstancePrerequisiteContent}

## Prerequisites

- Node.js 20.19 or later (required by the current \`mongodb\` driver)
- npm
- Basic familiarity with JavaScript

${driverCredentialsContent}

## Optional: start a Docker instance

Skip this if you installed native packages or already have a running instance. If you chose Docker and have [Docker](https://www.docker.com/) installed, replace the placeholders below with your chosen credentials. This self-contained command also sets the environment variables read by your application:

\`\`\`bash
export DOCUMENTDB_USERNAME='<YOUR_USERNAME>'
export DOCUMENTDB_PASSWORD='<YOUR_PASSWORD>'

docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username "\${DOCUMENTDB_USERNAME:?Set DOCUMENTDB_USERNAME}" \\
  --password "\${DOCUMENTDB_PASSWORD:?Set DOCUMENTDB_PASSWORD}"
\`\`\`

Wait for the readiness banner in \`docker logs documentdb\` before connecting; see [Docker Quick Start](/docs/getting-started/docker#verify-the-container).

## Create a project

\`\`\`bash
mkdir my-documentdb-app
cd my-documentdb-app
npm init -y
npm install mongodb
\`\`\`

## Connect and run your first queries

Create an \`index.js\` file. The certificate bypass is for **local development only**, with the default self-signed certificate from native setup or Docker.

\`\`\`javascript
const { MongoClient } = require("mongodb");

const username = process.env.DOCUMENTDB_USERNAME;
const password = process.env.DOCUMENTDB_PASSWORD;

if (!username || !password) {
  throw new Error(
    "Set DOCUMENTDB_USERNAME and DOCUMENTDB_PASSWORD before running this script"
  );
}

const uri = "mongodb://localhost:10260/";
const options = {
  auth: { username, password },
  authSource: "admin",
  tls: true,
  tlsAllowInvalidCertificates: true,
  directConnection: true
};

async function main() {
  const client = new MongoClient(uri, options);

  try {
    await client.connect();

    const db = client.db("quickstart");
    await db.command({ ping: 1 });

    const movies = db.collection("movies");

    await movies.insertMany([
      { title: "The Matrix", year: 1999, genres: ["sci-fi", "action"] },
      { title: "Dune", year: 2021, genres: ["sci-fi", "adventure"] },
      { title: "Arrival", year: 2016, genres: ["sci-fi", "drama"] }
    ]);

    await movies.createIndex({ title: 1 });

    const recentMovies = await movies
      .find(
        { year: { $gte: 2000 } },
        { projection: { _id: 0, title: 1, year: 1 } }
      )
      .sort({ year: -1 })
      .toArray();

    console.log("Connected to DocumentDB");
    console.log(recentMovies);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
\`\`\`

Run the script:

\`\`\`bash
node index.js
\`\`\`

## Connect with a trusted local certificate instead

If you want certificate validation instead of \`tlsAllowInvalidCertificates=true\`, obtain the trusted certificate or CA file for your endpoint and replace the original \`options\` object with the version below. For native packages, follow [certificate configuration](/docs/linux-packages#before-exposing-it-to-a-network). For Docker, copy the local certificate with:

\`\`\`bash
docker cp documentdb:/home/documentdb/.local/state/documentdb-gateway/tls/cert.pem ~/documentdb-cert.pem
\`\`\`

\`\`\`javascript
const options = {
  auth: { username, password },
  authSource: "admin",
  tls: true,
  tlsCAFile: "/absolute/path/documentdb-cert.pem",
  directConnection: true
};
\`\`\`

## Next steps

- [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart)
- [Python Quick Start](/docs/getting-started/python-setup)
- [DocumentDB Local](/docs/documentdb-local)
- [Samples Gallery](/samples)
`;

const pythonQuickStartContent = `# Python Quick Start

Use PyMongo to connect to DocumentDB, verify authentication and TLS, and run your first document queries from Python.

${clientInstancePrerequisiteContent}

## Prerequisites

- Python 3.9 or later
- pip
- Optional: [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/) for independent connection checks

${driverCredentialsContent}

## Optional: start a Docker instance

Skip this if you installed native packages or already have a running instance. If you chose Docker and have [Docker](https://www.docker.com/) installed, replace the placeholders below with your chosen credentials. This self-contained command also sets the environment variables read by your application:

\`\`\`bash
export DOCUMENTDB_USERNAME='<YOUR_USERNAME>'
export DOCUMENTDB_PASSWORD='<YOUR_PASSWORD>'

docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username "\${DOCUMENTDB_USERNAME:?Set DOCUMENTDB_USERNAME}" \\
  --password "\${DOCUMENTDB_PASSWORD:?Set DOCUMENTDB_PASSWORD}"
\`\`\`

Wait for the readiness banner in \`docker logs documentdb\` before connecting; see [Docker Quick Start](/docs/getting-started/docker#verify-the-container).

## Create a virtual environment (optional)

\`\`\`bash
python3 -m venv .venv
source .venv/bin/activate
\`\`\`

If you do not use a virtual environment, run the next commands with the Python interpreter you plan to use for your app.

## Install PyMongo

\`\`\`bash
python -m pip install pymongo
\`\`\`

> PyMongo already includes the \`bson\` package it needs. Do not install the separate \`bson\` package from PyPI.

## Connect and run your first queries

Create a \`quickstart.py\` file. The certificate bypass is for **local development only**, with the default self-signed certificate from native setup or Docker.

\`\`\`python
import os

from pymongo import MongoClient

username = os.environ.get("DOCUMENTDB_USERNAME")
password = os.environ.get("DOCUMENTDB_PASSWORD")

if not username or not password:
    raise RuntimeError(
        "Set DOCUMENTDB_USERNAME and DOCUMENTDB_PASSWORD before running this script"
    )

client = MongoClient(
    "mongodb://localhost:10260/",
    username=username,
    password=password,
    authSource="admin",
    tls=True,
    tlsAllowInvalidCertificates=True,
)

try:
    client.admin.command("ping")

    db = client["quickstart"]
    movies = db["movies"]

    movies.delete_many({})
    movies.insert_many(
        [
            {"title": "The Matrix", "year": 1999, "genres": ["sci-fi", "action"]},
            {"title": "Dune", "year": 2021, "genres": ["sci-fi", "adventure"]},
            {"title": "Arrival", "year": 2016, "genres": ["sci-fi", "drama"]},
        ]
    )

    movies.create_index("title")

    for movie in movies.find(
        {"year": {"$gte": 2000}},
        {"_id": 0, "title": 1, "year": 1},
    ).sort("year", -1):
        print(movie)
finally:
    client.close()
\`\`\`

Run the script:

\`\`\`bash
python quickstart.py
\`\`\`

You should see the recent movie documents printed after a successful \`ping\`.

## Explore the built-in sample data

${optionalSampleDataContent}

If you loaded the sample, add this snippet after \`client.admin.command("ping")\`:

\`\`\`python
for store in client["StoreData"]["stores"].find(
    {},
    {"_id": 0, "name": 1, "city": 1, "sales.revenue": 1},
).limit(3):
    print(store)
\`\`\`

## Use a trusted local certificate instead

If you want certificate validation instead of \`tlsAllowInvalidCertificates=true\`, obtain the trusted certificate or CA file for your endpoint and replace the original \`MongoClient\` call with the version below. For native packages, follow [certificate configuration](/docs/linux-packages#before-exposing-it-to-a-network). For Docker, copy the local certificate with:

\`\`\`bash
docker cp documentdb:/home/documentdb/.local/state/documentdb-gateway/tls/cert.pem ~/documentdb-cert.pem
\`\`\`

\`\`\`python
client = MongoClient(
    "mongodb://localhost:10260/",
    username=username,
    password=password,
    authSource="admin",
    tls=True,
    tlsCAFile="/absolute/path/documentdb-cert.pem",
)
\`\`\`

## Troubleshooting and debugging

If the Python quick start does not work on the first try:

- Verify your local DocumentDB instance is running before you start Python
- If you used Docker, check \`docker ps --filter "name=documentdb"\` and \`docker logs documentdb\`
- If you used native packages, check \`sudo documentdb-setup --status\`; for a manually built gateway, confirm its process is listening on port \`10260\`
- If Python cannot import \`pymongo\`, verify the active interpreter with \`python -c "import sys; print(sys.executable)"\` and reinstall with \`python -m pip install pymongo\`
- If you see TLS or certificate errors, either use the default local self-signed flow with \`tlsAllowInvalidCertificates=true\` or switch to a trusted local certificate with \`tlsCAFile\`
- Use [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart) to validate the endpoint independently of your application code

## Next steps

- [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart)
- [Node.js Quick Start](/docs/getting-started/nodejs-setup)
- [Visual Studio Code Quick Start](/docs/getting-started/vscode-quickstart)
- [DocumentDB Local](/docs/documentdb-local)
- [API Reference](/docs/reference)
- [Samples Gallery](/samples)
`;

const mongoShellQuickStartContent = `# Mongo Shell Quick Start

Use \`mongosh\` to verify a local DocumentDB instance, inspect sample data, and run your first document commands.

${clientInstancePrerequisiteContent}

## Prerequisites

- [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/)
- Your instance's endpoint and credentials (the examples use \`localhost:10260\`)

## Optional: start a Docker instance

Skip this if you installed native packages or already have a running instance. If you chose Docker and have [Docker](https://www.docker.com/) installed:

\`\`\`bash
docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username '<YOUR_USERNAME>' \\
  --password '<YOUR_PASSWORD>'
\`\`\`

Replace the placeholders with your own credentials. Wait for the readiness banner in \`docker logs documentdb\` before connecting; see [Docker Quick Start](/docs/getting-started/docker#verify-the-container).

## Connect and verify the connection

Use your existing instance's credentials. The certificate bypass is for **local development only** with a self-signed certificate, whether you installed native packages or used Docker.

\`\`\`bash
mongosh localhost:10260 \\
  -u '<YOUR_USERNAME>' \\
  -p '<YOUR_PASSWORD>' \\
  --authenticationMechanism SCRAM-SHA-256 \\
  --tls \\
  --tlsAllowInvalidCertificates
\`\`\`

After you connect, run a quick health check:

\`\`\`javascript
db.runCommand({ ping: 1 })

db.adminCommand({ listDatabases: 1 })
\`\`\`

Successful output confirms authentication, TLS, and the gateway endpoint are working.

## Explore the built-in sample data

${optionalSampleDataContent}

If you did not load the sample, skip directly to **Create your own collection** below.

\`\`\`javascript
use StoreData

db.stores.find(
  {},
  { _id: 0, name: 1, city: 1, "sales.revenue": 1 }
).limit(3)

db.ratings.find({}, { _id: 1, rating: 1 }).limit(2)
\`\`\`

## Create your own collection

\`\`\`javascript
use quickstart

db.movies.deleteMany({})

db.movies.insertMany([
  { title: "The Matrix", year: 1999, genres: ["sci-fi", "action"] },
  { title: "Dune", year: 2021, genres: ["sci-fi", "adventure"] },
  { title: "Arrival", year: 2016, genres: ["sci-fi", "drama"] }
])

db.movies.createIndex({ title: 1 })

db.movies.find(
  { year: { $gte: 2000 } },
  { _id: 0, title: 1, year: 1 }
).sort({ year: -1 })
\`\`\`

## Use a trusted local certificate instead

If you want certificate validation instead of \`--tlsAllowInvalidCertificates\`, obtain the trusted certificate or CA file for your endpoint. For native packages, follow [certificate configuration](/docs/linux-packages#before-exposing-it-to-a-network). For Docker, copy the local certificate with:

\`\`\`bash
docker cp documentdb:/home/documentdb/.local/state/documentdb-gateway/tls/cert.pem ~/documentdb-cert.pem
\`\`\`

Then pass your certificate file to \`mongosh\`:

\`\`\`bash
mongosh localhost:10260 \\
  -u '<YOUR_USERNAME>' \\
  -p '<YOUR_PASSWORD>' \\
  --authenticationMechanism SCRAM-SHA-256 \\
  --tls \\
  --tlsCAFile ~/documentdb-cert.pem
\`\`\`

## Troubleshooting and debugging

If \`mongosh\` does not connect on the first try:

- Verify the local DocumentDB instance is running before you connect
- If you used Docker, check \`docker ps --filter "name=documentdb"\` and \`docker logs documentdb\`
- If you used native packages, check \`sudo documentdb-setup --status\`; for a manually built gateway, confirm its process is listening on port \`10260\`
- If authentication fails, confirm the username and password you used when you started DocumentDB
- If TLS validation fails, either keep \`--tlsAllowInvalidCertificates\` for the default local self-signed setup or switch to \`--tlsCAFile\` with a trusted certificate
- If \`mongosh\` is not installed, follow the [mongosh install guide](https://www.mongodb.com/docs/mongodb-shell/install/)
- Use [Python Quick Start](/docs/getting-started/python-setup) or [Node.js Quick Start](/docs/getting-started/nodejs-setup) to verify the same endpoint from an application driver

## Next steps

- [Visual Studio Code Quick Start](/docs/getting-started/vscode-quickstart)
- [API Reference](/docs/reference)
- [DocumentDB Local](/docs/documentdb-local)
- [Python Quick Start](/docs/getting-started/python-setup)
- [Node.js Quick Start](/docs/getting-started/nodejs-setup)
- [Samples Gallery](/samples)
`;

const documentdbLocalDataInitializationContent = `## Container image tags

The \`latest\` tag is a convenience alias. Pin an explicit tag for anything reproducible:

| Tag | Contents |
|---|---|
| \`ghcr.io/documentdb/documentdb/documentdb-local:pg18-0.117.0\` | DocumentDB 0.117.0 on PostgreSQL 18 |
| \`…:pg17-0.117.0\` | DocumentDB 0.117.0 on PostgreSQL 17 |
| \`…:pg16-0.117.0\` · \`…:pg15-0.117.0\` | PostgreSQL 16 and 15 |
| \`…:latest\` | Currently identical to \`pg17-0.117.0\` |

> \`latest\` tracks **PostgreSQL 17**, while the \`documentdb\` package on Linux pins
> **PostgreSQL 18**. If you evaluate in Docker and then deploy from packages, you change
> major version unless you pin the tag deliberately.

Every image records what it was built from:

\`\`\`bash
docker run --rm --entrypoint cat ghcr.io/documentdb/documentdb/documentdb-local:pg18-0.117.0 /version.txt
\`\`\`

## Data initialization

DocumentDB Local starts **empty**. Pass \`--init-data true\` to seed the \`StoreData\` database
with the \`stores\` and \`ratings\` collections:

\`\`\`bash
docker run -dt -p 127.0.0.1:10260:10260 --name documentdb \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username '<YOUR_USERNAME>' --password '<YOUR_PASSWORD>' --init-data true
\`\`\`

Seeding happens once per data volume, on a fresh volume. Existing volumes are not migrated
automatically; re-create the volume to seed again.

### Control initialization behavior

| Requirement | Arg | Env | Default | Description |
|---|---|---|---|---|
| Load built-in sample data | \`--init-data [true\\|false]\` | \`INIT_DATA\` | \`false\` | Seed the \`StoreData\` sample collections on a fresh data volume. |
| Skip built-in sample data | \`--skip-init-data\` | \`SKIP_INIT_DATA\` | — | Legacy alias for \`--init-data false\`. Does not affect \`--init-data-path\`. |
| Run custom initialization scripts | \`--init-data-path [PATH]\` | \`INIT_DATA_PATH\` | \`/init_doc_db.d\` | Execute every \`.js\` file in the mounted directory with \`mongosh\`. |

The built-in sample dataset currently includes 41,505 store documents and 2 rating documents.

### Use custom initialization scripts

\`\`\`bash
docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  -v /path/to/init/scripts:/init_doc_db.d \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username '<YOUR_USERNAME>' \\
  --password '<YOUR_PASSWORD>' \\
  --init-data-path /init_doc_db.d
\`\`\`

When \`--init-data-path\` is provided, DocumentDB Local skips the built-in sample data
and runs only the scripts you mounted.
`;

const gettingStartedIndexArchitectureContent = `## Architecture Components

DocumentDB consists of three primary components:

1. **pg_documentdb_core**: Core PostgreSQL extension that provides native BSON storage, field access, and indexing primitives.
2. **pg_documentdb**: Public API surface that implements document commands, CRUD operations, query execution, and index management.
3. **pg_documentdb_gw**: Gateway that translates MongoDB wire protocol requests into PostgreSQL operations and handles authentication, sessions, and TLS.

Together, these components let you use DocumentDB through MongoDB-compatible tools and drivers while still benefiting from PostgreSQL internals.
`;

const gettingStartedIndexStartHereContent = `## Start here

Choose your environment once, create a working instance, then connect with the client that fits your goal:

1. **Choose Native Linux or Docker.** [Native Linux installation](/packages?method=packages) is recommended for a complete stack on supported Linux hosts, with a new private PostgreSQL 18 instance. [Docker installation](/packages?method=docker) is for containers, including macOS/Windows evaluation.
2. **Create a working instance.** Follow the [Linux Packages Quick Start](/docs/getting-started/packages) or [Docker Quick Start](/docs/getting-started/docker). Native installation has two stages: install packages, then run the setup wizard. Neither copying a command nor installing files alone proves the endpoint is ready.
3. **Insert and read your first document.** Use the [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart), [Node.js Quick Start](/docs/getting-started/nodejs-setup), [Python Quick Start](/docs/getting-started/python-setup), or [Visual Studio Code Quick Start](/docs/getting-started/vscode-quickstart). Keep the same running instance; no second server installation is needed.

Native packages are pre-GA and support **fresh installation only**, not in-place upgrades from earlier releases. Removing packages preserves database files; reinstalling does not reset data.

For advanced control, [use an existing local PostgreSQL instance](/docs/linux-packages#adopt-an-existing-postgre-sql-instance) with administrator-managed configuration and restart, or [install the PostgreSQL extension only](/docs/linux-packages#install-the-postgre-sql-extension-only). Extension-only installation does not create a MongoDB-compatible endpoint.
`;

const gettingStartedIndexVerificationContent = `## Verify your setup

Before moving on to application code, confirm that DocumentDB is reachable and can insert and read a document. For native packages, inspect \`sudo documentdb-setup --status\`; for Docker, check \`docker ps --filter "name=documentdb"\` and wait for the readiness banner in \`docker logs documentdb\`.

Install [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/) separately for this shell example. Run it on the same host as DocumentDB. Use \`admin\` for the recommended native setup, or your Docker username, and enter your password at the prompt.

The certificate bypass is for **local development only**. Native setup binds the gateway on **all interfaces** by default: firewall port \`10260\` before setup and follow [network and certificate guidance](/docs/linux-packages#before-exposing-it-to-a-network).

\`\`\`bash
mongosh localhost:10260 \\
  -u '<YOUR_USERNAME>' \\
  -p \\
  --authenticationMechanism SCRAM-SHA-256 \\
  --tls \\
  --tlsAllowInvalidCertificates
\`\`\`

Then run:

\`\`\`javascript
db.runCommand({ ping: 1 })
use quickstart
db.orders.insertOne({ item: "widget", qty: 5 })
db.orders.find({ item: "widget" })
\`\`\`

The insert should report \`acknowledged: true\`, and the query should return your document. No sample-data loading is required.

For a fuller walkthrough, use the [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart). Driver-based examples are available in the [Node.js Quick Start](/docs/getting-started/nodejs-setup) and [Python Quick Start](/docs/getting-started/python-setup).
`;

const gettingStartedIndexTroubleshootingContent = `## Troubleshooting and debugging

If setup does not work on the first try:

- For native packages, check \`sudo documentdb-setup --status\` and [package troubleshooting](/docs/getting-started/packages#troubleshooting). The recommended PostgreSQL 18 install uses \`documentdb-local@18.target\`, not the meta-package alias.
- For Docker, confirm the container is running and port \`10260\` is published with \`docker ps\`. Inspect startup, authentication, and TLS errors with \`docker logs documentdb\`.
- If you want certificate validation instead of \`tlsAllowInvalidCertificates=true\`, follow the native [certificate steps](/docs/linux-packages#before-exposing-it-to-a-network) or [DocumentDB Local](/docs/documentdb-local) for Docker.
- For more verbose Docker diagnostics, re-create DocumentDB Local with \`-e DOCUMENTDB_LOG_LEVEL=debug\` (the \`--log-level\` flag is currently a no-op); the available runtime options are documented in [DocumentDB Local](/docs/documentdb-local).
- To change your installation choice, open [Native Linux installation](/packages?method=packages) or [Docker installation](/packages?method=docker).
`;

const gettingStartedIndexFeatureExplorationContent = `## Explore key features

Once you can connect successfully, continue with these guides:

- [API Reference](/docs/reference) - MongoDB command and operator coverage
- [Postgres Extension API](/docs/postgres-api) - PostgreSQL-side functions, types, and operators
- [DocumentDB Local](/docs/documentdb-local) - Local runtime options, sample data, certificates, and feature notes
- [Architecture under the hood](/docs/architecture) - How the core, extension, and gateway fit together
- [Samples Gallery](/samples) - End-to-end examples you can adapt for your own apps
`;

const gettingStartedIndexNextStepsContent = `## Next Steps

After you finish the initial setup:

- Continue with the [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart), [Node.js Quick Start](/docs/getting-started/nodejs-setup), or [Python Quick Start](/docs/getting-started/python-setup)
- Explore the [API Reference](/docs/reference) for detailed command and operator documentation
- Join our community to get support and contribute
`;

const articleTitleOverrides: Record<string, string> = {
  'getting-started/index': 'Getting Started',
  'getting-started/aws-setup': 'AWS Setup',
  'getting-started/azure-setup': 'Azure Setup',
  'getting-started/docker': 'Docker Quick Start',
  'getting-started/gcp-setup': 'GCP Setup',
  'getting-started/mongo-shell-quickstart': 'Mongo Shell Quick Start',
  'getting-started/nodejs-setup': 'Node.js Quick Start',
  'getting-started/packages': 'Linux Packages Quick Start',
  'getting-started/python-setup': 'Python Quick Start',
  'getting-started/vscode-extension-guide': 'Visual Studio Code Extension Guide',
  'getting-started/vscode-quickstart': 'Visual Studio Code Quick Start',
  'getting-started/yugabyte-setup': 'YugabyteDB Setup',
};

const articleDescriptionOverrides: Record<string, string> = {
  'getting-started/index':
    'Choose native Linux packages or Docker, create a DocumentDB instance, and insert and read your first document with a shell, driver, or editor.',
  'getting-started/packages':
    'Install DocumentDB on Linux with Ubuntu APT or EL9 RPM/dnf packages, set up a private PostgreSQL instance, and run your first query.',
  'getting-started/azure-setup':
    'Deploy and manage DocumentDB on Microsoft Azure for a fully managed experience.',
  'getting-started/vscode-quickstart':
    'Install the VS Code extension, connect to DocumentDB on native Linux or Docker, and insert and read your first document.',
  'getting-started/nodejs-setup':
    'Connect to DocumentDB on native Linux or Docker with the MongoDB Node.js driver and run your first queries.',
  'getting-started/python-setup':
    'Connect to DocumentDB on native Linux or Docker with PyMongo and run your first queries from Python.',
  'getting-started/mongo-shell-quickstart':
    'Connect to DocumentDB on native Linux or Docker with mongosh and insert and read your first document.',
};

function getArticleKey(section: string, file: string): string {
  return `${section}/${file}`;
}

function replaceFirstHeading(content: string, heading: string): string {
  if (/^#\s+.+$/m.test(content)) {
    return content.replace(/^#\s+.+$/m, `# ${heading}`);
  }

  return `# ${heading}\n\n${content}`;
}

function replaceSection(content: string, pattern: RegExp, replacement: string): string {
  const updatedContent = content.replace(pattern, replacement);
  return updatedContent === content ? `${content.trimEnd()}\n\n${replacement}` : updatedContent;
}

function normalizeArticle(section: string, file: string, frontmatter: Record<string, any>, content: string) {
  const articleKey = getArticleKey(section, file);
  const headingOverride = articleTitleOverrides[articleKey];
  const normalizedFrontmatter = {
    ...frontmatter,
    title: headingOverride ?? frontmatter.title,
    description: articleDescriptionOverrides[articleKey] ?? frontmatter.description,
  };

  let normalizedContent = content;

  if (section === 'getting-started' && file === 'index') {
    normalizedContent = updateGettingStartedIndexContent(normalizedContent);
  }

  if (section === 'getting-started' && file === 'prebuilt-packages') {
    normalizedContent = updatePrebuiltPackagesContent(normalizedContent);
  }

  if (section === 'getting-started' && file === 'azure-setup') {
    normalizedContent = normalizedContent.replace(/Micrtosoft/g, 'Microsoft');
  }

  if (section === 'documentdb-local' && file === 'index') {
    normalizedContent = updateDocumentDbLocalContent(normalizedContent);
  }

  if (headingOverride) {
    normalizedContent = replaceFirstHeading(normalizedContent, headingOverride);
  }

  return {
    frontmatter: normalizedFrontmatter,
    content: normalizedContent,
  };
}

function splitPrebuiltNavigation(section: string, links: Link[]): Link[] {
  if (section !== 'getting-started') {
    return links;
  }

  const isPrebuiltPackages = (link: Link) =>
    link.link.includes('prebuilt-packages') || /pre-built packages/i.test(link.title);
  const isMergedVscodeGuide = (link: Link) =>
    link.link.includes('vscode-extension-guide') || /visual studio code extension guide/i.test(link.title);
  const gettingStartedQuickLinks: Link[] = [
    {
      title: articleTitleOverrides['getting-started/packages'],
      link: '/docs/getting-started/packages',
    },
    {
      title: articleTitleOverrides['getting-started/docker'],
      link: '/docs/getting-started/docker',
    },
  ];
  const filteredLinks = links.filter((link) => !isPrebuiltPackages(link) && !isMergedVscodeGuide(link));
  const gettingStartedIndex = filteredLinks.find((link) => link.link === 'index.md');

  if (!gettingStartedIndex) {
    return [...gettingStartedQuickLinks, ...filteredLinks];
  }

  const remainingLinks = filteredLinks.filter((link) => link !== gettingStartedIndex);
  return [gettingStartedIndex, ...gettingStartedQuickLinks, ...remainingLinks];
}

function updateGettingStartedIndexContent(content: string): string {
  let updatedContent = content
    .replace(/https:\/\/documentdb\.io(?=\/(?:docs|packages|samples)\b)/g, '')
    .replace(
      /- Full compatibility with MongoDB wire protocol through the `pg_documentdb_api` layer/i,
      '- MongoDB-compatible document operations through the `pg_documentdb` extension and `pg_documentdb_gw` gateway'
    );

  updatedContent = replaceSection(
    updatedContent,
    /## Architecture Components[\s\S]*?(?=\n## Common Use Cases)/i,
    `${gettingStartedIndexArchitectureContent}\n\n`
  );

  updatedContent = replaceSection(
    updatedContent,
    /## Getting Started Options[\s\S]*?(?=\n## Community and Support)/i,
    `${gettingStartedIndexStartHereContent}\n\n${gettingStartedIndexVerificationContent}\n\n${gettingStartedIndexTroubleshootingContent}\n\n${gettingStartedIndexFeatureExplorationContent}\n\n`
  );

  updatedContent = replaceSection(
    updatedContent,
    /## Next Steps[\s\S]*$/i,
    gettingStartedIndexNextStepsContent
  );

  return updatedContent;
}

function updatePrebuiltPackagesContent(content: string): string {
  const legacyClaim =
    'Everything else — PostgreSQL 15/16, Debian 11/12/13, Ubuntu 22.04, RHEL-compatible 8 — is not built by first-party CI for this release. The [package repository](https://documentdb.io/packages) serves those targets the extension package from an earlier release, or build from the tag with the scripts in [`packaging/`](https://github.com/documentdb/documentdb/blob/main/packaging/README.md). PostgreSQL 15 is extension-only: `documentdb-setup` needs 16 or newer.';
  const currentPolicy =
    'Everything else — PostgreSQL 15/16, Debian 11/12/13, Ubuntu 22.04, RHEL-compatible 8 — is not built by first-party CI or hosted by documentdb.io for this release. Starting with v0.116, packages from earlier releases are not carried forward. Build from the matching tag with the [`packaging/` scripts](https://github.com/documentdb/documentdb/blob/v0.117-0/packaging/README.md); PostgreSQL 15 remains extension-only because `documentdb-setup` requires 16 or newer.';

  return content.replace(legacyClaim, currentPolicy);
}

function updateDocumentDbLocalContent(content: string): string {
  if (/## Data initialization/i.test(content)) {
    return content;
  }

  if (/## Feature support/i.test(content)) {
    return content.replace(
      /## Feature support/i,
      `${documentdbLocalDataInitializationContent}\n\n## Feature support`
    );
  }

  return `${content}\n\n${documentdbLocalDataInitializationContent}`;
}

export function getArticleContent(): Article {
  const contentPath = path.join(articlesDirectory, 'content.yml');
  const fileContents = fs.readFileSync(contentPath, 'utf8');
  const article = loadYaml(fileContents) as Article;

  // content.yml is cloned from the docs repo and does not know about sections
  // served from this file, so surface them on the landing page here.
  if (!article.landing.links.some((link) => link.link === '/docs/linux-packages')) {
    const localIndex = article.landing.links.findIndex((link) => link.link === '/docs/documentdb-local');
    const linuxPackagesLink = { title: 'Linux Packages', link: '/docs/linux-packages' };
    article.landing.links.splice(
      localIndex >= 0 ? localIndex + 1 : article.landing.links.length,
      0,
      linuxPackagesLink,
    );
  }

  return article;
}

export function getArticleNavigation(section: string): Link[] {
  const virtual = virtualSections[section];
  if (virtual) {
    return virtual.pages.map(page => ({
      title: page.title,
      link: page.slug ? `/docs/${section}/${page.slug}` : `/docs/${section}`,
    }));
  }

  const navPath = path.join(articlesDirectory, section, 'navigation.yml');

  if (!fs.existsSync(navPath)) {
    return [];
  }

  const fileContents = fs.readFileSync(navPath, 'utf8');
  const rawLinks = loadYaml(fileContents) as Link[];
  const normalizedLinks = splitPrebuiltNavigation(section, rawLinks);
  
  // Transform Markdown file links to published relative URIs
  return normalizedLinks.map(link => {
    // Convert .md file references to proper URIs
    // e.g., "index.md" -> "/docs/section"
    // e.g., "nodejs-setup.md" -> "/docs/section/nodejs-setup"
    let transformedLink = link.link;
    let transformedFile = '';
    
    if (transformedLink.endsWith('.md')) {
      transformedFile = transformedLink.replace('.md', '');
      if (transformedFile === 'index') {
        transformedLink = `/docs/${section}`;
      } else {
        transformedLink = `/docs/${section}/${transformedFile}`;
      }
    } else if (transformedLink.startsWith(`/docs/${section}`)) {
      const remainingPath = transformedLink.slice(`/docs/${section}`.length).replace(/^\/+|\/+$/g, '');
      transformedFile = remainingPath || 'index';
    }
    
    return {
      ...link,
      title: articleTitleOverrides[getArticleKey(section, transformedFile)] ?? link.title,
      link: transformedLink,
      // Recursively transform children if they exist
      children: link.children?.map(child => ({
        ...child,
        title:
          articleTitleOverrides[
            getArticleKey(
              section,
              child.link.endsWith('.md')
                ? child.link.replace('.md', '')
                : child.link.slice(`/docs/${section}`.length).replace(/^\/+|\/+$/g, '') || 'index'
            )
          ] ?? child.title,
        link: child.link.endsWith('.md') 
          ? `/docs/${section}/${child.link.replace('.md', '')}`
          : child.link
      }))
    };
  });
}

export function getMarkdownContent(section: string, file: string = 'index'): string {
  const markdownPath = path.join(articlesDirectory, section, `${file}.md`);

  if (!fs.existsSync(markdownPath)) {
    return '';
  }

  return fs.readFileSync(markdownPath, 'utf8');
}

export function getAllSections(): string[] {
  const sections = fs.readdirSync(articlesDirectory, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  return [...sections, ...Object.keys(virtualSections)];
}

export function getAllArticlePaths(): { section: string; slug: string[] }[] {
  const sections = getAllSections();
  const paths: { section: string; slug: string[] }[] = [];

  sections.forEach(section => {
    const virtual = virtualSections[section];
    if (virtual) {
      virtual.pages.forEach(page => {
        paths.push({ section, slug: page.slug ? [page.slug] : [] });
      });
      return;
    }

    const sectionPath = path.join(articlesDirectory, section);
    const files = fs.readdirSync(sectionPath, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
      .map(dirent => dirent.name.replace('.md', ''));

    files.forEach(file => {
      if (file === 'index') {
        // For index files, create both /section and /section/index routes
        paths.push({ section, slug: [] });
      } else {
        paths.push({ section, slug: [file] });
      }
    });

    if (section === 'getting-started') {
      paths.push({ section, slug: ['docker'] });
      paths.push({ section, slug: ['packages'] });
    }
  });

  const uniquePaths = new Map<string, { section: string; slug: string[] }>();
  paths.forEach((entry) => {
    const key = `${entry.section}/${entry.slug.join('/')}`;
    uniquePaths.set(key, entry);
  });

  return Array.from(uniquePaths.values());
}

export function getArticleByPath(section: string, slug: string[] = []): {
  content: string;
  frontmatter: {
    title?: string;
    [key: string]: any;
  };
  navigation: Link[];
  section: string;
  file: string;
} | null {
  const file = slug.length > 0 ? slug[slug.length - 1] : 'index';
  const navigation = getArticleNavigation(section);

  if (section === 'linux-packages' && file === 'index') {
    return {
      content: linuxPackagesOperationsContent,
      frontmatter: {
        title: 'Operating a Package Install',
        description: 'Secure, manage, upgrade and remove a DocumentDB installed from Linux packages, including known package-install issues.',
      },
      navigation,
      section,
      file,
    };
  }

  if (section === 'linux-packages' && file === 'offline') {
    return {
      content: linuxPackagesOfflineContent,
      frontmatter: {
        title: 'Offline / Air-gapped Install',
        description: 'Stage a full dependency closure on a connected machine and install DocumentDB on a host with no internet access.',
      },
      navigation,
      section,
      file,
    };
  }

  if (section === 'getting-started' && file === 'docker') {
    return {
      content: dockerGuideContent,
      frontmatter: {
        title: articleTitleOverrides[getArticleKey(section, file)],
        description: 'Start DocumentDB Local with Docker, verify the connection, and find troubleshooting and next-step guidance.',
      },
      navigation,
      section,
      file,
    };
  }

  if (section === 'getting-started' && file === 'packages') {
    return {
      content: linuxPackagesGuideContent,
      frontmatter: {
        title: articleTitleOverrides[getArticleKey(section, file)],
        description: articleDescriptionOverrides[getArticleKey(section, file)],
      },
      navigation,
      section,
      file,
    };
  }

  if (section === 'getting-started' && file === 'nodejs-setup') {
    return {
      content: nodejsGuideContent,
      frontmatter: {
        title: articleTitleOverrides[getArticleKey(section, file)],
        description: articleDescriptionOverrides[getArticleKey(section, file)],
      },
      navigation,
      section,
      file,
    };
  }

  if (section === 'getting-started' && file === 'python-setup') {
    return {
      content: pythonQuickStartContent,
      frontmatter: {
        title: articleTitleOverrides[getArticleKey(section, file)],
        description: articleDescriptionOverrides[getArticleKey(section, file)],
      },
      navigation,
      section,
      file,
    };
  }

  if (section === 'getting-started' && file === 'vscode-quickstart') {
    return {
      content: vscodeQuickStartGuideContent,
      frontmatter: {
        title: articleTitleOverrides[getArticleKey(section, file)],
        description: articleDescriptionOverrides[getArticleKey(section, file)],
      },
      navigation,
      section,
      file,
    };
  }

  if (section === 'getting-started' && file === 'mongo-shell-quickstart') {
    return {
      content: mongoShellQuickStartContent,
      frontmatter: {
        title: articleTitleOverrides[getArticleKey(section, file)],
        description: articleDescriptionOverrides[getArticleKey(section, file)],
      },
      navigation,
      section,
      file,
    };
  }

  const rawContent = getMarkdownContent(section, file);
  
  if (!rawContent) {
    return null;
  }

  // Parse front matter
  const { data: frontmatter, content } = matter(rawContent);
  const normalizedArticle = normalizeArticle(section, file, frontmatter, content);

  return {
    content: normalizedArticle.content,
    frontmatter: normalizedArticle.frontmatter,
    navigation,
    section,
    file
  };
}
