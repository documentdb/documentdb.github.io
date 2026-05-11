# DocumentDB Package Installation

Repository-backed installation commands for the DocumentDB PostgreSQL extension package.

## What is published

- Repository-backed extension packages are published for Ubuntu 22.04, Ubuntu 24.04, Debian 11, Debian 12, Debian 13, RHEL-compatible 8, and RHEL-compatible 9 targets.
- Both `amd64`/`x86_64` and `arm64`/`aarch64` variants are published.
- PostgreSQL package variants `16`, `17`, and `18` are published for the supported repository-backed combinations, with one exception: Debian 11 currently resolves PostgreSQL `16` and `17` only.
- Debian 13 `.deb` assets are published on GitHub Releases, and the APT repository now publishes a `deb13` component for repository-backed installs.
- The published package repository installs the PostgreSQL extension package. It does not currently publish a gateway package, setup helper, or systemd service in either the repository-backed install flow or GitHub Releases.

## Supported PostgreSQL Versions

- Ubuntu 22.04 / 24.04: 16, 17, 18
- Debian 11: 16, 17
- Debian 12: 16, 17, 18
- Debian 13: 16, 17, 18
- RHEL-compatible 8 / 9: 16, 17, 18

## Repository-backed package installs

These commands install the required PostgreSQL upstream repositories first, then add the DocumentDB package repository, and finally install the DocumentDB PostgreSQL extension package.

> These commands assume a regular Linux host where you use `sudo`. If you are testing in a clean container that already runs as `root`, omit `sudo` from the package-install commands.
>
> On Debian and Ubuntu in a clean container, also run `export DEBIAN_FRONTEND=noninteractive` in the shell before the APT commands. Without it, `tzdata` (and a few other packages) prompt for input during `apt install` and the install hangs with no visible error.

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

### Ubuntu 24.04 (Noble)

```bash
sudo apt update && \
sudo apt install -y curl ca-certificates gnupg && \
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql.gpg && \
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null && \
curl -fsSL https://documentdb.io/documentdb-archive-keyring.gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/documentdb-archive-keyring.gpg && \
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/documentdb-archive-keyring.gpg] https://documentdb.io/deb stable ubuntu24" | sudo tee /etc/apt/sources.list.d/documentdb.list >/dev/null && \
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
(sudo dnf config-manager --set-enabled crb || \
 sudo dnf config-manager --set-enabled powertools || \
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

### RHEL-compatible 9

```bash
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm && \
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-$(uname -m)/pgdg-redhat-repo-latest.noarch.rpm && \
sudo dnf -qy module disable postgresql && \
sudo dnf install -y dnf-plugins-core && \
(sudo dnf config-manager --set-enabled crb || \
 sudo dnf config-manager --set-enabled powertools || \
 sudo dnf config-manager --set-enabled codeready-builder-for-rhel-9-$(uname -m)-rpms) && \
sudo rpm --import https://documentdb.io/documentdb-archive-keyring.gpg && \
printf '%s\n' \
  '[documentdb]' \
  'name=DocumentDB Repository' \
  'baseurl=https://documentdb.io/rpm/rhel9' \
  'enabled=1' \
  'gpgcheck=1' \
  'gpgkey=https://documentdb.io/documentdb-archive-keyring.gpg' | sudo tee /etc/yum.repos.d/documentdb.repo >/dev/null && \
sudo dnf install -y postgresql16-documentdb
```

## Installing PostgreSQL 17 or 18 instead

Swap the package name at the end of the command:

- APT: `postgresql-17-documentdb` or `postgresql-18-documentdb`
- RPM: `postgresql17-documentdb` or `postgresql18-documentdb`

> Debian 11 currently supports PostgreSQL `16` and `17` in the repository-backed install flow. PostgreSQL `18` on Debian 11 is blocked by the missing `postgresql-18-postgis-3` dependency in the upstream Bullseye packages.

## Version pinning

Run the repository setup for your distro first, then use these commands:

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

## From package install to a local `mongosh` endpoint

The repository-backed install gives you the PostgreSQL extension package. To expose a local MongoDB-compatible endpoint on the same host, run PostgreSQL and the gateway from the source repository against the packaged extension files.

### Prerequisites

- `git`
- `curl`
- Native build tools for Rust crates that link against OpenSSL
- A current Rust toolchain via `rustup`
- `mongosh`

> Run the PostgreSQL and gateway steps from an unprivileged user account, not `root`. PostgreSQL will not initialize as `root`.
>
> If you are following these steps in a clean container that starts as `root`, finish the package-install commands as `root`, then switch to an unprivileged account such as `postgres` before you start PostgreSQL or the gateway.

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

In a clean container that starts as `root`, install the system packages above and install `mongosh` while you are still `root`. Then switch to the unprivileged user and run the `rustup` commands plus the remaining gateway steps from that user's shell.

### Example host flow

Replace `<PG_MAJOR>` with the PostgreSQL major version you installed from the package repository, such as `16`, `17`, or `18`.

If you do not already have `mongosh`, install it with the official MongoDB shell instructions for your distro before continuing:

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

GitHub Releases contains `.deb` and `.rpm` extension assets for every published combination, including Debian 13 release assets. It does not currently publish a gateway package.

Examples:

```text
ubuntu22.04-postgresql-18-documentdb_0.111-0_amd64.deb
deb13-postgresql-18-documentdb_0.111-0_amd64.deb
rhel9-postgresql18-documentdb-0.111.0-1.el9.x86_64.rpm
```

- GitHub Releases: https://github.com/documentdb/documentdb/releases
- Release metadata: https://documentdb.io/packages/release-info.json

## Notes

- The APT repository currently publishes components for `ubuntu22`, `ubuntu24`, `deb11`, `deb12`, and `deb13`.
- Debian 11 PostgreSQL 18 assets exist, but the upstream Bullseye PostGIS dependency is not currently installable from PGDG.
- The RPM flow depends on EPEL plus PostgreSQL's upstream RPM repository because DocumentDB depends on PostgreSQL, `pg_cron`, `pgvector`, PostGIS, and `rum` for PostgreSQL 16/17.
- On Debian/Ubuntu, the distro-packaged `cargo` can be older than the current gateway workspace lockfile. `rustup` avoids that mismatch.
