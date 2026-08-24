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
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>
\`\`\`

> Replace \`<YOUR_USERNAME>\` and \`<YOUR_PASSWORD>\` with your own credentials.
>
> DocumentDB Local loads built-in sample data into \`sampledb\` by default. See
> [DocumentDB Local](/docs/documentdb-local) for \`--skip-init-data\`,
> \`--init-data-path\`, certificate setup, and additional runtime options.

## Verify the container

\`\`\`bash
docker ps --filter "name=documentdb"
\`\`\`

You should see the container in an \`Up\` state with port \`10260\` published.

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

Then run a quick health check and inspect the built-in sample data:

\`\`\`javascript
db.runCommand({ ping: 1 })

use sampledb

db.users.find({}, { name: 1, email: 1, _id: 0 }).limit(3)
\`\`\`

If you prefer certificate validation instead of \`--tlsAllowInvalidCertificates\`, follow the certificate steps in [DocumentDB Local](/docs/documentdb-local).

## Persistence and initialization

The quick start command above is ideal for disposable local environments. When you need more control:

- Use \`--data-path\` with a mounted host directory to keep data across container restarts
- Use \`--skip-init-data\` if you want an empty instance instead of the default \`sampledb\` collections
- Use \`--init-data-path\` to run your own \`.js\` initialization scripts with \`mongosh\` at startup

The built-in sample dataset includes \`users\`, \`products\`, \`orders\`, and \`analytics\` collections in \`sampledb\`.

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

## What you get

Since v0.116-0 DocumentDB ships as a set of packages rather than a lone extension:

| Package | Role |
| --- | --- |
| \`documentdb\` (meta) + \`documentdb-N\` | Full stand-alone install. Pins PostgreSQL major N and owns the systemd lifecycle. |
| \`postgresql-N-documentdb\` | The PostgreSQL extension itself (files only). |
| \`documentdb-gateway\` | Wire-protocol runtime serving the MongoDB-compatible endpoint. |
| \`documentdb-postgresql-tools\` | Admin helpers: \`documentdb-tune\`, \`documentdb-createcluster\`, \`documentdb-register-gateway\`, \`documentdb-gateway-admin\`. |
| \`documentdb-common\` | Shared payload: \`documentdb-setup\`, the systemd units, helper scripts, sample data. |

The full set is published for **Ubuntu 24.04** and **RHEL-compatible 9** on PostgreSQL 17 and 18. Ubuntu 22.04, Debian 11/12/13 and RHEL-compatible 8 still resolve the **extension package only** — for those, see [Extension-only hosts](#extension-only-hosts) below.

## Choose the right package command

Use the [Package Finder](/packages) to generate the exact install command for your distro, architecture, and PostgreSQL version.

> The package commands assume a regular Linux host where you use \`sudo\`. In a clean container running as \`root\`, omit \`sudo\`.
>
> On Debian and Ubuntu in a clean container, also run \`export DEBIAN_FRONTEND=noninteractive\` first. Without it, \`tzdata\` prompts for input during \`apt install\` and the install hangs with no visible error.

## Install the packages

### APT example (Ubuntu 24.04, PostgreSQL 18)

\`\`\`bash
${buildAptInstallCommand('ubuntu24', 'amd64', '18')}
\`\`\`

### RPM example (RHEL-compatible 9, PostgreSQL 18)

\`\`\`bash
${buildRpmInstallCommand('rhel9', 'x86_64', '18')}
\`\`\`

## Set up and connect

Installing the packages puts files on disk; it does not create a database or start the endpoint. The setup wizard does that:

\`\`\`bash
sudo documentdb-setup --admin-user admin
\`\`\`

It creates the PostgreSQL instance, installs the extensions, bootstraps the admin user, starts the gateway, and enables \`documentdb-local@<major>.target\` so the stack survives reboot. It **prompts for the admin password**; for servers and CI pass \`--admin-password-file <file>\` or \`--admin-password-stdin\` together with \`--yes\`.

\`mongosh\` is not shipped by these packages — install it from the [official instructions](https://www.mongodb.com/docs/mongodb-shell/install/), then:

\`\`\`bash
mongosh 'mongodb://admin:<PASSWORD>@127.0.0.1:10260/mydb?tls=true&tlsAllowInvalidCertificates=true' \\
        --eval 'db.runCommand({ping: 1})'
\`\`\`

If the password contains \`@\`, \`:\`, \`/\` or other reserved characters it must be percent-encoded in the URI (\`@\` becomes \`%40\`), otherwise the URI misparses. To avoid encoding entirely, pass the credentials as flags instead:

\`\`\`bash
mongosh localhost:10260 -u admin -p --authenticationMechanism SCRAM-SHA-256 \\
        --tls --tlsAllowInvalidCertificates --eval 'db.runCommand({ping: 1})'
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

On hosts without systemd the wizard starts the gateway directly; re-run \`documentdb-setup\` to restart it.

Remove or reset:

\`\`\`bash
# Stop the stack first — package removal deletes files but does not stop a
# running gateway. On systemd hosts:
sudo systemctl stop documentdb-local@18.target
# Without systemd the wizard started the gateway directly; kill that process.

sudo documentdb-setup --restore                               # detach the managed integration
sudo documentdb-local-reset --pg-version 18 --confirm-destroy  # DESTROYS the data directory

# Name the package you installed AND the extension: autoremove does not reap
# postgresql-18-documentdb, and \`remove\` would leave config behind.
sudo apt purge --autoremove documentdb-18 postgresql-18-documentdb
sudo dnf remove documentdb-18 postgresql18-documentdb && sudo dnf autoremove
\`\`\`

(If you installed the \`documentdb\` meta package rather than \`documentdb-18\`, name that instead.)

## Upgrading

A package upgrade only replaces files. Afterwards, update the extensions in every database that has DocumentDB installed:

\`\`\`sql
ALTER EXTENSION documentdb_core UPDATE;
ALTER EXTENSION documentdb UPDATE;
ALTER EXTENSION documentdb_extended_rum UPDATE;  -- only if installed
\`\`\`

PostgreSQL applies intermediate upgrade scripts automatically. In-place upgrades are not yet a fully tested path, so take a backup first.

## Extension-only hosts

Ubuntu 22.04, Debian 11/12/13 and RHEL-compatible 8 currently serve the extension package alone — no gateway, setup helper, or systemd units. On those hosts the install command ends in \`postgresql-<PG>-documentdb\` (APT) or \`postgresql<PG>-documentdb\` (RPM), and there is no \`documentdb-setup\`.

Confirm the extension landed with package metadata:

\`\`\`bash
# APT
apt-cache policy postgresql-18-documentdb
dpkg -L postgresql-18-documentdb | grep -E 'documentdb.*\\.(control|sql|so)$' | head

# RPM
dnf info postgresql18-documentdb
rpm -ql postgresql18-documentdb | grep -E 'documentdb.*\\.(control|sql|so)$' | head
\`\`\`

For the fastest gateway-backed endpoint on those hosts, use the Docker quick start:

\`\`\`bash
docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>
\`\`\`

Otherwise, run the gateway from the source repository against your host PostgreSQL, as described below.

## Turn an extension-only install into a local \`mongosh\` endpoint

On Ubuntu 24.04 and RHEL 9 use \`documentdb-setup\` above instead — this section is only for distributions where the gateway is not packaged yet.

If you want to keep PostgreSQL on the host and still connect with \`mongosh\`, install the extension package first and then run the gateway from the source repository against that PostgreSQL instance.

### Prerequisites for the host gateway step

- [Git](https://git-scm.com/)
- \`curl\`
- Native build tools for Rust crates that link against OpenSSL
- A current Rust toolchain via \`rustup\`
- [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/)

Run the PostgreSQL and gateway steps from an unprivileged user account, not \`root\`. PostgreSQL will not initialize as \`root\`.

If you are following these steps in a clean container that starts as \`root\`, finish the package-install commands as \`root\`, then switch to an unprivileged account such as \`postgres\` before you start PostgreSQL or the gateway.

\`\`\`bash
# from a root shell inside the container
su - postgres
\`\`\`

Install the host prerequisites with your distro package manager before continuing. Examples:

\`\`\`bash
# Debian / Ubuntu
sudo apt install -y git curl build-essential pkg-config libssl-dev

# RHEL-compatible
sudo dnf install -y git curl gcc gcc-c++ make pkgconf-pkg-config openssl-devel
\`\`\`

Install a current Rust toolchain with \`rustup\`, then load it into your shell:

\`\`\`bash
curl https://sh.rustup.rs -sSf | sh -s -- -y
. "$HOME/.cargo/env"
\`\`\`

In a clean container that starts as \`root\`, install the system packages above and install \`mongosh\` while you are still \`root\`. Then switch to the unprivileged user and run the \`rustup\` commands plus the remaining gateway steps from that user's shell.

### Host setup example

Replace \`<PG_MAJOR>\` with the PostgreSQL major version you installed from the package repository, such as \`16\`, \`17\`, or \`18\`.

If you do not already have \`mongosh\`, install it with the official MongoDB shell instructions for your distro before continuing:

- https://www.mongodb.com/docs/mongodb-shell/install/

\`\`\`bash
git clone https://github.com/documentdb/documentdb.git
cd documentdb

export PG_VERSION_USED=<PG_MAJOR>

# Required in non-interactive shells (CI, \`docker exec\` without \`-t\`,
# \`docker exec -d\`, \`nohup\`, background \`&\`). build_and_start_gateway.sh
# calls \`tput\` for colored output and aborts under \`set -u\` / \`set -e\` if
# TERM is unset or set to \`dumb\`. Skip this line in a normal interactive
# terminal where TERM is already \`xterm\`, \`xterm-256color\`, etc.
export TERM=xterm

./scripts/start_oss_server.sh -c -u <YOUR_USERNAME> -a <YOUR_PASSWORD>

./scripts/build_and_start_gateway.sh -c \\
  -u <YOUR_USERNAME> \\
  -p <YOUR_PASSWORD> \\
  -P 9712
\`\`\`

\`./scripts/start_oss_server.sh -c\` initializes a fresh local PostgreSQL data directory under \`~/.documentdb/data\`. \`./scripts/build_and_start_gateway.sh -c\` forces a clean gateway rebuild; after the first successful build, you can omit \`-c\` on later restarts.

The first gateway build downloads several hundred Rust crates and typically takes a few minutes on a fresh machine before the gateway begins listening on port \`10260\`. Subsequent runs without \`-c\` are much faster.

Keep the gateway command running in the foreground. It starts the MongoDB-compatible endpoint on port \`10260\` and connects it to PostgreSQL on port \`9712\`.

Then connect with \`mongosh\`:

\`\`\`bash
mongosh localhost:10260 \\
  -u <YOUR_USERNAME> \\
  -p <YOUR_PASSWORD> \\
  --authenticationMechanism SCRAM-SHA-256 \\
  --tls \\
  --tlsAllowInvalidCertificates
\`\`\`

Use this flow when you want a package-backed host install plus a local MongoDB-compatible endpoint. Use the Docker quick start instead when you want the shortest local setup path.

## Troubleshooting and debugging

If something does not work on the first try:

- Confirm the packages are installed: \`documentdb-<PG>\` on a full-stack target, or \`postgresql-<PG>-documentdb\` (APT) / \`postgresql<PG>-documentdb\` (RPM) on an extension-only target
- On a full-stack target, run \`sudo documentdb-setup --status\` first: it reports the gateway listener, the service states and the resolved paths
- Re-run the Package Finder command for the exact distro, architecture, and PostgreSQL version you selected
- Confirm the PostgreSQL upstream repository was added before the DocumentDB package install
- If you are running in a clean container as \`root\`, omit \`sudo\` from the package-install commands and switch to an unprivileged user before the gateway steps
- If \`apt install\` hangs forever in a clean container, run \`export DEBIAN_FRONTEND=noninteractive\` in that shell and re-run the install; the default front-end is waiting for a \`tzdata\` prompt that never gets typed
- If you use the host gateway flow, confirm \`PG_VERSION_USED\` matches the PostgreSQL major version you installed
- If \`./scripts/build_and_start_gateway.sh\` exits immediately with \`tput: No value for $TERM\` (or silently with \`set -e\` when \`TERM=dumb\`), set \`export TERM=xterm\` before re-running, or run the script from an interactive shell (for Docker, \`docker exec -it ...\`)
- If \`./scripts/build_and_start_gateway.sh\` fails, confirm \`git\`, \`curl\`, native build tools, \`pkg-config\`, OpenSSL headers, and a current Rust toolchain are installed on the host
- If the gateway build fails while reading \`Cargo.lock\`, switch to a current Rust toolchain from \`rustup\` instead of the distro-packaged \`cargo\`
- If \`mongosh\` cannot connect, confirm the gateway script is still running and listening on port \`10260\`
- For Debian 11, use PostgreSQL 16 or 17; PostgreSQL 18 is blocked by the upstream Bullseye PostGIS dependency
- If you need a gateway endpoint on an extension-only distribution, use DocumentDB Local with Docker or build and run the gateway from source

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
docker cp documentdb:/home/documentdb/gateway/pg_documentdb_gw/cert.pem ~/documentdb-cert.pem
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
    {"_id": 0, "name": 1, "email": 1},
).limit(3):
    print(user)
\`\`\`

## Use a trusted local certificate instead

If you want certificate validation instead of \`tlsAllowInvalidCertificates=true\`, copy the generated certificate from the container and pass it to \`MongoClient\`.

\`\`\`bash
docker cp documentdb:/home/documentdb/gateway/pg_documentdb_gw/cert.pem ~/documentdb-cert.pem
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
> DocumentDB Local loads built-in sample data into \`sampledb\` by default. It also uses a self-signed certificate by default, so the fastest local \`mongosh\` connection adds \`--tlsAllowInvalidCertificates\`.

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

DocumentDB Local loads sample collections into \`sampledb\` by default.

\`\`\`javascript
use sampledb

db.users.find(
  {},
  { name: 1, email: 1, _id: 0 }
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
docker cp documentdb:/home/documentdb/gateway/pg_documentdb_gw/cert.pem ~/documentdb-cert.pem

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

const documentdbLocalDataInitializationContent = `## Data initialization

DocumentDB Local starts with built-in sample data by default. The container creates a
\`sampledb\` database with the \`users\`, \`products\`, \`orders\`, and \`analytics\`
collections so you can explore queries right away.

### Control initialization behavior

| Requirement | Arg | Env | Default | Description |
|---|---|---|---|---|
| Skip built-in sample data | \`--skip-init-data\` | \`SKIP_INIT_DATA\` | \`false\` | Start without loading the default sample collections. |
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
