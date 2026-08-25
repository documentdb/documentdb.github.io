import fs from 'fs';
import path from 'path';
import { load as loadYaml } from 'js-yaml';
import matter from 'gray-matter';
import { Article } from '../types/Article';
import { Link } from '../types/Link';
import { buildAptInstallCommand, buildRpmInstallCommand } from '../lib/packageInstall';
import { documentdbDiscordUrl } from './externalLinks';

const articlesDirectory = path.join(process.cwd(), 'articles');
const dockerGuideContent = `# Docker Quick Start

Run DocumentDB locally with Docker and verify the setup before moving to driver code.

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
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD> \\
  --init-data true
\`\`\`

> Replace \`<YOUR_USERNAME>\` and \`<YOUR_PASSWORD>\` with your own credentials.
>
> \`-p 127.0.0.1:10260:10260\` keeps the endpoint on loopback. A bare \`-p 10260:10260\`
> publishes it on **every** interface, which is rarely what you want on a laptop.
>
> \`--init-data true\` seeds the built-in sample data into \`sampledb\`, which the
> verification step below queries. It is **not** enabled by default — without it the
> container starts with no \`sampledb\` and \`use sampledb\` returns nothing. The data is
> seeded once per data volume; re-create the volume to seed again. See
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

\`\`\`bash
mongosh localhost:10260 \\
  -u <YOUR_USERNAME> \\
  -p <YOUR_PASSWORD> \\
  --authenticationMechanism SCRAM-SHA-256 \\
  --tls \\
  --tlsAllowInvalidCertificates
\`\`\`

Then run a quick health check. The sample data below needs \`--init-data true\` on the \`docker run\` above — without it \`sampledb\` does not exist:

\`\`\`javascript
db.runCommand({ ping: 1 })

use sampledb

db.users.find({}, { firstName: 1, lastName: 1, email: 1, _id: 0 }).limit(3)
\`\`\`

If you prefer certificate validation instead of \`--tlsAllowInvalidCertificates\`, follow the certificate steps in [DocumentDB Local](/docs/documentdb-local).

## Persistence and initialization

The quick start command above is ideal for disposable local environments. When you need more control:

- Use \`--data-path\` with a mounted host directory to keep data across container restarts
- Omit \`--init-data true\` if you want an empty instance instead of the \`sampledb\` collections
- Use \`--init-data-path\` to run your own \`.js\` initialization scripts with \`mongosh\` at startup

The built-in sample dataset includes \`users\`, \`products\`, \`orders\`, and \`analytics\` collections in \`sampledb\`.

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
- Restart the container with \`--log-level debug\` for more verbose local diagnostics
- Use the certificate flow in [DocumentDB Local](/docs/documentdb-local) if your client should validate TLS certificates
- Use [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart) for a fuller shell walkthrough

## Next steps

- [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart)
- [Node.js Quick Start](/docs/getting-started/nodejs-setup)
- [Python Quick Start](/docs/getting-started/python-setup)
- [DocumentDB Local](/docs/documentdb-local)
- [Samples Gallery](/samples)
- [Linux Packages Quick Start](/docs/getting-started/packages)
- [Package Finder](/packages)
`;

const linuxPackagesGuideContent = `# Linux Packages Quick Start

Install DocumentDB on Debian, Ubuntu, or RHEL-compatible hosts from the published package repository.

## Install

**Ubuntu 24.04 and RHEL-compatible 9, on PostgreSQL 17 or 18**, get the full stack — extension, gateway, setup wizard and systemd units. Every other target is extension-only: see [Other targets](#other-targets).

### Ubuntu 24.04, PostgreSQL 18 (APT)

\`\`\`bash
${buildAptInstallCommand('ubuntu24', 'amd64', '18')}
\`\`\`

### RHEL-compatible 9, PostgreSQL 18 (RPM)

\`\`\`bash
${buildRpmInstallCommand('rhel9', 'x86_64', '18')}
\`\`\`

For PostgreSQL 17, install \`documentdb-17\`; the \`documentdb\` meta package is equivalent to \`documentdb-18\`. For any other distribution, architecture or major, use the [Package Finder](/packages).

> [!NOTE]
> In a container running as \`root\`, drop the leading \`sudo\` (it is often not installed). Leave \`sudo -u <user>\` commands alone — those switch user rather than elevate; run them as \`su <user> -c '...'\` instead. On Debian/Ubuntu also \`export DEBIAN_FRONTEND=noninteractive\` first, or \`tzdata\` prompts and the install hangs with no visible error.

> [!WARNING]
> **On ARM, change three strings** — the commands above are written for x86_64.
>
> | In | Replace | With |
> | --- | --- | --- |
> | APT \`documentdb.list\` line | \`arch=amd64\` | \`arch=$(dpkg --print-architecture)\` |
> | RPM PGDG URL | \`EL-9-x86_64\` | \`EL-9-$(uname -m)\` (same for \`EL-8-x86_64\`) |
> | RPM \`config-manager\` fallback | \`codeready-builder-for-rhel-9-x86_64-rpms\` | \`...-aarch64-rpms\` |
>
> Neither failure names the architecture. APT reports \`documentdb-18 : Depends: postgresql-18-documentdb but it is not installable\` — only the extension package is arch-specific, so it is the one that goes missing. DNF reports \`Bad GPG signature\` on \`pgdg-common\`, because PGDG ships a separate reporpm per architecture under an identical file name.

> [!IMPORTANT]
> **Do not drop the \`crb\` line.** PostGIS pulls in \`gdal*-libs\`, which needs \`libqhull_r.so.7\`, and that ships only in CRB (\`powertools\` on EL8). Without it \`dnf install\` fails with \`nothing provides libqhull_r.so.7()(64bit)\`, naming GDAL but never the missing repository.

## Set up and connect

Installing the packages puts files on disk; it does not create a database or start the endpoint. The setup wizard does that:

\`\`\`bash
sudo documentdb-setup --admin-user admin
\`\`\`

It creates the PostgreSQL instance, installs the extensions, bootstraps the admin user, starts the gateway, and enables \`documentdb-local@<major>.target\` so the stack survives reboot. It **prompts for the admin password**; for servers and CI pass \`--admin-password-file <file>\` or \`--admin-password-stdin\` together with \`--yes\`.

\`mongosh\` is not shipped by these packages. Install it from MongoDB's own repository — these are the two paved-road targets, and the [official instructions](https://www.mongodb.com/docs/mongodb-shell/install/) cover every other platform:

\`\`\`bash
# Ubuntu 24.04
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list >/dev/null
sudo apt update && sudo apt install -y mongodb-mongosh

# RHEL-compatible 9
printf '%s\\n' '[mongodb-org-8.0]' 'name=MongoDB Repository' \\
  "baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/8.0/$(uname -m)/" \\
  'gpgcheck=1' 'enabled=1' 'gpgkey=https://pgp.mongodb.com/server-8.0.asc' | sudo tee /etc/yum.repos.d/mongodb-org-8.0.repo >/dev/null
sudo dnf install -y mongodb-mongosh
\`\`\`

Then connect. A bare \`-p\` makes \`mongosh\` **prompt** for the password, so pass it inline in scripts and CI — otherwise a non-interactive shell sends an empty password and fails with the unhelpful \`MongoServerError: Invalid key\`:

\`\`\`bash
mongosh localhost:10260 -u admin -p '<PASSWORD>' --authenticationMechanism SCRAM-SHA-256 \\
        --tls --tlsAllowInvalidCertificates --eval 'db.runCommand({ping: 1})'
\`\`\`

Or as a URI — percent-encode reserved characters in the password (\`@\` becomes \`%40\`), or it misparses:

\`\`\`bash
mongosh 'mongodb://admin:<PASSWORD>@127.0.0.1:10260/mydb?tls=true&tlsAllowInvalidCertificates=true' \\
        --eval 'db.runCommand({ping: 1})'
\`\`\`

A database and collection are created on first write:

\`\`\`javascript
db.orders.insertOne({ item: "widget", qty: 5 })
db.orders.find()
\`\`\`

## Before exposing it to a network

The gateway binds **all interfaces** (\`0.0.0.0:10260\` and \`[::]:10260\`) by default, even though the connect string above says \`127.0.0.1\`. The PostgreSQL instance behind it stays on loopback.

Before using this anywhere but a private machine:

- Restrict the listener with \`DOCUMENTDB_LISTEN_ADDR=127.0.0.1:10260\` in \`/etc/documentdb/local/<major>/gateway.env\` and restart the service, or firewall port \`10260\`. Note that re-running \`documentdb-setup\` rewrites that file, so a firewall rule is the more durable control.
- Replace the auto-generated self-signed certificate. \`tlsAllowInvalidCertificates=true\` disables certificate validation — point \`DOCUMENTDB_TLS_CERT_FILE\` / \`DOCUMENTDB_TLS_KEY_FILE\` at a real certificate and drop that option.
- Use a strong admin password and create per-application users rather than sharing \`admin\`.

## Verify and operate

\`\`\`bash
sudo documentdb-setup --status      # gateway listener, service states, resolved paths
documentdb-gateway --version        # DocumentDB version
dpkg -l | grep documentdb           # or: rpm -qa | grep documentdb
\`\`\`

> Do not use \`db.version()\` or \`buildInfo\` in \`mongosh\` to check the DocumentDB version — those report the emulated MongoDB wire version, not DocumentDB's.

| Thing | Where |
| --- | --- |
| Gateway port | \`10260\` |
| PostgreSQL port | \`9700 + <major>\` (9718 for PG 18), loopback only |
| Gateway log | \`/var/lib/documentdb-gateway/gateway.log\` |
| PostgreSQL log | \`/var/lib/documentdb-local/<major>/data/pglog.log\` |
| Setup state / gateway env | \`/etc/documentdb/local/<major>/setup.conf\`, \`.../gateway.env\` |

Day 2 (units are templated per PostgreSQL major):

\`\`\`bash
sudo systemctl status  documentdb-local@18.target
sudo systemctl restart documentdb-local@18.target
sudo systemctl stop    documentdb-local@18.target
\`\`\`

**Without systemd** (containers, some dev images) the wizard starts the gateway directly and says so. \`systemctl\` will fail with *"System has not been booted with systemd"* — use \`documentdb-setup --status\` to inspect, re-run \`documentdb-setup\` to restart, \`--restore\` to stop.

> [!NOTE]
> On a **minimal RHEL-compatible image, install \`procps-ng\` first**. \`documentdb-setup\` locates the directly-started gateway with \`pgrep\`; without it \`--restore\` reports success while the gateway keeps serving, and a later re-run then fails with \`Port 10260 is already in use\`. Debian and Ubuntu images already ship \`procps\`.

### Running SQL against the managed instance

\`documentdb-setup\` runs a private instance as the \`documentdb-local\` user on a socket, so a bare \`psql\` will not find it:

\`\`\`bash
sudo -u documentdb-local psql -h /run/documentdb-local/18/postgresql -p 9718 -d postgres
\`\`\`

Use that connection for the \`ALTER EXTENSION\` statements under [Upgrading](#upgrading), and to read the installed versions:

\`\`\`sql
SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'documentdb%';
\`\`\`

### Remove or reset

\`\`\`bash
# Stop the stack first — package removal deletes files but does not stop a
# running gateway. On systemd hosts:
sudo systemctl stop documentdb-local@18.target

sudo documentdb-setup --restore                                 # detach the managed integration
sudo documentdb-local-reset --pg-version 18 --confirm-destroy    # DESTROYS the data directory

# Name the package you installed AND the extension: autoremove does not reap
# postgresql-18-documentdb, and 'remove' would leave config behind.
sudo apt purge --autoremove documentdb-18 postgresql-18-documentdb
sudo dnf remove documentdb-18 postgresql18-documentdb && sudo dnf autoremove
\`\`\`

## Upgrading

A package upgrade only replaces files. Afterwards, update the extensions in every database that has DocumentDB installed:

\`\`\`sql
ALTER EXTENSION documentdb_core UPDATE;
ALTER EXTENSION documentdb UPDATE;
ALTER EXTENSION documentdb_extended_rum UPDATE;  -- only if installed
\`\`\`

PostgreSQL applies intermediate upgrade scripts automatically. In-place upgrades are not yet a fully tested path, so take a backup first.

## Other targets

The full stack is published only for **Ubuntu 24.04 and RHEL-compatible 9 on PostgreSQL 17 or 18**. Everywhere else — including **PostgreSQL 16 on every distribution** — you get the extension package alone: no gateway, no \`documentdb-setup\`, no systemd units. There is no \`documentdb-16\`; asking for it fails with *"has no installation candidate"* (APT) or *"No match for argument"* (DNF).

| Distribution | PGDG suite | Repository component | Install |
| --- | --- | --- | --- |
| Ubuntu 24.04 | \`noble-pgdg\` | \`ubuntu24\` | \`documentdb-18\` / \`documentdb-17\` — full stack |
| RHEL-compatible 9 | — | \`rpm/rhel9\` | \`documentdb-18\` / \`documentdb-17\` — full stack |
| Ubuntu 22.04 | \`jammy-pgdg\` | \`ubuntu22\` | \`postgresql-18-documentdb\` |
| Debian 11 | \`bullseye-pgdg\` | \`deb11\` | \`postgresql-17-documentdb\` — **PG 18 not installable** |
| Debian 12 | \`bookworm-pgdg\` | \`deb12\` | \`postgresql-18-documentdb\` |
| Debian 13 | \`trixie-pgdg\` | \`deb13\` | \`postgresql-18-documentdb\` |
| RHEL-compatible 8 | — | \`rpm/rhel8\` | \`postgresql18-documentdb\` — \`EL-8\` URLs, \`powertools\` not \`crb\` |

The APT repository is \`https://documentdb.io/deb stable <component>\`; the RPM baseurl is \`https://documentdb.io/rpm/<rhel8|rhel9>\`. It serves **0.116** on the full-stack targets and **0.114** everywhere else — \`apt-cache madison <pkg>\` / \`dnf --showduplicates list <pkg>\` show the truth.

**Debian 11 has no PostgreSQL 18** — the upstream Bullseye PostGIS build does not exist, so the install fails with \`Depends: postgresql-18-postgis-3 but it is not installable\`. Use 16 or 17.

**Debian 13:** \`apt.postgresql.org\` also publishes this extension and its version sorts higher, so PGDG's build installs by default. Pin with \`apt install postgresql-18-documentdb=<VERSION>\` for this repository's copy.

Confirm the extension landed:

\`\`\`bash
apt-cache policy postgresql-18-documentdb    # or: dnf info postgresql18-documentdb
dpkg -L postgresql-18-documentdb | grep -E 'documentdb.*\\.(control|sql|so)$' | head
\`\`\`

For a MongoDB-compatible endpoint on these hosts, use the [Docker Quick Start](/docs/getting-started/docker), or run the gateway from source against your host PostgreSQL with \`scripts/start_oss_server.sh\` and \`scripts/build_and_start_gateway.sh\` in the [DocumentDB repository](https://github.com/documentdb/documentdb). Run those as an unprivileged user, and \`export TERM=xterm\` first in non-interactive shells or the script aborts on \`tput\`.

## Offline / air-gapped install

An air-gapped host has no route to PGDG either, and DocumentDB pulls PostgreSQL, \`pg_cron\`, \`pgvector\` and PostGIS from there — the release assets alone are not enough. Stage the full dependency closure on a connected machine with the **same distribution, release and architecture** as the target.

### Stage the bundle (connected machine)

With the same repositories configured as for an online install — run the [Install](#install) command for your distribution **up to and including \`apt update\` / the \`dnf config-manager\` line, but not the final \`install\`**:

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

Expect ~200 packages / 200 MB (DEB) or ~270 / 170 MB (RPM), mostly PostGIS and GDAL. The \`unsandboxed as root\` and \`dpkg-scanpackages ... override file\` warnings are harmless.

### Install from the bundle (air-gapped target)

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

Then continue with **Set up and connect** above — \`documentdb-setup\` needs no network.

### Smaller offline cases

If the target already has PostgreSQL, the PGDG extension dependencies (\`postgresql-N-cron\`, \`-pgvector\`, \`-postgis-3\`) and \`jq\`, you do not need a bundle:

- **Extension only, one file** — \`sudo apt install ./ubuntu24.04-postgresql-18-documentdb_0.116-0_amd64.deb\`. No gateway and no \`documentdb-setup\`.
- **Full stack from the release assets** — pass all six files for your platform to a *single* \`apt install\` / \`dnf install\`. Local files resolve dependencies only against enabled repositories, so the meta package on its own fails with \`Depends: documentdb-18 ... but it is not installable\`.

## Troubleshooting

- \`sudo documentdb-setup --status\` reports the listener, service states and resolved paths
- \`has no installation candidate\` / \`No match for argument\` — that target is extension-only, or PGDG was not added first. See [Other targets](#other-targets)
- \`nothing provides libqhull_r.so.7\` — the \`crb\` line did not run
- \`Depends: postgresql-N-documentdb but it is not installable\` — wrong \`arch=\` for the host
- \`Bad GPG signature\` on \`pgdg-common\` — wrong architecture in the PGDG reporpm URL
- \`apt install\` hangs in a container — \`export DEBIAN_FRONTEND=noninteractive\`
- Debian 11 has no PostgreSQL 18 (no upstream Bullseye PostGIS); use 16 or 17

## Next steps

- [Docker Quick Start](/docs/getting-started/docker)
- [Building the packages from source](https://github.com/documentdb/documentdb/blob/main/packaging/README.md)
- [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart)
- [Node.js Quick Start](/docs/getting-started/nodejs-setup)
- [Python Quick Start](/docs/getting-started/python-setup)
- [API Reference](/docs/reference)
- [Samples Gallery](/samples)
- [Package Finder](/packages)
`;

const vscodeQuickStartGuideContent = `# Visual Studio Code Quick Start

Use DocumentDB for VS Code to connect to a local DocumentDB instance, browse sample data, and create your first database without leaving the editor.

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- The [DocumentDB for VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-documentdb)
- A local DocumentDB instance from [Docker Quick Start](/docs/getting-started/docker) or a host setup with a running DocumentDB gateway
- Optional: [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/) for independent connection checks

## Install the extension

Install the extension from the VS Code marketplace, or run:

\`\`\`bash
code --install-extension ms-azuretools.vscode-documentdb
\`\`\`

If VS Code prompts you to reload after installation, do that before creating a connection.

## Start DocumentDB first

For the fastest local setup, start DocumentDB Local with Docker:

\`\`\`bash
docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>
\`\`\`

If you prefer a host installation instead of Docker, use [Linux Packages Quick Start](/docs/getting-started/packages) for the PostgreSQL extension package and run the gateway from source.

## Add a local connection in VS Code

1. Open the **DocumentDB** view in the VS Code activity bar.
2. In the local connection area, select **DocumentDB Local** and start the **New Local Connection** flow.
3. Enter port \`10260\`, your username, and your password.
4. At the TLS/SSL prompt:
   - Choose **Disable TLS/SSL (Not recommended)** if you are using the default self-signed local setup and have not configured trust for the certificate yet.
   - Keep **Enable TLS/SSL (Default)** if you already configured a trusted local certificate.
5. Finish the wizard and confirm the new connection appears in the connections tree.

## Verify the connection in the extension

Once connected:

1. Expand the connection and open \`sampledb\` if you started with DocumentDB Local sample data.
2. Open a collection such as \`users\` or \`products\`.
3. Switch between the **Table**, **Tree**, and **JSON** views to confirm the extension is reading data correctly.
4. Create your own database and collection from the context menu, then add a test document like:

\`\`\`json
{
  "name": "VS Code Quick Start",
  "source": "vscode",
  "status": "connected"
}
\`\`\`

If you prefer to validate outside the extension first, use [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart).

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
- If you used a host-built gateway, confirm the gateway process is running and listening on the port you entered
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

## Prerequisites

- Node.js 18 or later
- npm
- [Docker](https://www.docker.com/)
- Basic familiarity with JavaScript

## Start DocumentDB Local

\`\`\`bash
docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>
\`\`\`

> Replace \`<YOUR_USERNAME>\` and \`<YOUR_PASSWORD>\` with your own credentials.
>
> DocumentDB Local uses a self-signed certificate by default, so the quickest local
> Node.js connection uses \`tlsAllowInvalidCertificates=true\`.

## Create a project

\`\`\`bash
mkdir my-documentdb-app
cd my-documentdb-app
npm init -y
npm install mongodb
\`\`\`

## Connect and run your first queries

Create an \`index.js\` file:

\`\`\`javascript
const { MongoClient } = require("mongodb");

const uri =
  "mongodb://<YOUR_USERNAME>:<YOUR_PASSWORD>@localhost:10260/" +
  "?authSource=admin&tls=true&tlsAllowInvalidCertificates=true&directConnection=true";

async function main() {
  const client = new MongoClient(uri);

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

If you want certificate validation instead of \`tlsAllowInvalidCertificates=true\`,
copy the generated certificate from the container and point the driver at it.

\`\`\`bash
docker cp documentdb:/home/documentdb/.local/state/documentdb-gateway/tls/cert.pem ~/documentdb-cert.pem
\`\`\`

\`\`\`javascript
const uri =
  "mongodb://<YOUR_USERNAME>:<YOUR_PASSWORD>@localhost:10260/" +
  "?authSource=admin&tls=true&tlsCAFile=/absolute/path/documentdb-cert.pem&directConnection=true";
\`\`\`

## Next steps

- [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart)
- [Python Quick Start](/docs/getting-started/python-setup)
- [DocumentDB Local](/docs/documentdb-local)
- [Samples Gallery](/samples)
`;

const pythonQuickStartContent = `# Python Quick Start

Use PyMongo to connect to DocumentDB, verify authentication and TLS, and run your first document queries from Python.

## Prerequisites

- Python 3.9 or later
- pip
- A local DocumentDB instance from [Docker Quick Start](/docs/getting-started/docker) or [Linux Packages Quick Start](/docs/getting-started/packages)
- Optional: [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/) for independent connection checks

## Start DocumentDB first

For the fastest local setup, start DocumentDB Local with Docker:

\`\`\`bash
docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>
\`\`\`

If you prefer a host installation instead of Docker, use [Linux Packages Quick Start](/docs/getting-started/packages) for the PostgreSQL extension package and run the gateway from source.

> DocumentDB Local uses a self-signed certificate by default, so the quickest local
> PyMongo connection uses \`tlsAllowInvalidCertificates=true\`.

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

Create a \`quickstart.py\` file:

\`\`\`python
from pymongo import MongoClient

uri = (
    "mongodb://<YOUR_USERNAME>:<YOUR_PASSWORD>@localhost:10260/"
    "?tls=true&tlsAllowInvalidCertificates=true"
)

client = MongoClient(uri)

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

If you started with DocumentDB Local sample data, add this snippet after \`client.admin.command("ping")\`:

\`\`\`python
for user in client["sampledb"]["users"].find(
    {},
    {"_id": 0, "firstName": 1, "lastName": 1, "email": 1},
).limit(3):
    print(user)
\`\`\`

## Use a trusted local certificate instead

If you want certificate validation instead of \`tlsAllowInvalidCertificates=true\`, copy the generated certificate from the container and pass it to \`MongoClient\`.

\`\`\`bash
docker cp documentdb:/home/documentdb/.local/state/documentdb-gateway/tls/cert.pem ~/documentdb-cert.pem
\`\`\`

\`\`\`python
client = MongoClient(
    "mongodb://<YOUR_USERNAME>:<YOUR_PASSWORD>@localhost:10260/?tls=true",
    tlsCAFile="/absolute/path/documentdb-cert.pem",
)
\`\`\`

## Troubleshooting and debugging

If the Python quick start does not work on the first try:

- Verify your local DocumentDB instance is running before you start Python
- If you used Docker, check \`docker ps --filter "name=documentdb"\` and \`docker logs documentdb\`
- If you used a host-built gateway, confirm the gateway process is running and listening on port \`10260\`
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

## Prerequisites

- [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/)
- A local DocumentDB instance from [Docker Quick Start](/docs/getting-started/docker) or [Linux Packages Quick Start](/docs/getting-started/packages)
- A local port available for DocumentDB (the examples use \`10260\`)

## Start DocumentDB first

For the fastest local setup, start DocumentDB Local with Docker:

\`\`\`bash
docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>
\`\`\`

If you prefer a host installation instead of Docker, use [Linux Packages Quick Start](/docs/getting-started/packages) for the PostgreSQL extension package and run the gateway from source.

> Replace \`<YOUR_USERNAME>\` and \`<YOUR_PASSWORD>\` with your own credentials.
>
> DocumentDB Local starts **empty** — pass \`--init-data true\` on the \`docker run\` above to seed the \`sampledb\` sample data used below. It also uses a self-signed certificate by default, so the fastest local \`mongosh\` connection adds \`--tlsAllowInvalidCertificates\`.

## Connect and verify the connection

\`\`\`bash
mongosh localhost:10260 \\
  -u <YOUR_USERNAME> \\
  -p <YOUR_PASSWORD> \\
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

Sample data is **opt-in**: this section needs a container started with \`--init-data true\`. Without it \`sampledb\` does not exist and these queries return nothing.

\`\`\`javascript
use sampledb

db.users.find(
  {},
  { firstName: 1, lastName: 1, email: 1, _id: 0 }
).limit(3)

db.products.find(
  { category: "Electronics" },
  { name: 1, price: 1, _id: 0 }
)
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

If you want certificate validation instead of \`--tlsAllowInvalidCertificates\`, copy
the generated certificate from the container and pass it to \`mongosh\`.

\`\`\`bash
docker cp documentdb:/home/documentdb/.local/state/documentdb-gateway/tls/cert.pem ~/documentdb-cert.pem

mongosh localhost:10260 \\
  -u <YOUR_USERNAME> \\
  -p <YOUR_PASSWORD> \\
  --authenticationMechanism SCRAM-SHA-256 \\
  --tls \\
  --tlsCAFile ~/documentdb-cert.pem
\`\`\`

## Troubleshooting and debugging

If \`mongosh\` does not connect on the first try:

- Verify the local DocumentDB instance is running before you connect
- If you used Docker, check \`docker ps --filter "name=documentdb"\` and \`docker logs documentdb\`
- If you used a host-built gateway, confirm the gateway process is running and listening on port \`10260\`
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
| \`ghcr.io/documentdb/documentdb/documentdb-local:pg18-0.116.0\` | DocumentDB 0.116.0 on PostgreSQL 18 |
| \`…:pg17-0.116.0\` | DocumentDB 0.116.0 on PostgreSQL 17 |
| \`…:pg16-0.116.0\` · \`…:pg15-0.116.0\` | PostgreSQL 16 and 15 |
| \`…:latest\` | Currently identical to \`pg17-0.116.0\` |

> \`latest\` tracks **PostgreSQL 17**, while the \`documentdb\` package on Linux pins
> **PostgreSQL 18**. If you evaluate in Docker and then deploy from packages, you change
> major version unless you pin the tag deliberately.

Every image records what it was built from:

\`\`\`bash
docker run --rm --entrypoint cat ghcr.io/documentdb/documentdb/documentdb-local:pg18-0.116.0 /version.txt
\`\`\`

## Data initialization

DocumentDB Local starts **empty**. Pass \`--init-data true\` to seed a \`sampledb\` database
with the \`users\`, \`products\`, \`orders\`, and \`analytics\` collections:

\`\`\`bash
docker run -dt -p 10260:10260 --name documentdb \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> --password <YOUR_PASSWORD> --init-data true
\`\`\`

Seeding happens once per data volume, on a fresh volume. Re-create the volume to seed again.

### Control initialization behavior

| Requirement | Arg | Env | Default | Description |
|---|---|---|---|---|
| Load built-in sample data | \`--init-data [true\\|false]\` | \`INIT_DATA\` | \`false\` | Seed the \`sampledb\` sample collections on a fresh data volume. |
| Skip built-in sample data | \`--skip-init-data\` | \`SKIP_INIT_DATA\` | — | Legacy alias for \`--init-data false\`. Does not affect \`--init-data-path\`. |
| Run custom initialization scripts | \`--init-data-path [PATH]\` | \`INIT_DATA_PATH\` | \`/init_doc_db.d\` | Execute every \`.js\` file in the mounted directory with \`mongosh\`. |

The built-in sample dataset currently includes 5 users, 5 products, 4 orders, and 2
analytics records.

### Use custom initialization scripts

\`\`\`bash
docker run -dt --name documentdb \\
  -p 10260:10260 \\
  -v /path/to/init/scripts:/init_doc_db.d \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD> \\
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

If you're new to DocumentDB, use this order:

1. [Docker Quick Start](/docs/getting-started/docker) - Fastest local install for evaluation and development
2. [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart) - Verify connectivity, authentication, and your first queries
3. [Node.js Quick Start](/docs/getting-started/nodejs-setup) or [Python Quick Start](/docs/getting-started/python-setup) - Connect from an application driver
4. [Linux Packages Quick Start](/docs/getting-started/packages) or the [Package Finder](/packages) - Use this when you need a persistent Linux installation instead of Docker

If you prefer an editor-first workflow, start with the [Visual Studio Code Quick Start](/docs/getting-started/vscode-quickstart).
`;

const gettingStartedIndexVerificationContent = `## Verify your setup

Before moving on to application code, confirm that DocumentDB is reachable and you can run a simple query.

\`\`\`bash
docker ps --filter "name=documentdb"

mongosh localhost:10260 \\
  -u <YOUR_USERNAME> \\
  -p <YOUR_PASSWORD> \\
  --authenticationMechanism SCRAM-SHA-256 \\
  --tls \\
  --tlsAllowInvalidCertificates
\`\`\`

Then run:

\`\`\`javascript
db.runCommand({ ping: 1 })
\`\`\`

For a fuller walkthrough, use the [Mongo Shell Quick Start](/docs/getting-started/mongo-shell-quickstart). Driver-based examples are available in the [Node.js Quick Start](/docs/getting-started/nodejs-setup) and [Python Quick Start](/docs/getting-started/python-setup).
`;

const gettingStartedIndexTroubleshootingContent = `## Troubleshooting and debugging

If setup does not work on the first try:

- Confirm the container is running and port \`10260\` is published with \`docker ps\`.
- Inspect startup, authentication, and TLS errors with \`docker logs documentdb\`.
- If you want certificate validation instead of \`tlsAllowInvalidCertificates=true\`, follow the certificate steps in [DocumentDB Local](/docs/documentdb-local).
- For more verbose local diagnostics, restart DocumentDB Local with \`--log-level debug\`; the available runtime options are documented in [DocumentDB Local](/docs/documentdb-local).
- If you are installing on a host instead of Docker, use [Linux Packages Quick Start](/docs/getting-started/packages) or the [Package Finder](/packages) to get the correct apt or rpm flow.
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
    'Choose the fastest setup path for DocumentDB, verify your installation, and find troubleshooting and feature guides.',
  'getting-started/azure-setup':
    'Deploy and manage DocumentDB on Microsoft Azure for a fully managed experience.',
  'getting-started/vscode-quickstart':
    'Install the VS Code extension, connect to DocumentDB Local, and verify your first editor-based workflow.',
  'getting-started/nodejs-setup':
    'Start DocumentDB Local, connect with the MongoDB Node.js driver, and run your first queries.',
  'getting-started/python-setup':
    'Start DocumentDB Local, connect with PyMongo, and run your first queries from Python.',
  'getting-started/mongo-shell-quickstart':
    'Start DocumentDB Local, connect with mongosh, and run your first shell commands.',
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
      title: articleTitleOverrides['getting-started/docker'],
      link: '/docs/getting-started/docker',
    },
    {
      title: articleTitleOverrides['getting-started/packages'],
      link: '/docs/getting-started/packages',
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
  return loadYaml(fileContents) as Article;
}

export function getArticleNavigation(section: string): Link[] {
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

  return sections;
}

export function getAllArticlePaths(): { section: string; slug: string[] }[] {
  const sections = getAllSections();
  const paths: { section: string; slug: string[] }[] = [];

  sections.forEach(section => {
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
        description: 'Install the DocumentDB PostgreSQL extension with Linux packages and find package troubleshooting guidance.',
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
