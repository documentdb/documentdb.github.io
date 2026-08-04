#!/bin/bash
set -e

REPO="documentdb/documentdb"
OUT_DIR="out"
DOCUMENTDB_VERSION="${DOCUMENTDB_VERSION:-latest}"
MULTI_VERSION="${MULTI_VERSION:-true}"
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

if [ "$DOCUMENTDB_VERSION" = "latest" ]; then
  if release=$(curl -fqs "https://api.github.com/repos/${REPO}/releases" | python3 -c "import sys, json; releases = json.load(sys.stdin); print(json.dumps(releases[0])) if releases else sys.exit(1)")
  then
    tag="$(echo "$release" | python3 -c "import sys, json; print(json.load(sys.stdin)['tag_name'])")"
    echo "Using latest release: $tag"
  else
    echo "Error: Could not fetch latest release information"
    exit 1
  fi
else
  tag="$DOCUMENTDB_VERSION"
  if ! release=$(curl -fqs "https://api.github.com/repos/${REPO}/releases/tags/$tag")
  then
    echo "Error: Version $tag not found in releases"
    exit 1
  fi
  echo "Using specified release: $tag"
fi

mkdir -p out/packages
  ASSETS_FILE=$(mktemp)
  echo "$release" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for asset in data.get('assets', []):
    print(f\"{asset['name']}|{asset['browser_download_url']}\")
" > "$ASSETS_FILE"

  # Process each asset
  while IFS='|' read -r filename download_url
  do
    if [ -z "$filename" ]; then
      continue
    fi
    
    if [[ "$filename" == *.deb ]]; then
      wget -q -P out/packages "$download_url"
      
      if [[ "$filename" =~ ^deb11-postgresql-[0-9]+-documentdb.*\.deb$ ]]; then
        GOT_DEB=1
        mkdir -p "$DEB_POOL_DEB11"
        clean_name=$(echo "$filename" | sed 's/^deb11-//')
        cp "out/packages/$filename" "$DEB_POOL_DEB11/$clean_name"
        sign_deb_package "$DEB_POOL_DEB11/$clean_name"
      elif [[ "$filename" =~ ^deb12-postgresql-[0-9]+-documentdb.*\.deb$ ]]; then
        GOT_DEB=1
        mkdir -p "$DEB_POOL_DEB12"
        clean_name=$(echo "$filename" | sed 's/^deb12-//')
        cp "out/packages/$filename" "$DEB_POOL_DEB12/$clean_name"
        sign_deb_package "$DEB_POOL_DEB12/$clean_name"
      elif [[ "$filename" =~ ^deb13-postgresql-[0-9]+-documentdb.*\.deb$ ]]; then
        GOT_DEB=1
        mkdir -p "$DEB_POOL_DEB13"
        clean_name=$(echo "$filename" | sed 's/^deb13-//')
        cp "out/packages/$filename" "$DEB_POOL_DEB13/$clean_name"
        sign_deb_package "$DEB_POOL_DEB13/$clean_name"
      elif [[ "$filename" =~ ^ubuntu22\.04-postgresql-[0-9]+-documentdb.*\.deb$ ]]; then
        GOT_DEB=1
        mkdir -p "$DEB_POOL_UBUNTU22"
        clean_name=$(echo "$filename" | sed 's/^ubuntu22\.04-//')
        cp "out/packages/$filename" "$DEB_POOL_UBUNTU22/$clean_name"
        sign_deb_package "$DEB_POOL_UBUNTU22/$clean_name"
      elif [[ "$filename" =~ ^ubuntu24\.04-postgresql-[0-9]+-documentdb.*\.deb$ ]]; then
        GOT_DEB=1
        mkdir -p "$DEB_POOL_UBUNTU24"
        clean_name=$(echo "$filename" | sed 's/^ubuntu24\.04-//')
        cp "out/packages/$filename" "$DEB_POOL_UBUNTU24/$clean_name"
        sign_deb_package "$DEB_POOL_UBUNTU24/$clean_name"
      fi
    elif [[ "$filename" == *.rpm ]]; then
      echo "Processing RPM: $filename"
      wget -q -P out/packages "$download_url"
      
      if [[ "$filename" =~ ^rhel8-postgresql[0-9]+-documentdb.*\.rpm$ ]]; then
        GOT_RPM=1
        mkdir -p "$RPM_POOL_RHEL8"
        clean_name=$(echo "$filename" | sed 's/^rhel8-//')
        echo "  Adding to RHEL 8: $filename -> $clean_name"
        cp "out/packages/$filename" "$RPM_POOL_RHEL8/$clean_name"
      elif [[ "$filename" =~ ^rhel9-postgresql[0-9]+-documentdb.*\.rpm$ ]]; then
        GOT_RPM=1
        mkdir -p "$RPM_POOL_RHEL9"
        clean_name=$(echo "$filename" | sed 's/^rhel9-//')
        echo "  Adding to RHEL 9: $filename -> $clean_name"
        cp "out/packages/$filename" "$RPM_POOL_RHEL9/$clean_name"
      else
        echo "  Skipping RPM (does not match patterns): $filename"
      fi
    else
      wget -q -P out/packages "$download_url"
    fi
  done < "$ASSETS_FILE"
  
rm -f "$ASSETS_FILE"

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
