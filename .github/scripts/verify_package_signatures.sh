#!/bin/bash
set -euo pipefail

if [ "${SIGN:-false}" != "true" ]; then
  echo "Signing is disabled; skipping signature verification."
  exit 0
fi

for artifact in \
  out/documentdb-archive-keyring.gpg \
  out/deb/dists/stable/InRelease \
  out/deb/dists/stable/Release.gpg; do
  if [ ! -s "$artifact" ]; then
    echo "::error::Signing is enabled but $artifact is missing or empty."
    exit 1
  fi
done

GNUPGHOME=$(mktemp -d)
RPM_DB=$(mktemp -d)
export GNUPGHOME
trap 'rm -rf "$GNUPGHOME" "$RPM_DB"' EXIT

gpg --batch --import out/documentdb-archive-keyring.gpg
gpg --batch --verify out/deb/dists/stable/InRelease
gpg --batch --verify \
  out/deb/dists/stable/Release.gpg \
  out/deb/dists/stable/Release

rpm --dbpath "$RPM_DB" --initdb
rpm --dbpath "$RPM_DB" --import out/documentdb-archive-keyring.gpg

verified_rpms=0
while IFS= read -r rpm_file; do
  rpmkeys --dbpath "$RPM_DB" --checksig --verbose "$rpm_file"
  verified_rpms=$((verified_rpms + 1))
done < <(find out/rpm/rhel8 out/rpm/rhel9 -type f -name '*.rpm' | sort)

if [ "$verified_rpms" -eq 0 ]; then
  echo "::error::Signing is enabled but no RPM packages were found to verify."
  exit 1
fi

while IFS= read -r repomd; do
  signature="${repomd}.asc"
  if [ ! -s "$signature" ]; then
    echo "::error::Signing is enabled but $signature is missing or empty."
    exit 1
  fi
  gpg --batch --verify "$signature" "$repomd"
done < <(find out/rpm -path '*/repodata/repomd.xml' -type f | sort)

echo "Verified APT metadata, $verified_rpms RPM packages, and all RPM repository metadata."
