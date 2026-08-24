# DocumentDB Package Installation

Repository-backed installation commands for DocumentDB.

## What is published

Starting with **v0.116-0**, DocumentDB ships a multi-package layout with a setup wizard and
systemd integration, instead of just a bare PostgreSQL extension package. Not every
distribution has caught up to it yet, so the repository currently serves two shapes:

| Distribution | Repository component | Packages available |
|---|---|---|
| Ubuntu 24.04 | `ubuntu24` | **Full stack** (v0.116-0): `documentdb` meta, `documentdb-N`, `documentdb-common`, `documentdb-gateway`, `documentdb-postgresql-tools`, plus the `postgresql-N-documentdb` extension |
| RHEL-compatible 9 | `rpm/rhel9` | **Full stack** (v0.116-0), same package set |
| Ubuntu 22.04, Debian 11/12/13, RHEL-compatible 8 | `ubuntu22`, `deb11`, `deb12`, `deb13`, `rpm/rhel8` | **Extension only** (v0.114-0): `postgresql-N-documentdb` |

- Both `amd64`/`x86_64` and `arm64`/`aarch64` variants are published.
- The full stack is published for PostgreSQL **17** and **18**. The extension package alone is
  additionally available for PostgreSQL **16** on every distribution.
- Debian 11 currently resolves PostgreSQL `16` and `17` only.

> On the extension-only distributions there is still no packaged gateway, setup helper, or
> systemd service. To get a MongoDB-compatible endpoint there, follow
> [Extension-only hosts](#extension-only-hosts-run-the-gateway-from-source) below.

## Supported PostgreSQL Versions

- Ubuntu 24.04, RHEL-compatible 9: 16, 17, 18 (full stack on 17 and 18)
- Ubuntu 22.04: 16, 17, 18 (extension only)
- Debian 11: 16, 17 (extension only)
- Debian 12 / 13: 16, 17, 18 (extension only)
- RHEL-compatible 8: 16, 17, 18 (extension only)

## Quickstart — Ubuntu 24.04 and RHEL 9

This is the recommended path. It installs the whole stack and brings up a working
wire-protocol endpoint.

> These commands assume a regular Linux host where you use `sudo`. In a clean container that
> already runs as `root`, omit `sudo`, and on Debian/Ubuntu also
> `export DEBIAN_FRONTEND=noninteractive` first, or `tzdata` will hang the install with an
> invisible prompt.

### Ubuntu 24.04 (Noble)

```bash
sudo apt update && \
sudo apt install -y curl ca-certificates gnupg && \
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql.gpg && \
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null && \
curl -fsSL https://documentdb.io/documentdb-archive-keyring.gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/documentdb-archive-keyring.gpg && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/documentdb-archive-keyring.gpg] https://documentdb.io/deb stable ubuntu24" | sudo tee /etc/apt/sources.list.d/documentdb.list >/dev/null && \
sudo apt update && \
sudo apt install -y documentdb
```

### RHEL-compatible 9

`crb` is disabled by default and is **required**: PostGIS pulls in `gdal*-libs`, which needs
`libqhull_r.so.7`, and that library ships only in CRB. Without it `dnf install` fails with a
wall of GDAL candidate lines that never name the missing repository.

```bash
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm && \
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-$(uname -m)/pgdg-redhat-repo-latest.noarch.rpm && \
sudo dnf -qy module disable postgresql && \
sudo dnf install -y dnf-plugins-core && \
(sudo dnf config-manager --set-enabled crb || \
 sudo dnf config-manager --set-enabled codeready-builder-for-rhel-9-$(uname -m)-rpms) && \
sudo rpm --import https://documentdb.io/documentdb-archive-keyring.gpg && \
printf '%s\n' \
  '[documentdb]' \
  'name=DocumentDB Repository' \
  'baseurl=https://documentdb.io/rpm/rhel9' \
  'enabled=1' \
  'gpgcheck=1' \
  'gpgkey=https://documentdb.io/documentdb-archive-keyring.gpg' | sudo tee /etc/yum.repos.d/documentdb.repo >/dev/null && \
sudo dnf install -y documentdb
```

### Then set up and connect

`documentdb-setup` **prompts for the admin password** interactively. For servers, CI or any
non-TTY context, pass it in instead with `--admin-password-file <file>` or
`--admin-password-stdin`, together with `--yes` — the bare command below will hang without a
terminal.

```bash
# Runs initdb / CREATE EXTENSION / admin bootstrap, starts the gateway, and enables
# documentdb-local@<major>.target so the stack survives reboot.
sudo documentdb-setup --admin-user admin

# Unattended equivalent:
#   printf '%s' "$ADMIN_PW" | sudo documentdb-setup --admin-user admin --admin-password-stdin --yes
```

`mongosh` is not shipped by these packages. Install it from the
[official instructions](https://www.mongodb.com/docs/mongodb-shell/install/), then:

```bash
mongosh 'mongodb://admin:<password>@127.0.0.1:10260/mydb?tls=true&tlsAllowInvalidCertificates=true' \
        --eval 'db.runCommand({ping: 1})'
```

A first database and collection are created on first write:

```javascript
db.orders.insertOne({ item: "widget", qty: 5 })
db.orders.find()
```

Other useful `documentdb-setup` flags: `--status`, `--print-config`, `--no-enable`.

### ⚠️ Before you expose this to a network

**The gateway listens on all interfaces (`0.0.0.0:10260` and `[::]:10260`) by default**, even
though the connect string above says `127.0.0.1`. On a cloud VM with an open security group,
the commands above stand up an internet-reachable endpoint protected only by the admin
password. The PostgreSQL instance behind it is *not* exposed — it stays on `127.0.0.1`.

Before using this anywhere but a private machine:

- **Restrict the listener** to loopback by setting `DOCUMENTDB_LISTEN_ADDR=127.0.0.1:10260`
  in `/etc/documentdb/local/<major>/gateway.env`, then restarting the service. (Only loopback
  hosts and the bare `:port` form are accepted; an arbitrary IP is rejected.) Otherwise
  firewall port `10260` yourself.
- **Replace the auto-generated self-signed certificate.** `tlsAllowInvalidCertificates=true`
  in the example disables certificate validation, so it gives you encryption without
  authenticating the server. Point `DOCUMENTDB_TLS_CERT_FILE` / `DOCUMENTDB_TLS_KEY_FILE` at a
  real certificate and drop that option.
- Use a strong admin password, and create per-application users rather than sharing `admin`.

### Verify and operate

```bash
sudo documentdb-setup --status      # gateway listener, service states, resolved paths
documentdb-gateway --version        # DocumentDB version (0.116.0)
dpkg -l | grep documentdb           # or: rpm -qa | grep documentdb
```

> Do not use `db.version()` / `buildInfo` in `mongosh` to check the DocumentDB version — those
> report the **emulated MongoDB wire version** (e.g. `7.0.0`), not DocumentDB's.

| Thing | Where |
|---|---|
| Gateway port | `10260` |
| PostgreSQL port | `9700 + <major>` (9718 for PG 18), loopback only |
| Gateway log | `/var/lib/documentdb-gateway/gateway.log` |
| PostgreSQL log | `/var/lib/documentdb-local/<major>/data/pglog.log` |
| Setup state / gateway env | `/etc/documentdb/local/<major>/setup.conf`, `.../gateway.env` |

**Day 2** (units are templated per PostgreSQL major — substitute `18` as needed):

```bash
sudo systemctl status  documentdb-local@18.target
sudo systemctl restart documentdb-local@18.target
sudo systemctl stop    documentdb-local@18.target
```

On hosts without systemd (containers, some dev images) the wizard starts the gateway directly
instead; re-run `documentdb-setup` to restart it.

**Remove or reset:**

```bash
sudo documentdb-setup --restore                              # detach the managed integration
sudo documentdb-local-reset --pg-version 18 --confirm-destroy # DESTROYS the data directory
sudo apt remove documentdb    # or: sudo dnf remove documentdb
```

### What the packages are

| Package | Role |
|---|---|
| `documentdb` (meta) + `documentdb-N` | Full stand-alone install; pins PostgreSQL major N + its extension and owns the systemd lifecycle. The meta package pins PG 18. |
| `postgresql-N-documentdb` | The extension for PostgreSQL major N (files only). |
| `documentdb-gateway` | Wire-protocol runtime (binary + systemd unit). |
| `documentdb-postgresql-tools` | Admin helpers: `documentdb-tune`, `documentdb-createcluster`, `documentdb-register-gateway`, `documentdb-gateway-admin`. |
| `documentdb-common` | Shared, PG-agnostic payload: `documentdb-setup`, systemd template units, sysusers.d/tmpfiles.d drop-ins, helper scripts, sample data. |

To install the extension by itself on these distributions, use `postgresql-18-documentdb`
(APT) or `postgresql18-documentdb` (RPM) instead of the `documentdb` meta package.

## Extension-only distributions

Ubuntu 22.04, Debian 11/12/13 and RHEL-compatible 8 currently serve the extension package
only. The commands below add the DocumentDB repository and install it.

### Ubuntu 22.04 (Jammy)

```bash
sudo apt update && \
sudo apt install -y curl ca-certificates gnupg && \
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql.gpg && \
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt jammy-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null && \
curl -fsSL https://documentdb.io/documentdb-archive-keyring.gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/documentdb-archive-keyring.gpg && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/documentdb-archive-keyring.gpg] https://documentdb.io/deb stable ubuntu22" | sudo tee /etc/apt/sources.list.d/documentdb.list >/dev/null && \
sudo apt update && \
sudo apt install -y postgresql-16-documentdb
```

### Debian 11 (Bullseye)

```bash
sudo apt update && \
sudo apt install -y curl ca-certificates gnupg && \
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql.gpg && \
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt bullseye-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null && \
curl -fsSL https://documentdb.io/documentdb-archive-keyring.gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/documentdb-archive-keyring.gpg && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/documentdb-archive-keyring.gpg] https://documentdb.io/deb stable deb11" | sudo tee /etc/apt/sources.list.d/documentdb.list >/dev/null && \
sudo apt update && \
sudo apt install -y postgresql-16-documentdb
```

### Debian 12 (Bookworm)

```bash
sudo apt update && \
sudo apt install -y curl ca-certificates gnupg && \
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql.gpg && \
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null && \
curl -fsSL https://documentdb.io/documentdb-archive-keyring.gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/documentdb-archive-keyring.gpg && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/documentdb-archive-keyring.gpg] https://documentdb.io/deb stable deb12" | sudo tee /etc/apt/sources.list.d/documentdb.list >/dev/null && \
sudo apt update && \
sudo apt install -y postgresql-16-documentdb
```

### Debian 13 (Trixie)

```bash
sudo apt update && \
sudo apt install -y curl ca-certificates gnupg && \
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql.gpg && \
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt trixie-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null && \
curl -fsSL https://documentdb.io/documentdb-archive-keyring.gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/documentdb-archive-keyring.gpg && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/documentdb-archive-keyring.gpg] https://documentdb.io/deb stable deb13" | sudo tee /etc/apt/sources.list.d/documentdb.list >/dev/null && \
sudo apt update && \
sudo apt install -y postgresql-16-documentdb
```

### RHEL-compatible 8

```bash
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm && \
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-$(uname -m)/pgdg-redhat-repo-latest.noarch.rpm && \
sudo dnf -qy module disable postgresql && \
sudo dnf install -y dnf-plugins-core && \
(sudo dnf config-manager --set-enabled powertools || \
 sudo dnf config-manager --set-enabled crb || \
 sudo dnf config-manager --set-enabled codeready-builder-for-rhel-8-$(uname -m)-rpms) && \
sudo rpm --import https://documentdb.io/documentdb-archive-keyring.gpg && \
printf '%s\n' \
  '[documentdb]' \
  'name=DocumentDB Repository' \
  'baseurl=https://documentdb.io/rpm/rhel8' \
  'enabled=1' \
  'gpgcheck=1' \
  'gpgkey=https://documentdb.io/documentdb-archive-keyring.gpg' | sudo tee /etc/yum.repos.d/documentdb.repo >/dev/null && \
sudo dnf install -y postgresql16-documentdb
```

## Installing a different PostgreSQL major

Swap the package name at the end of the command:

- APT: `postgresql-17-documentdb` or `postgresql-18-documentdb`
- RPM: `postgresql17-documentdb` or `postgresql18-documentdb`

> Debian 11 currently supports PostgreSQL `16` and `17` in the repository-backed install flow.
> PostgreSQL `18` on Debian 11 is blocked by the missing `postgresql-18-postgis-3` dependency
> in the upstream Bullseye packages.

## Upgrading an existing install

The package repository serves the newest build for each distribution, so once v0.116-0 is
published a host already running v0.114-0 will see it as an available upgrade.

**A package upgrade only replaces files on disk.** It does not touch the SQL objects already
created in your databases, so after upgrading you must update the extensions in **every
database** that has DocumentDB installed:

```sql
ALTER EXTENSION documentdb_core UPDATE;
ALTER EXTENSION documentdb UPDATE;
ALTER EXTENSION documentdb_extended_rum UPDATE;  -- only if it is installed
```

PostgreSQL applies the intermediate upgrade scripts automatically, so 0.114-0 → 0.116-0 is
applied as 0.114-0 → 0.115-0 → 0.116-0 in one step. Confirm afterwards with:

```sql
SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'documentdb%';
```

> **Pre-GA:** in-place upgrades are not yet a supported, fully tested path. Take a backup
> first, and prefer a clean install where you can. If you would rather not be offered the
> upgrade at all, pin the current version:
>
> ```bash
> sudo apt-mark hold postgresql-18-documentdb            # APT
> sudo dnf install -y python3-dnf-plugin-versionlock && \
>   sudo dnf versionlock add postgresql18-documentdb      # DNF
> ```

## Version pinning

Run the repository setup for your distro first, then:

### APT

```bash
apt-cache madison postgresql-16-documentdb
sudo apt install postgresql-16-documentdb=<VERSION>
```

### RPM

```bash
dnf --showduplicates list postgresql16-documentdb
sudo dnf install postgresql16-documentdb-<VERSION>
```

## Extension-only hosts: run the gateway from source

On Ubuntu 24.04 and RHEL 9, use `documentdb-setup` from the packaged stack above instead —
this section is only for distributions where the gateway is not packaged yet.

The repository-backed install there gives you the PostgreSQL extension package. To expose a
local MongoDB-compatible endpoint on the same host, run PostgreSQL and the gateway from the
source repository against the packaged extension files.

### Prerequisites

- `git`
- `curl`
- Native build tools for Rust crates that link against OpenSSL
- A current Rust toolchain via `rustup`
- `mongosh`

> Run the PostgreSQL and gateway steps from an unprivileged user account, not `root`.
> PostgreSQL will not initialize as `root`.
>
> If you are following these steps in a clean container that starts as `root`, finish the
> package-install commands as `root`, then switch to an unprivileged account such as
> `postgres` before you start PostgreSQL or the gateway.

```bash
# from a root shell inside the container
su - postgres
```

Example package-manager installs:

```bash
# Debian / Ubuntu
sudo apt install -y git curl build-essential pkg-config libssl-dev

# RHEL-compatible
sudo dnf install -y git curl gcc gcc-c++ make pkgconf-pkg-config openssl-devel
```

Install a current Rust toolchain with `rustup`, then load it into your shell:

```bash
curl https://sh.rustup.rs -sSf | sh -s -- -y
. "$HOME/.cargo/env"
```

In a clean container that starts as `root`, install the system packages above and install
`mongosh` while you are still `root`. Then switch to the unprivileged user and run the
`rustup` commands plus the remaining gateway steps from that user's shell.

### Example host flow

Replace `<PG_MAJOR>` with the PostgreSQL major version you installed from the package
repository, such as `16`, `17`, or `18`.

If you do not already have `mongosh`, install it with the official MongoDB shell instructions
for your distro before continuing:

- https://www.mongodb.com/docs/mongodb-shell/install/

```bash
git clone https://github.com/documentdb/documentdb.git
cd documentdb

export PG_VERSION_USED=<PG_MAJOR>

# Required in non-interactive shells (CI, `docker exec` without `-t`,
# `docker exec -d`, `nohup`, background `&`). build_and_start_gateway.sh
# calls `tput` for colored output and aborts under `set -u` / `set -e` if
# TERM is unset or set to `dumb`. Skip this line in a normal interactive
# terminal where TERM is already `xterm`, `xterm-256color`, etc.
export TERM=xterm

./scripts/start_oss_server.sh -c -u <YOUR_USERNAME> -a <YOUR_PASSWORD>

./scripts/build_and_start_gateway.sh -c \
  -u <YOUR_USERNAME> \
  -p <YOUR_PASSWORD> \
  -P 9712
```

- `./scripts/start_oss_server.sh -c` initializes a fresh local PostgreSQL data directory under `~/.documentdb/data`.
- `./scripts/build_and_start_gateway.sh -c` forces a clean gateway rebuild; after the first successful build, you can omit `-c` on later restarts.
- Keep the gateway command running in the foreground. It listens on port `10260` and connects to PostgreSQL on port `9712`.
- The first gateway build downloads several hundred Rust crates and typically takes a few minutes before the gateway begins listening on port `10260`. Subsequent runs without `-c` are much faster.

Then connect with `mongosh`:

```bash
mongosh localhost:10260 \
  -u <YOUR_USERNAME> \
  -p <YOUR_PASSWORD> \
  --authenticationMechanism SCRAM-SHA-256 \
  --tls \
  --tlsAllowInvalidCertificates
```

## Direct downloads

GitHub Releases contains the `.deb` and `.rpm` assets for every published combination. Note
that a release only carries the distributions in its own build matrix — v0.116-0 ships
Ubuntu 24.04 and RHEL 9 — while the package repository additionally keeps the most recent
package for every other distribution, so nothing disappears when a release narrows its matrix.

Examples:

```text
ubuntu24.04-documentdb_0.116.0_all.deb
ubuntu24.04-postgresql-18-documentdb_0.116-0_amd64.deb
rhel9-postgresql18-documentdb-0.116.0-1.el9.x86_64.rpm
deb13-postgresql-18-documentdb_0.114-0_amd64.deb
```

Because the packages depend on each other, installing a downloaded meta package on its own
fails with `Depends: documentdb-18 ... but it is not installable`. Pass the whole set to a
single command, or just use the repository-backed install above.

- GitHub Releases: https://github.com/documentdb/documentdb/releases
- Release metadata: https://documentdb.io/packages/release-info.json

## Notes

- The APT repository publishes components for `ubuntu22`, `ubuntu24`, `deb11`, `deb12`, and `deb13`; the RPM repositories are `rhel8` and `rhel9`.
- Debian 11 PostgreSQL 18 assets exist, but the upstream Bullseye PostGIS dependency is not currently installable from PGDG.
- The RPM flow depends on EPEL plus PostgreSQL's upstream RPM repository because DocumentDB depends on PostgreSQL, `pg_cron`, `pgvector`, PostGIS, and `rum` for PostgreSQL 16/17.
- On Debian/Ubuntu, the distro-packaged `cargo` can be older than the current gateway workspace lockfile. `rustup` avoids that mismatch.

