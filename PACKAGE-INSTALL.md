# DocumentDB Package Installation

Repository-backed installation commands for DocumentDB.

## What is published

Starting with **v0.116-0**, DocumentDB ships a multi-package layout with a setup wizard and
systemd integration, instead of just a bare PostgreSQL extension package. The website mirrors
the package assets attached to one official release; it does not combine the current release
with stale packages from older releases. This deliberately reduces the hosted package matrix
compared with earlier releases so every advertised combination corresponds to the current,
first-party-built release.

| Distribution | Repository component | Packages available |
|---|---|---|
| Ubuntu 24.04 | `ubuntu24` | **Full stack**: `documentdb` meta, `documentdb-N`, `documentdb-common`, `documentdb-gateway`, `documentdb-postgresql-tools`, plus the `postgresql-N-documentdb` extension |
| Rocky Linux / AlmaLinux / CentOS Stream 9 | `rpm/rhel9` | **Full stack**, same package set |
| Registered Red Hat Enterprise Linux 9 | `rpm/rhel9` | **Full stack**, same package set; uses `subscription-manager` for CodeReady Builder |

- Both `amd64`/`x86_64` and `arm64`/`aarch64` variants are published.
- The full stack is published for PostgreSQL **17** and **18**.
- Other accepted build-script combinations (PostgreSQL 15/16; Debian 11/12/13;
  Ubuntu 22.04; RHEL-compatible 8) are build-on-demand targets in the source repository.
  They are not part of the current official release and are not served by documentdb.io.

### Targets retired from the hosted repository

Starting with v0.116, documentdb.io no longer publishes packages for Ubuntu 22.04,
Debian 11/12/13, RHEL-compatible 8, or PostgreSQL 16. This includes the older PG16
extension packages previously present in the `ubuntu24` and `rpm/rhel9` repositories.

Existing installations keep running, but receive no package updates and cannot reinstall
those packages from documentdb.io. Empty signed metadata remains at the retired APT
components and RPM repository URLs so package-manager refreshes do not break unrelated
operations.

Remove the repository configuration on a host that will not move to the current matrix:

```bash
# Debian / Ubuntu
sudo rm -f /etc/apt/sources.list.d/documentdb.list
sudo apt update

# RHEL-compatible
sudo rm -f /etc/yum.repos.d/documentdb.repo
sudo dnf clean all
```

To remain on an older target, use the matching GitHub release assets or build from that
release tag. Those paths are not part of the current hosted support matrix.

## Supported PostgreSQL Versions

- Ubuntu 24.04: PostgreSQL 17 and 18
- EL9 (Rocky Linux, AlmaLinux, CentOS Stream, and registered RHEL): PostgreSQL 17 and 18

## Quickstart — Ubuntu 24.04 and EL9

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

### Rocky Linux, AlmaLinux, or CentOS Stream 9

`crb` is disabled by default and is **required**: PostGIS pulls in `gdal*-libs`, which needs
`libqhull_r.so.7`, and that library ships only in CRB. Without it `dnf install` fails with a
wall of GDAL candidate lines that never name the missing repository.

```bash
sudo dnf install -y dnf-plugins-core && \
sudo dnf config-manager --set-enabled crb && \
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm && \
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-$(uname -m)/pgdg-redhat-repo-latest.noarch.rpm && \
sudo dnf -qy module disable postgresql && \
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

### Registered Red Hat Enterprise Linux 9

This requires an active Red Hat subscription. RHEL exposes CodeReady Builder through
`subscription-manager`; it does not provide the `crb` repository ID used above.

```bash
sudo subscription-manager repos --enable codeready-builder-for-rhel-9-$(uname -m)-rpms && \
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm && \
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-$(uname -m)/pgdg-redhat-repo-latest.noarch.rpm && \
sudo dnf -qy module disable postgresql && \
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
`--admin-password-stdin`, together with `--yes`; without a password source the command exits.

```bash
# Runs initdb / CREATE EXTENSION / admin bootstrap, starts the gateway, and enables
# documentdb-local@18.target so the stack survives reboot.
sudo documentdb-setup --pg-version 18 --use-new-postgres-instance --admin-user admin

# Unattended equivalent:
#   printf '%s' "$ADMIN_PW" | sudo documentdb-setup --pg-version 18 \
#     --use-new-postgres-instance --admin-user admin --admin-password-stdin --yes
```

The explicit major and fresh-instance flags prevent another installed PostgreSQL major or an
existing system cluster from being selected accidentally. To adopt an existing PostgreSQL
instance instead, use [Adopt an existing PostgreSQL instance](#adopt-an-existing-postgresql-instance).

`mongosh` is not shipped by these packages. Install it from the
[official instructions](https://www.mongodb.com/docs/mongodb-shell/install/), then:

```bash
mongosh 'mongodb://admin:<password>@127.0.0.1:10260/mydb?tls=true&tlsAllowInvalidCertificates=true' \
        --eval 'db.runCommand({ping: 1})'
```

If the password contains `@`, `:`, `/` or other reserved characters it must be percent-encoded
in the URI (`@` becomes `%40`). To avoid encoding entirely, pass the credentials as flags:

```bash
mongosh localhost:10260 -u admin -p --authenticationMechanism SCRAM-SHA-256 \
        --tls --tlsAllowInvalidCertificates --eval 'db.runCommand({ping: 1})'
```

A first database and collection are created on first write:

```javascript
db.orders.insertOne({ item: "widget", qty: 5 })
db.orders.find()
```

Other useful `documentdb-setup` flags: `--status`, `--print-config`, `--no-enable`.

### Before you expose this to a network

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
  authenticating the server. Set all three values in
  `/etc/documentdb/local/<major>/gateway.env`:

  ```ini
  DOCUMENTDB_TLS_AUTO_GENERATE=false
  DOCUMENTDB_TLS_CERT_FILE=/etc/documentdb/tls/server.crt
  DOCUMENTDB_TLS_KEY_FILE=/etc/documentdb/tls/server.key
  ```

  The gateway runs as `documentdb-gateway`. Every parent directory must be traversable by that
  account; keep the private key restricted but readable, for example
  `root:documentdb-gateway` with mode `0640`. Restart the gateway service and verify it is
  active before removing `tlsAllowInvalidCertificates=true` from clients.
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
instead; the `systemctl` commands above fail with *"System has not been booted with systemd"*.
Use `documentdb-setup --status` to inspect it and re-run `documentdb-setup` to restart it.

### Adopt an existing PostgreSQL instance

Use brownfield mode only when PostgreSQL already exists and its service and data remain
operator-owned. Back up the instance first. The wizard does not create, delete, start, or stop
that PostgreSQL instance, but it does add managed configuration blocks, create the gateway role,
install the DocumentDB extensions, and register the gateway.

Identify the instance as `<major>/<name>`. On Ubuntu, run `pg_lsclusters`; a typical instance is
`18/main`. The standard PGDG layout on EL9 has one instance per major and also uses `18/main`;
add `--pg-port` when it listens on a non-default port.

```bash
sudo documentdb-setup --target-postgres-instance 18/main --admin-user admin
```

If `shared_preload_libraries` changed, the first run prints a restart handoff instead of
finishing setup. Restart the operator-managed PostgreSQL service, then re-run the exact setup
command it prints. Typical service names are `postgresql@18-main.service` on Ubuntu and
`postgresql-18.service` on EL9. The wizard intentionally does not restart an adopted PostgreSQL
instance for you.

The wizard's default `default_toast_compression` setting applies to newly written values in
every database on an adopted instance. If other workloads must retain PostgreSQL's own default,
prefix both setup runs with `sudo DOCUMENTDB_TOAST_COMPRESSION=default`.

**Running SQL against a package-managed private instance.** A greenfield PostgreSQL instance is
owned by the `documentdb-local` system user and listens on a socket, so a bare `psql` will not
find it:

```bash
sudo -u documentdb-local psql -h /run/documentdb-local/18/postgresql -p 9718 -d postgres
```

Use that connection for the `ALTER EXTENSION` statements under Upgrading, and to read versions
with `SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'documentdb%';`.
For an adopted instance, use the operator's existing PostgreSQL connection instead.

**Greenfield: destroy the package-managed instance:**

```bash
# Reset reads setup.conf before removing it, stops the services, and destroys
# the package-managed data directory. Do not run --restore first.
sudo documentdb-local-reset --pg-version 18 --confirm-destroy

# Name the package you installed AND the extension: autoremove does not reap
# postgresql-18-documentdb, and `remove` would leave its config behind.
sudo apt purge --autoremove documentdb-18 postgresql-18-documentdb
sudo dnf remove documentdb-18 postgresql18-documentdb && sudo dnf autoremove
```

**Brownfield: detach without deleting the existing PostgreSQL instance:**

Before restoring, run `sudo documentdb-setup --status` and note the gateway port for the major
you are removing.

On a systemd host, a scoped restore stops and disables that major's gateway:

```bash
sudo documentdb-setup --restore --pg-version 18
```

On a host without systemd, v0.116 cannot safely attribute a nohup gateway process to one
PostgreSQL major. If only one DocumentDB major is configured, use an unscoped restore so the
orphan gateway sweep runs:

```bash
sudo documentdb-setup --restore --yes
```

If more than one DocumentDB major is configured without systemd, schedule a maintenance window
and use the same unscoped restore. It detaches every configured major and stops the nohup
gateways; re-run setup for the majors you are keeping afterward. A scoped restore alone is not
sufficient on a no-systemd host.

Restart the adopted PostgreSQL service after restore to apply removal of the managed settings.
On an unscoped multi-major restore, restart each operator-managed PostgreSQL service involved.

Verify that the target gateway port is no longer listening before removing packages. Substitute
the port you noted above; the command should produce no output:

```bash
ss -lnt | grep ':10260'
```

Then remove the selected major:

```bash
sudo apt purge --autoremove documentdb-18 postgresql-18-documentdb
sudo dnf remove documentdb-18 postgresql18-documentdb && sudo dnf autoremove
```

Never run `documentdb-local-reset` for a brownfield installation. Never run restore before a
greenfield reset: restore deletes the state that identifies custom data directories and
protects adopted clusters.

If you installed the `documentdb` meta package rather than `documentdb-18`, name that instead.

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

## Installing a different PostgreSQL major

The current release publishes PostgreSQL 17 and 18. Install `documentdb-17` or
`documentdb-18`; the `documentdb` meta package selects PostgreSQL 18.

## Upgrading an existing install

> **Warning:** v0.116 does not support an in-place upgrade from the extension-only package
> layout in v0.114 or earlier. Use a clean host, or remove the earlier packages and perform the
> current fresh installation. Upgrading only `postgresql-N-documentdb` does not install the
> gateway, tools, common payload, or `documentdb-N`.

For a later point release that uses the same multi-package layout, move the entire stack
together. On a package-managed private PostgreSQL 18 instance:

```bash
sudo systemctl stop documentdb-gateway-local@18.service

# Debian / Ubuntu
sudo apt update
sudo apt install --only-upgrade documentdb-18 postgresql-18-documentdb \
  documentdb-common documentdb-gateway documentdb-postgresql-tools

# EL9: use this instead of the apt commands above
sudo dnf upgrade documentdb-18 postgresql18-documentdb \
  documentdb-common documentdb-gateway documentdb-postgresql-tools

# PostgreSQL has the old shared library loaded until it restarts.
sudo systemctl restart documentdb-postgresql@18.service
```

Then update the extensions in **every database** that has DocumentDB installed:

```sql
ALTER EXTENSION documentdb_core UPDATE;
ALTER EXTENSION documentdb UPDATE;
ALTER EXTENSION documentdb_extended_rum UPDATE;  -- only if it is installed
```

PostgreSQL applies available intermediate extension upgrade scripts automatically. Confirm
afterwards with:

```sql
SELECT extname, extversion FROM pg_extension WHERE extname LIKE 'documentdb%';
```

Finally restart the gateway:

```bash
sudo systemctl start documentdb-gateway-local@18.service
```

Take a backup first. For an adopted PostgreSQL instance, restart its operator-managed
PostgreSQL service instead of `documentdb-postgresql@18.service`.

## Version pinning

Run the repository setup for your distro first, then:

### APT

```bash
apt-cache madison documentdb-18
sudo apt install documentdb-18=<VERSION>
```

### RPM

```bash
dnf --showduplicates list documentdb-18
sudo dnf install documentdb-18-<VERSION>
```

## Build-on-demand targets

Other distributions and PostgreSQL majors accepted by the upstream packaging scripts can be
built from the matching source tag. They are not official release assets and are therefore not
published in the documentdb.io package repositories. Community builds are welcome.

For example, after checking out the matching release tag, build an extension package with:

```bash
./packaging/build_packages.sh --os deb12 --pg 16
```

That command builds only `postgresql-N-documentdb`. A custom full-stack package set uses
three entry points:

- `packaging/build_packages.sh` — PostgreSQL extension
- `packaging/gateway/build_gateway_packages.sh` — wire-protocol gateway
- `packaging/build_extra_packages.sh` — tools, common payload, `documentdb-N`, and meta package

The [v0.116 packaging guide](https://github.com/documentdb/documentdb/blob/v0.116-0/packaging/README.md)
documents their required arguments, version formats, prerequisites, and accepted targets.
PostgreSQL 15 remains extension-only for package-managed installs because the setup tools
require PostgreSQL 16 or newer.


## Direct downloads

GitHub Releases contains the `.deb` and `.rpm` assets for every published combination.
The package repositories on documentdb.io are generated from exactly the same asset list;
they do not retain packages from older releases.

Examples:

```text
ubuntu24.04-documentdb_0.116.0_all.deb
ubuntu24.04-postgresql-18-documentdb_0.116-0_amd64.deb
rhel9-postgresql18-documentdb-0.116.0-1.el9.x86_64.rpm
```

Because the packages depend on each other, installing a downloaded meta package on its own
fails with `Depends: documentdb-18 ... but it is not installable`. Pass the whole set to a
single command, or just use the repository-backed install above.

- GitHub Releases: https://github.com/documentdb/documentdb/releases
- Release metadata: https://documentdb.io/packages/release-info.json

## Notes

- The current release publishes the `ubuntu24` APT component and the `rpm/rhel9` repository.
- The RPM flow depends on EPEL plus PostgreSQL's upstream RPM repository because DocumentDB depends on PostgreSQL, `pg_cron`, `pgvector`, PostGIS, and `rum` for PostgreSQL 17.
- On Debian/Ubuntu, the distro-packaged `cargo` can be older than the current gateway workspace lockfile. `rustup` avoids that mismatch.
