#!/bin/bash
set -euo pipefail

SIGN="${SIGN:-false}"
PORT="${PACKAGE_REPOSITORY_PORT:-8099}"
NETWORK="documentdb-package-test-$$"
SERVER_NAME="documentdb-package-repo-$$"

if ! ls out/deb/pool/ubuntu24/documentdb_*_all.deb >/dev/null 2>&1; then
  echo "::error::out/deb/pool/ubuntu24 has no documentdb meta package."
  exit 1
fi
if ! ls out/rpm/rhel9/documentdb-*.noarch.rpm >/dev/null 2>&1; then
  echo "::error::out/rpm/rhel9 has no documentdb meta package."
  exit 1
fi

cleanup() {
  docker rm -f "$SERVER_NAME" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker network create "$NETWORK" >/dev/null
docker run -d --rm \
  --name "$SERVER_NAME" \
  --network "$NETWORK" \
  -v "$PWD/out:/srv:ro" \
  python:3.13-alpine \
  python -m http.server "$PORT" --directory /srv >/dev/null

for _ in $(seq 1 30); do
  if docker exec "$SERVER_NAME" \
    wget -q -O /dev/null "http://127.0.0.1:${PORT}/deb/dists/stable/Release"; then
    break
  fi
  sleep 1
done
docker exec "$SERVER_NAME" \
  wget -q -O /dev/null "http://127.0.0.1:${PORT}/rpm/rhel8/repodata/repomd.xml"
docker exec "$SERVER_NAME" \
  wget -q -O /dev/null "http://127.0.0.1:${PORT}/rpm/main/repodata/repomd.xml"

echo "::group::APT dependency resolution"
docker run --rm --network "$NETWORK" \
  -e DOCUMENTDB_REPOSITORY_HOST="$SERVER_NAME" \
  -e DOCUMENTDB_REPOSITORY_PORT="$PORT" \
  -e DOCUMENTDB_REPOSITORY_SIGNED="$SIGN" \
  ubuntu:24.04 bash -c '
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq >/dev/null
    apt-get install -y -qq curl ca-certificates gnupg >/dev/null
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
      | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
    echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list

    if [ "$DOCUMENTDB_REPOSITORY_SIGNED" = true ]; then
      curl -fsSL "http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/documentdb-archive-keyring.gpg" \
        | gpg --dearmor -o /usr/share/keyrings/documentdb.gpg
      echo "deb [signed-by=/usr/share/keyrings/documentdb.gpg] http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/deb stable ubuntu24" \
        > /etc/apt/sources.list.d/documentdb.list
    else
      echo "deb [trusted=yes] http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/deb stable ubuntu24" \
        > /etc/apt/sources.list.d/documentdb.list
    fi

    apt-get update -qq
    for major in 17 18; do
      apt-get install -s "documentdb-${major}" > "/tmp/apt-${major}.txt"
      for pkg in "documentdb-${major}" documentdb-common documentdb-gateway documentdb-postgresql-tools; do
        grep -q "Inst ${pkg} " "/tmp/apt-${major}.txt" || {
          echo "APT PG${major} plan is missing ${pkg}"
          cat "/tmp/apt-${major}.txt"
          exit 1
        }
      done
      grep -q "Inst postgresql-${major}-documentdb " "/tmp/apt-${major}.txt" || {
        echo "APT PG${major} plan is missing its extension package"
        cat "/tmp/apt-${major}.txt"
        exit 1
      }
    done

    if [ "$DOCUMENTDB_REPOSITORY_SIGNED" = true ]; then
      echo "deb [signed-by=/usr/share/keyrings/documentdb.gpg] http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/deb stable deb13" \
        > /etc/apt/sources.list.d/documentdb.list
    else
      echo "deb [trusted=yes] http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/deb stable deb13" \
        > /etc/apt/sources.list.d/documentdb.list
    fi
    apt-get update -qq
    echo "APT PG17/PG18 resolution and retired-component refresh succeeded."
  '
echo "::endgroup::"

echo "::group::DNF dependency resolution"
docker run --rm --network "$NETWORK" \
  -e DOCUMENTDB_REPOSITORY_HOST="$SERVER_NAME" \
  -e DOCUMENTDB_REPOSITORY_PORT="$PORT" \
  -e DOCUMENTDB_REPOSITORY_SIGNED="$SIGN" \
  rockylinux/rockylinux:9 bash -c '
    set -euo pipefail
    dnf install -y -q dnf-plugins-core >/dev/null 2>&1
    dnf install -y -q https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm >/dev/null 2>&1
    dnf install -y -q epel-release >/dev/null 2>&1
    dnf config-manager --set-enabled crb
    dnf -qy module disable postgresql >/dev/null 2>&1

    {
      echo "[documentdb]"
      echo "name=DocumentDB"
      echo "baseurl=http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/rpm/rhel9"
      echo "enabled=1"
      if [ "$DOCUMENTDB_REPOSITORY_SIGNED" = true ]; then
        echo "gpgcheck=1"
        echo "gpgkey=http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/documentdb-archive-keyring.gpg"
      else
        echo "gpgcheck=0"
      fi
    } > /etc/yum.repos.d/documentdb.repo

    for major in 17 18; do
      dnf install --assumeno "documentdb-${major}" > "/tmp/dnf-${major}.txt" 2>&1 || true
      if grep -qE "^Error|nothing provides|Problem:" "/tmp/dnf-${major}.txt"; then
        echo "DNF could not resolve documentdb-${major}:"
        cat "/tmp/dnf-${major}.txt"
        exit 1
      fi
      for pkg in "documentdb-${major}" documentdb-common documentdb-gateway documentdb-postgresql-tools "postgresql${major}-documentdb"; do
        grep -q "$pkg" "/tmp/dnf-${major}.txt" || {
          echo "DNF PG${major} plan is missing ${pkg}"
          cat "/tmp/dnf-${major}.txt"
          exit 1
        }
      done
    done

    {
      echo "[documentdb-retired]"
      echo "name=DocumentDB retired compatibility endpoint"
      echo "baseurl=http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/rpm/rhel8"
      echo "enabled=1"
      echo "gpgcheck=0"
    } > /etc/yum.repos.d/documentdb-retired.repo
    dnf -q makecache --disablerepo="*" --enablerepo=documentdb-retired
    echo "DNF PG17/PG18 resolution and retired-repository refresh succeeded."
  '
echo "::endgroup::"
