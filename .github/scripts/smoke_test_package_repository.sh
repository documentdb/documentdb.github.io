#!/bin/bash
set -euo pipefail

SIGN="${SIGN:-false}"
PORT="${PACKAGE_REPOSITORY_PORT:-8099}"
NETWORK="documentdb-package-test-$$"
SERVER_NAME="documentdb-package-repo-$$"

for pool in out/deb/pool/ubuntu24 out/deb/pool/latest/ubuntu24; do
  if ! ls "$pool"/documentdb_*_all.deb >/dev/null 2>&1; then
    echo "::error::$pool has no documentdb meta package."
    exit 1
  fi
done
for pool in out/rpm/rhel9 out/rpm/latest/rhel9; do
  if ! ls "$pool"/documentdb-*.noarch.rpm >/dev/null 2>&1; then
    echo "::error::$pool has no documentdb meta package."
    exit 1
  fi
done

# Each channel must offer exactly the release its own feed names.
meta_version() {
  python3 -c 'import json, re, sys; print(next(m[1] for a in json.load(open(sys.argv[1]))["assets"] if (m := re.fullmatch(r"ubuntu24\.04-documentdb_([^_]+)_all\.deb", a["name"]))))' "$1"
}
STABLE_VERSION=$(meta_version out/packages/release-info.json)
LATEST_VERSION=$(meta_version out/packages/release-info-latest.json)
CHANNELS="stable=${STABLE_VERSION} latest=${LATEST_VERSION}"
echo "Expecting $CHANNELS"

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
docker exec "$SERVER_NAME" \
  wget -q -O /dev/null "http://127.0.0.1:${PORT}/deb/dists/latest/Release"
docker exec "$SERVER_NAME" \
  wget -q -O /dev/null "http://127.0.0.1:${PORT}/rpm/latest/rhel9/repodata/repomd.xml"

echo "::group::APT dependency resolution"
docker run --rm --network "$NETWORK" \
  -e DOCUMENTDB_REPOSITORY_HOST="$SERVER_NAME" \
  -e DOCUMENTDB_REPOSITORY_PORT="$PORT" \
  -e DOCUMENTDB_REPOSITORY_SIGNED="$SIGN" \
  -e DOCUMENTDB_CHANNELS="$CHANNELS" \
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
    fi

    for channel in $DOCUMENTDB_CHANNELS; do
      suite=${channel%%=*}
      version=${channel#*=}
      if [ "$DOCUMENTDB_REPOSITORY_SIGNED" = true ]; then
        echo "deb [signed-by=/usr/share/keyrings/documentdb.gpg] http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/deb ${suite} ubuntu24" \
          > /etc/apt/sources.list.d/documentdb.list
      else
        echo "deb [trusted=yes] http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/deb ${suite} ubuntu24" \
          > /etc/apt/sources.list.d/documentdb.list
      fi

      apt-get update -qq
      offered=$(apt-cache madison documentdb-18 | cut -d"|" -f2 | tr -d " " | sort -u | paste -sd" ")
      if [ "$offered" != "$version" ]; then
        echo "APT ${suite} offers documentdb-18 \"${offered}\"; expected only ${version}"
        exit 1
      fi
      for major in 17 18; do
        apt-get install -s "documentdb-${major}" > "/tmp/apt-${major}.txt"
        for pkg in "documentdb-${major}" documentdb-common documentdb-gateway documentdb-postgresql-tools; do
          grep -q "Inst ${pkg} " "/tmp/apt-${major}.txt" || {
            echo "APT ${suite} PG${major} plan is missing ${pkg}"
            cat "/tmp/apt-${major}.txt"
            exit 1
          }
        done
        grep -q "Inst postgresql-${major}-documentdb " "/tmp/apt-${major}.txt" || {
          echo "APT ${suite} PG${major} plan is missing its extension package"
          cat "/tmp/apt-${major}.txt"
          exit 1
        }
      done
      echo "APT ${suite} offers documentdb-18 ${offered}"
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
  -e DOCUMENTDB_CHANNELS="$CHANNELS" \
  rockylinux/rockylinux:9 bash -c '
    set -euo pipefail
    dnf install -y -q dnf-plugins-core >/dev/null 2>&1
    dnf install -y -q https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm >/dev/null 2>&1
    dnf install -y -q epel-release >/dev/null 2>&1
    dnf config-manager --set-enabled crb
    dnf -qy module disable postgresql >/dev/null 2>&1

    for channel in $DOCUMENTDB_CHANNELS; do
      name=${channel%%=*}
      version=${channel#*=}
      path=rpm/rhel9
      [ "$name" = stable ] || path="rpm/${name}/rhel9"
      # A repo id per channel keeps dnf from reusing the previous channel metadata.
      {
        echo "[documentdb-${name}]"
        echo "name=DocumentDB"
        echo "baseurl=http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/${path}"
        echo "enabled=1"
        if [ "$DOCUMENTDB_REPOSITORY_SIGNED" = true ]; then
          echo "gpgcheck=1"
          echo "gpgkey=http://${DOCUMENTDB_REPOSITORY_HOST}:${DOCUMENTDB_REPOSITORY_PORT}/documentdb-archive-keyring.gpg"
        else
          echo "gpgcheck=0"
        fi
      } > /etc/yum.repos.d/documentdb.repo

      offered=$(dnf -q repoquery --qf "%{version}" documentdb-18 | sort -u | paste -sd" ")
      if [ "$offered" != "$version" ]; then
        echo "DNF ${path} offers documentdb-18 \"${offered}\"; expected only ${version}"
        exit 1
      fi
      for major in 17 18; do
        dnf install --assumeno "documentdb-${major}" > "/tmp/dnf-${major}.txt" 2>&1 || true
        if grep -qE "^Error|nothing provides|Problem:" "/tmp/dnf-${major}.txt"; then
          echo "DNF ${path} could not resolve documentdb-${major}:"
          cat "/tmp/dnf-${major}.txt"
          exit 1
        fi
        for pkg in "documentdb-${major}" documentdb-common documentdb-gateway documentdb-postgresql-tools "postgresql${major}-documentdb"; do
          grep -q "$pkg" "/tmp/dnf-${major}.txt" || {
            echo "DNF ${path} PG${major} plan is missing ${pkg}"
            cat "/tmp/dnf-${major}.txt"
            exit 1
          }
        done
      done
      echo "DNF ${path} offers documentdb-18 ${offered}"
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
