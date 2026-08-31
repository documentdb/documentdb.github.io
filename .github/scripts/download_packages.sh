#!/bin/bash
set -e

REPO="documentdb/documentdb"
OUT_DIR="out"
DOCUMENTDB_VERSION="${DOCUMENTDB_VERSION:-latest}"
SUITE="${SUITE:-stable}"
COMPONENTS="${COMPONENTS:-main}"
ORIGIN="${ORIGIN:-DocumentDB}"
DESCRIPTION="${DESCRIPTION:-DocumentDB APT and YUM Repository}"

sign_deb_package() {
  local package_file="$1"
  if [ -n "$GPG_FINGERPRINT" ] && [ -f "$package_file" ]; then
    echo "    Signing DEB package: $(basename "$package_file")"
    if command -v dpkg-sig >/dev/null 2>&1; then
      # Per-package signatures are not what apt verifies (it checks the signed
      # Release file), so a failure here is reported rather than fatal. It is
      # still surfaced as a workflow annotation so a broken signing key cannot
      # scroll past unnoticed in the log.
      dpkg-sig --sign builder --gpg-options "--default-key $GPG_FINGERPRINT" "$package_file" || echo "::warning::Could not sign $(basename "$package_file")"
    else
      echo "::warning::dpkg-sig not available, skipping DEB package signing"
    fi
  fi
}

GOT_DEB=0
GOT_RPM=0
DEB_POOL="out/deb/pool/${COMPONENTS}"
# Debian/Ubuntu pools
DEB_POOL_DEB11="out/deb/pool/deb11"
DEB_POOL_DEB12="out/deb/pool/deb12"
DEB_POOL_DEB13="out/deb/pool/deb13"
DEB_POOL_UBUNTU22="out/deb/pool/ubuntu22"
DEB_POOL_UBUNTU24="out/deb/pool/ubuntu24"
# RPM pools
RPM_POOL_RHEL8="out/rpm/rhel8"
RPM_POOL_RHEL9="out/rpm/rhel9"

DEB_DISTS="dists/${SUITE}"
# AMD64 directories
DEB_DISTS_COMPONENTS_AMD64="${DEB_DISTS}/${COMPONENTS}/binary-amd64"
DEB_DISTS_DEB11_AMD64="${DEB_DISTS}/deb11/binary-amd64"
DEB_DISTS_DEB12_AMD64="${DEB_DISTS}/deb12/binary-amd64"
DEB_DISTS_DEB13_AMD64="${DEB_DISTS}/deb13/binary-amd64"
DEB_DISTS_UBUNTU22_AMD64="${DEB_DISTS}/ubuntu22/binary-amd64"
DEB_DISTS_UBUNTU24_AMD64="${DEB_DISTS}/ubuntu24/binary-amd64"
# ARM64 directories
DEB_DISTS_COMPONENTS_ARM64="${DEB_DISTS}/${COMPONENTS}/binary-arm64"
DEB_DISTS_DEB11_ARM64="${DEB_DISTS}/deb11/binary-arm64"
DEB_DISTS_DEB12_ARM64="${DEB_DISTS}/deb12/binary-arm64"
DEB_DISTS_DEB13_ARM64="${DEB_DISTS}/deb13/binary-arm64"
DEB_DISTS_UBUNTU22_ARM64="${DEB_DISTS}/ubuntu22/binary-arm64"
DEB_DISTS_UBUNTU24_ARM64="${DEB_DISTS}/ubuntu24/binary-arm64"
GPG_TTY=""
export GPG_TTY

generate_hashes() {
  HASH_TYPE="$1"
  HASH_COMMAND="$2"
  echo "${HASH_TYPE}:"
  for component in ${COMPONENTS} deb11 deb12 deb13 ubuntu22 ubuntu24; do
    if [ -d "$component" ]; then
      find "$component" -type f | while read -r file
      do
        echo " $(${HASH_COMMAND} "$file" | cut -d" " -f1) $(wc -c "$file" | awk '{print $1}') $file"
      done
    fi
  done
}

echo "Downloading packages from $REPO releases"

# ---------------------------------------------------------------------------
# Release selection
#
# The selected release is the package repository's single source of truth.
# Older releases must not fill gaps: those combinations are on-demand builds,
# not assets of the current official release, and mixing them into the pool
# makes stale versions look supported.
# ---------------------------------------------------------------------------

RELEASES_JSON=$(mktemp)
if ! curl -fqs "https://api.github.com/repos/${REPO}/releases?per_page=100" > "$RELEASES_JSON"; then
  echo "Error: Could not fetch release list"
  exit 1
fi

# Select exactly one published release. Drafts and prereleases are skipped.
SELECTED_TAG=$(DOCUMENTDB_VERSION="$DOCUMENTDB_VERSION" python3 - "$RELEASES_JSON" <<'PY'
import json, os, sys

releases = json.load(open(sys.argv[1]))
published = [r for r in releases if not r.get("draft") and not r.get("prerelease")]
if not published:
    sys.exit("Error: no published releases found")

requested = os.environ.get("DOCUMENTDB_VERSION", "latest")
if requested != "latest":
    selected = next((r for r in published if r["tag_name"] == requested), None)
    if selected is None:
        sys.exit(f"Error: Version {requested} not found in releases")
else:
    selected = published[0]

print(selected["tag_name"])
PY
)

PRIMARY_TAG="$SELECTED_TAG"
echo "Primary release: $PRIMARY_TAG"

# Packages already placed, keyed by "pool|name|arch". A newer release always
# wins; an older release contributes only packages the newer ones do not
# provide at all. That is what keeps `postgresql-16-documentdb` alive on
# ubuntu24/rhel9 after v0.116-0 narrowed Tier 1 to PostgreSQL 17/18, instead of
# silently deleting a package the install docs still tell people to use.
SEEN_FILE=$(mktemp)

is_claimed() { case " $1 " in *" $2 "*) return 0 ;; *) return 1 ;; esac; }

# "name|arch" identity of a package file, independent of its version.
#   postgresql-16-documentdb_0.114-0_amd64.deb   -> postgresql-16-documentdb|amd64
#   documentdb_0.116.0_all.deb                   -> documentdb|all
#   postgresql16-documentdb-0.114.0-1.el8.x86_64.rpm -> postgresql16-documentdb|x86_64
#   documentdb-17-0.116.0-1.noarch.rpm           -> documentdb-17|noarch
package_identity() {
  local f="$1"
  case "$f" in
    *.deb)
      printf '%s|%s' "${f%%_*}" "$(printf '%s' "$f" | sed -E 's/.*_([^_]+)\.deb$/\1/')"
      ;;
    *.rpm)
      local base="${f%.rpm}"
      local arch="${base##*.}"
      local nvr="${base%.*}"
      # Drop the trailing VERSION and RELEASE fields to leave the package name.
      printf '%s|%s' "$(printf '%s' "$nvr" | sed -E 's/-[^-]+-[^-]+$//')" "$arch"
      ;;
  esac
}

claim_package() {
  # claim_package <pool> <filename> -> 0 when this is a new package for the pool
  local key="$1|$(package_identity "$2")"
  if grep -qxF "$key" "$SEEN_FILE" 2>/dev/null; then
    return 1
  fi
  printf '%s\n' "$key" >> "$SEEN_FILE"
  return 0
}

# Map an asset filename to its APT component, or empty when it is not a
# distribution-prefixed .deb. Any DocumentDB package for that distribution
# matches - the extension, the gateway, the tools, documentdb-common, the
# per-major stand-alone and the meta package - because the v0.116-0 packaging
# redesign ships all of them and an extension-only filter would silently drop
# every package that makes `apt install documentdb` resolve.
deb_component_for() {
  case "$1" in
    *dbgsym*)        echo "" ;;
    deb11-*.deb)     echo "deb11" ;;
    deb12-*.deb)     echo "deb12" ;;
    deb13-*.deb)     echo "deb13" ;;
    ubuntu22.04-*.deb) echo "ubuntu22" ;;
    ubuntu24.04-*.deb) echo "ubuntu24" ;;
    *)               echo "" ;;
  esac
}

deb_pool_for() {
  case "$1" in
    deb11)    echo "$DEB_POOL_DEB11" ;;
    deb12)    echo "$DEB_POOL_DEB12" ;;
    deb13)    echo "$DEB_POOL_DEB13" ;;
    ubuntu22) echo "$DEB_POOL_UBUNTU22" ;;
    ubuntu24) echo "$DEB_POOL_UBUNTU24" ;;
  esac
}

# RPM naming is less uniform than DEB. The extension RPMs carry a distro
# prefix (rhel9-...), the gateway carries a dist tag (....el9.x86_64.rpm), and
# the meta / per-major / common / tools RPMs are noarch with NO dist tag at
# all, so they cannot be routed by name. Those EL-agnostic packages are placed
# in exactly the pools this release populated via its prefixed assets - never
# into a pool served by a different release, where their >= dependencies on a
# same-version documentdb-N would be unsatisfiable.
rpm_pool_for() {
  case "$1" in
    *debuginfo*|*debugsource*) echo "" ;;
    rhel8-*.rpm)  echo "rhel8" ;;
    rhel9-*.rpm)  echo "rhel9" ;;
    *.el8.*.rpm)  echo "rhel8" ;;
    *.el9.*.rpm)  echo "rhel9" ;;
    *)            echo "" ;;
  esac
}

mkdir -p out/packages

for tag in "$PRIMARY_TAG"; do

  if ! release=$(curl -fqs "https://api.github.com/repos/${REPO}/releases/tags/$tag"); then
    echo "::warning::Could not fetch release $tag, skipping"
    continue
  fi

  ASSETS_FILE=$(mktemp)
  echo "$release" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for asset in data.get('assets', []):
    print(f\"{asset['name']}|{asset['browser_download_url']}\")
" > "$ASSETS_FILE"

  # First pass: which RPM pools does this release populate? Needed to route the
  # EL-agnostic noarch packages, which carry no distro hint in their names.
  serve_rpm=""
  while IFS='|' read -r filename _; do
    [ -z "$filename" ] && continue
    case "$filename" in
      *.rpm)
        pool=$(rpm_pool_for "$filename")
        if [ -n "$pool" ] && ! is_claimed "$serve_rpm" "$pool"; then
          serve_rpm="$serve_rpm $pool"
        fi ;;
    esac
  done < "$ASSETS_FILE"

  added=0
  while IFS='|' read -r filename download_url; do
    [ -z "$filename" ] && continue

    case "$filename" in
      *.deb)
        comp=$(deb_component_for "$filename")
        [ -z "$comp" ] && continue
        claim_package "$comp" "$filename" || continue
        wget -q -P out/packages "$download_url" || { echo "::warning::download failed: $filename"; continue; }
        GOT_DEB=1
        pool=$(deb_pool_for "$comp")
        mkdir -p "$pool"
        # The distro prefix disambiguates release assets; it is not part of
        # the package name and must not survive into the pool.
        clean_name=$(echo "$filename" | sed -E 's/^(deb1[123]|ubuntu2[24]\.04)-//')
        cp "out/packages/$filename" "$pool/$clean_name"
        sign_deb_package "$pool/$clean_name"
        added=$((added + 1)) ;;

      *.rpm)
        pool_name=$(rpm_pool_for "$filename")
        if [ -n "$pool_name" ]; then
          targets="$pool_name"
        else
          case "$filename" in
            *.noarch.rpm) targets="$serve_rpm" ;;
            *) targets="" ;;
          esac
        fi
        [ -z "$targets" ] && continue

        downloaded=0
        clean_name=$(echo "$filename" | sed -E 's/^rhel[89]-//')
        for t in $targets; do
          claim_package "$t" "$filename" || continue
          case "$t" in
            rhel8) dest="$RPM_POOL_RHEL8" ;;
            rhel9) dest="$RPM_POOL_RHEL9" ;;
            *) continue ;;
          esac
          if [ "$downloaded" -eq 0 ]; then
            wget -q -P out/packages "$download_url" || { echo "::warning::download failed: $filename"; break; }
            downloaded=1
            GOT_RPM=1
          fi
          mkdir -p "$dest"
          echo "  Adding to ${t}: $filename -> $clean_name"
          cp "out/packages/$filename" "$dest/$clean_name"
          added=$((added + 1))
        done ;;

      *)
        # Non-package assets (SHA256SUMS, manifest.txt, ...) are mirrored only
        # for the primary release, which is what the site links to.
        [ "$tag" = "$PRIMARY_TAG" ] && wget -q -P out/packages "$download_url" ;;
    esac
  done < "$ASSETS_FILE"

  echo "Release $tag contributed $added package file(s)"
  rm -f "$ASSETS_FILE"
done

rm -f "$RELEASES_JSON" "$SEEN_FILE"

# release-info.json describes the primary release only: it is the "what is the
# current version" feed for the site, not an inventory of the pool.
release=$(curl -fqs "https://api.github.com/repos/${REPO}/releases/tags/${PRIMARY_TAG}")
echo "$release" | python3 -c "
import sys, json
data = json.load(sys.stdin)
output = {
    'tag_name': data['tag_name'],
    'name': data.get('name', data['tag_name']),
    'published_at': data['published_at'],
    'html_url': data['html_url'],
    'assets': [{
        'name': asset['name'],
        'browser_download_url': asset['browser_download_url'],
        'size': asset['size'],
        'download_count': asset.get('download_count', 0)
    } for asset in data.get('assets', [])]
}
print(json.dumps(output, indent=2))
" > out/packages/release-info.json

echo "Successfully processed packages from $REPO"
echo "GOT_DEB=$GOT_DEB, GOT_RPM=$GOT_RPM"
echo "Checking final RPM repository structure:"
for pool in "$RPM_POOL_RHEL8" "$RPM_POOL_RHEL9"; do
  if [ -d "$pool" ]; then
    echo "  $pool: $(ls -1 $pool/*.rpm 2>/dev/null | wc -l) RPM files"
    ls -la "$pool"/ 2>/dev/null || echo "  Cannot list contents"
  else
    echo "  $pool: Directory does not exist"
  fi
done

if [ "$GOT_DEB" = "1" ]; then
  echo "Building APT repository with multiple distribution components..."
  pushd out/deb >/dev/null
  
    if [ -d "pool/ubuntu22" ] && [ "$(ls -A pool/ubuntu22/*.deb 2>/dev/null)" ]; then
    mkdir -p "${DEB_DISTS_COMPONENTS_AMD64}" "${DEB_DISTS_COMPONENTS_ARM64}"
    dpkg-scanpackages --arch amd64 pool/ubuntu22/ > "${DEB_DISTS_COMPONENTS_AMD64}/Packages"
    dpkg-scanpackages --arch arm64 pool/ubuntu22/ > "${DEB_DISTS_COMPONENTS_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_COMPONENTS_AMD64}/Packages" "${DEB_DISTS_COMPONENTS_ARM64}/Packages"
  fi
  
  if [ -d "pool/deb11" ] && [ "$(ls -A pool/deb11/*.deb 2>/dev/null)" ]; then
    mkdir -p "${DEB_DISTS_DEB11_AMD64}" "${DEB_DISTS_DEB11_ARM64}"
    dpkg-scanpackages --arch amd64 pool/deb11/ > "${DEB_DISTS_DEB11_AMD64}/Packages"
    dpkg-scanpackages --arch arm64 pool/deb11/ > "${DEB_DISTS_DEB11_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB11_AMD64}/Packages" "${DEB_DISTS_DEB11_ARM64}/Packages"
  fi
  
  if [ -d "pool/deb12" ] && [ "$(ls -A pool/deb12/*.deb 2>/dev/null)" ]; then
    mkdir -p "${DEB_DISTS_DEB12_AMD64}" "${DEB_DISTS_DEB12_ARM64}"
    dpkg-scanpackages --arch amd64 pool/deb12/ > "${DEB_DISTS_DEB12_AMD64}/Packages"
    dpkg-scanpackages --arch arm64 pool/deb12/ > "${DEB_DISTS_DEB12_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB12_AMD64}/Packages" "${DEB_DISTS_DEB12_ARM64}/Packages"
  fi

  if [ -d "pool/deb13" ] && [ "$(ls -A pool/deb13/*.deb 2>/dev/null)" ]; then
    mkdir -p "${DEB_DISTS_DEB13_AMD64}" "${DEB_DISTS_DEB13_ARM64}"
    dpkg-scanpackages --arch amd64 pool/deb13/ > "${DEB_DISTS_DEB13_AMD64}/Packages"
    dpkg-scanpackages --arch arm64 pool/deb13/ > "${DEB_DISTS_DEB13_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB13_AMD64}/Packages" "${DEB_DISTS_DEB13_ARM64}/Packages"
  fi
  
  if [ -d "pool/ubuntu22" ] && [ "$(ls -A pool/ubuntu22/*.deb 2>/dev/null)" ]; then
    mkdir -p "${DEB_DISTS_UBUNTU22_AMD64}" "${DEB_DISTS_UBUNTU22_ARM64}"
    dpkg-scanpackages --arch amd64 pool/ubuntu22/ > "${DEB_DISTS_UBUNTU22_AMD64}/Packages"
    dpkg-scanpackages --arch arm64 pool/ubuntu22/ > "${DEB_DISTS_UBUNTU22_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_UBUNTU22_AMD64}/Packages" "${DEB_DISTS_UBUNTU22_ARM64}/Packages"
  fi
  
  if [ -d "pool/ubuntu24" ] && [ "$(ls -A pool/ubuntu24/*.deb 2>/dev/null)" ]; then
    mkdir -p "${DEB_DISTS_UBUNTU24_AMD64}" "${DEB_DISTS_UBUNTU24_ARM64}"
    dpkg-scanpackages --arch amd64 pool/ubuntu24/ > "${DEB_DISTS_UBUNTU24_AMD64}/Packages"
    dpkg-scanpackages --arch arm64 pool/ubuntu24/ > "${DEB_DISTS_UBUNTU24_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_UBUNTU24_AMD64}/Packages" "${DEB_DISTS_UBUNTU24_ARM64}/Packages"
  fi
  
  # Create deb11 component (Debian 11 Bullseye)
  if [ -d "pool/deb11" ] && [ "$(ls -A pool/deb11/*.deb 2>/dev/null)" ]; then
    # AMD64 packages
    mkdir -p "${DEB_DISTS_DEB11_AMD64}"
    echo "Scanning Debian 11 AMD64 packages for deb11 component"
    dpkg-scanpackages --arch amd64 pool/deb11/ > "${DEB_DISTS_DEB11_AMD64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB11_AMD64}/Packages"
    
    # ARM64 packages
    mkdir -p "${DEB_DISTS_DEB11_ARM64}"
    echo "Scanning Debian 11 ARM64 packages for deb11 component"
    dpkg-scanpackages --arch arm64 pool/deb11/ > "${DEB_DISTS_DEB11_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB11_ARM64}/Packages"
  fi
  
  # Create deb12 component (Debian 12 Bookworm)
  if [ -d "pool/deb12" ] && [ "$(ls -A pool/deb12/*.deb 2>/dev/null)" ]; then
    # AMD64 packages
    mkdir -p "${DEB_DISTS_DEB12_AMD64}"
    echo "Scanning Debian 12 AMD64 packages for deb12 component"
    dpkg-scanpackages --arch amd64 pool/deb12/ > "${DEB_DISTS_DEB12_AMD64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB12_AMD64}/Packages"
    
    # ARM64 packages
    mkdir -p "${DEB_DISTS_DEB12_ARM64}"
    echo "Scanning Debian 12 ARM64 packages for deb12 component"
    dpkg-scanpackages --arch arm64 pool/deb12/ > "${DEB_DISTS_DEB12_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB12_ARM64}/Packages"
  fi

  # Create deb13 component (Debian 13 Trixie)
  if [ -d "pool/deb13" ] && [ "$(ls -A pool/deb13/*.deb 2>/dev/null)" ]; then
    # AMD64 packages
    mkdir -p "${DEB_DISTS_DEB13_AMD64}"
    echo "Scanning Debian 13 AMD64 packages for deb13 component"
    dpkg-scanpackages --arch amd64 pool/deb13/ > "${DEB_DISTS_DEB13_AMD64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB13_AMD64}/Packages"

    # ARM64 packages
    mkdir -p "${DEB_DISTS_DEB13_ARM64}"
    echo "Scanning Debian 13 ARM64 packages for deb13 component"
    dpkg-scanpackages --arch arm64 pool/deb13/ > "${DEB_DISTS_DEB13_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_DEB13_ARM64}/Packages"
  fi
  
  # Create ubuntu22 component (Ubuntu 22.04 Jammy)
  if [ -d "pool/ubuntu22" ] && [ "$(ls -A pool/ubuntu22/*.deb 2>/dev/null)" ]; then
    # AMD64 packages
    mkdir -p "${DEB_DISTS_UBUNTU22_AMD64}"
    echo "Scanning Ubuntu 22.04 AMD64 packages for ubuntu22 component"
    dpkg-scanpackages --arch amd64 pool/ubuntu22/ > "${DEB_DISTS_UBUNTU22_AMD64}/Packages"
    gzip -k -f "${DEB_DISTS_UBUNTU22_AMD64}/Packages"
    
    # ARM64 packages
    mkdir -p "${DEB_DISTS_UBUNTU22_ARM64}"
    echo "Scanning Ubuntu 22.04 ARM64 packages for ubuntu22 component"
    dpkg-scanpackages --arch arm64 pool/ubuntu22/ > "${DEB_DISTS_UBUNTU22_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_UBUNTU22_ARM64}/Packages"
  fi
  
  # Create ubuntu24 component (Ubuntu 24.04 Noble)
  if [ -d "pool/ubuntu24" ] && [ "$(ls -A pool/ubuntu24/*.deb 2>/dev/null)" ]; then
    # AMD64 packages
    mkdir -p "${DEB_DISTS_UBUNTU24_AMD64}"
    echo "Scanning Ubuntu 24.04 AMD64 packages for ubuntu24 component"
    dpkg-scanpackages --arch amd64 pool/ubuntu24/ > "${DEB_DISTS_UBUNTU24_AMD64}/Packages"
    gzip -k -f "${DEB_DISTS_UBUNTU24_AMD64}/Packages"
    
    # ARM64 packages
    mkdir -p "${DEB_DISTS_UBUNTU24_ARM64}"
    echo "Scanning Ubuntu 24.04 ARM64 packages for ubuntu24 component"
    dpkg-scanpackages --arch arm64 pool/ubuntu24/ > "${DEB_DISTS_UBUNTU24_ARM64}/Packages"
    gzip -k -f "${DEB_DISTS_UBUNTU24_ARM64}/Packages"
  fi
  
  pushd "${DEB_DISTS}" >/dev/null
  
  echo "Creating Release file"
  # Determine which components we actually have
  AVAILABLE_COMPONENTS=""
  [ -d "${COMPONENTS}/binary-amd64" ] && AVAILABLE_COMPONENTS="${AVAILABLE_COMPONENTS} ${COMPONENTS}"
  [ -d "deb11/binary-amd64" ] && AVAILABLE_COMPONENTS="${AVAILABLE_COMPONENTS} deb11"
  [ -d "deb12/binary-amd64" ] && AVAILABLE_COMPONENTS="${AVAILABLE_COMPONENTS} deb12"
  [ -d "deb13/binary-amd64" ] && AVAILABLE_COMPONENTS="${AVAILABLE_COMPONENTS} deb13"
  [ -d "ubuntu22/binary-amd64" ] && AVAILABLE_COMPONENTS="${AVAILABLE_COMPONENTS} ubuntu22"
  [ -d "ubuntu24/binary-amd64" ] && AVAILABLE_COMPONENTS="${AVAILABLE_COMPONENTS} ubuntu24"
  AVAILABLE_COMPONENTS=$(echo $AVAILABLE_COMPONENTS | sed 's/^ *//')
  
  # Determine available architectures
  AVAILABLE_ARCHITECTURES=""
  [ -d "${COMPONENTS}/binary-amd64" ] || [ -d "deb11/binary-amd64" ] || [ -d "deb12/binary-amd64" ] || [ -d "deb13/binary-amd64" ] || [ -d "ubuntu22/binary-amd64" ] || [ -d "ubuntu24/binary-amd64" ] && AVAILABLE_ARCHITECTURES="${AVAILABLE_ARCHITECTURES} amd64"
  [ -d "${COMPONENTS}/binary-arm64" ] || [ -d "deb11/binary-arm64" ] || [ -d "deb12/binary-arm64" ] || [ -d "deb13/binary-arm64" ] || [ -d "ubuntu22/binary-arm64" ] || [ -d "ubuntu24/binary-arm64" ] && AVAILABLE_ARCHITECTURES="${AVAILABLE_ARCHITECTURES} arm64"
  AVAILABLE_ARCHITECTURES=$(echo $AVAILABLE_ARCHITECTURES | sed 's/^ *//')
  
  {
    echo "Origin: ${ORIGIN}"
    echo "Label: DocumentDB"
    echo "Suite: ${SUITE}"
    echo "Codename: ${SUITE}"
    echo "Version: 1.0"
    echo "Architectures: ${AVAILABLE_ARCHITECTURES}"
    echo "Components: ${AVAILABLE_COMPONENTS}"
    echo "Description: ${DESCRIPTION} - Multiple distributions supported"
    echo "Date: $(date -Ru)"
    generate_hashes MD5Sum md5sum
    generate_hashes SHA1 sha1sum
    generate_hashes SHA256 sha256sum
  } > Release
  
  # Sign if GPG is available
  if [ -n "$GPG_FINGERPRINT" ]; then
    echo "Signing Release file with GPG"
    gpg --default-key "$GPG_FINGERPRINT" --detach-sign --armor -o Release.gpg Release
    gpg --default-key "$GPG_FINGERPRINT" --clearsign -o InRelease Release
    
    # Export public key for users to import
    echo "Exporting GPG public key"
    gpg --armor --export "$GPG_FINGERPRINT" > documentdb-archive-keyring.gpg
    
    # Also create the key in the main directory for easy access
    gpg --armor --export "$GPG_FINGERPRINT" > ../../../documentdb-archive-keyring.gpg
  else
    echo "Warning: GPG_FINGERPRINT not set, skipping package signing"
  fi
  
  popd >/dev/null


  echo "APT repository built successfully with multiple distribution support"
fi

if [ "$GOT_RPM" = "1" ]; then
  echo "Building YUM repositories..."
  
  # Adjust RPM pool paths if we're in the wrong directory after APT processing
  if [[ "$PWD" == */out/deb ]]; then
    RHEL8_POOL="../rpm/rhel8"
    RHEL9_POOL="../rpm/rhel9"
    MAIN_POOL="../rpm/main"
  else
    RHEL8_POOL="$RPM_POOL_RHEL8"
    RHEL9_POOL="$RPM_POOL_RHEL9"
    MAIN_POOL="out/rpm/main"
  fi
  
  for POOL in "$RHEL8_POOL" "$RHEL9_POOL"; do
    if [ -d "$POOL" ] && [ "$(find "$POOL" -name "*.rpm" -type f | wc -l)" -gt 0 ]; then
      echo "Processing YUM repository: $POOL"
      pushd "$POOL" >/dev/null
      
      if [ -n "$GPG_FINGERPRINT" ]; then
        for rpm_file in *.rpm; do
          rpm --define "%_signature gpg" --define "%_gpg_name ${GPG_FINGERPRINT}" --addsign "$rpm_file" 2>/dev/null || true
        done
      fi
      
      echo "Running createrepo_c in $(pwd)"
      if createrepo_c .; then
        echo "Repository metadata created successfully"
        ls -la repodata/ 2>/dev/null || echo "No repodata directory found"
      else
        echo "ERROR: createrepo_c failed for $POOL"
      fi
      
      if [ -n "$GPG_FINGERPRINT" ] && [ -f repodata/repomd.xml ]; then
        gpg --default-key "$GPG_FINGERPRINT" --detach-sign --armor repodata/repomd.xml 2>/dev/null || true
      fi
      
      popd >/dev/null
    else
      echo "Skipping $POOL: directory not found or no RPM files"
    fi
  done
  
  # Create main repository for backward compatibility
  if [ -d "$RHEL8_POOL" ] && [ "$(find "$RHEL8_POOL" -name "*.rpm" -type f | wc -l)" -gt 0 ]; then
    echo "Creating main YUM repository"
    mkdir -p "$MAIN_POOL"
    cp "$RHEL8_POOL"/*.rpm "$MAIN_POOL"/ 2>/dev/null || true
    pushd "$MAIN_POOL" >/dev/null
    echo "Running createrepo_c for main repository in $(pwd)"
    if createrepo_c .; then
      echo "Main repository metadata created successfully"
      ls -la repodata/ 2>/dev/null || echo "No repodata directory found"
    else
      echo "ERROR: createrepo_c failed for main repository"
    fi
    if [ -n "$GPG_FINGERPRINT" ] && [ -f repodata/repomd.xml ]; then
      gpg --default-key "$GPG_FINGERPRINT" --detach-sign --armor repodata/repomd.xml 2>/dev/null || true
    fi
    popd >/dev/null
  fi
  
  echo "YUM repositories built successfully"
fi


echo "Package repository setup complete!"
echo ""
echo "Repository URLs:"
echo "  APT: https://documentdb.io/deb stable main"
echo "  YUM: https://documentdb.io/rpm/rhel8 (or /rhel9, /main)"
echo "  Browse: https://documentdb.io/packages/"
