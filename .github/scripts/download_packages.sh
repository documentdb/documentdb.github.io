#!/bin/bash
set -e

# Repository to download packages from
REPO="documentdb/documentdb"

# Repository configuration
SUITE="${SUITE:-stable}"
COMPONENTS="${COMPONENTS:-main}"
ORIGIN="${ORIGIN:-DocumentDB}"
DESCRIPTION="${DESCRIPTION:-DocumentDB APT and YUM Repository}"

GOT_DEB=0
GOT_RPM=0
DEB_POOL="out/deb/pool/${COMPONENTS}"
DEB_DISTS="dists/${SUITE}"
DEB_DISTS_COMPONENTS="${DEB_DISTS}/${COMPONENTS}/binary-amd64"
GPG_TTY=""
export GPG_TTY

generate_hashes() {
  HASH_TYPE="$1"
  HASH_COMMAND="$2"
  echo "${HASH_TYPE}:"
  find "${COMPONENTS}" -type f | while read -r file
  do
    echo " $(${HASH_COMMAND} "$file" | cut -d" " -f1) $(wc -c "$file" | awk '{print $1}')"
  done
}

echo "Downloading packages from $REPO releases"

# Get the latest release info (including pre-releases)
if release=$(curl -fqs "https://api.github.com/repos/${REPO}/releases" | python3 -c "import sys, json; releases = json.load(sys.stdin); print(json.dumps(releases[0])) if releases else sys.exit(1)")
then
  tag="$(echo "$release" | python3 -c "import sys, json; print(json.load(sys.stdin)['tag_name'])")"
  echo "Found latest release: $tag"
  
  # Create packages directory for direct downloads
  mkdir -p out/packages
  
  # Process each asset
  echo "$release" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for asset in data.get('assets', []):
    print(f\"{asset['name']}|{asset['browser_download_url']}\")
" | while IFS='|' read -r filename download_url
  do
    if [ -z "$filename" ]; then
      continue
    fi
    
    echo "Processing: $filename"
    
    # Determine file type and handle accordingly
    if [[ "$filename" == *.deb ]]; then
      GOT_DEB=1
      mkdir -p "$DEB_POOL"
      echo "  Downloading DEB package to pool"
      wget -q -P "$DEB_POOL" "$download_url"
      # Also copy to packages for direct download
      cp "$DEB_POOL/$filename" out/packages/
    elif [[ "$filename" == *.rpm ]]; then
      GOT_RPM=1
      mkdir -p out/rpm
      echo "  Downloading RPM package"
      wget -q -P out/rpm "$download_url"
      # Also copy to packages for direct download
      cp "out/rpm/$filename" out/packages/
    else
      # Other files go directly to packages
      echo "  Downloading to packages directory"
      wget -q -P out/packages "$download_url"
    fi
  done
  
  # Save release metadata
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
else
  echo "Error: Could not fetch release information for $REPO"
  exit 1
fi

# Build DEB repository if we have DEB packages
if [ -d "$DEB_POOL" ] && [ "$(ls -A $DEB_POOL/*.deb 2>/dev/null)" ]; then
  echo "Building APT repository..."
  pushd out/deb >/dev/null
  
  mkdir -p "${DEB_DISTS_COMPONENTS}"
  
  echo "Scanning DEB packages and creating Packages file"
  dpkg-scanpackages --arch amd64 pool/ > "${DEB_DISTS_COMPONENTS}/Packages"
  gzip -k -f "${DEB_DISTS_COMPONENTS}/Packages"
  
  pushd "${DEB_DISTS}" >/dev/null
  
  echo "Creating Release file"
  {
    echo "Origin: ${ORIGIN}"
    echo "Label: DocumentDB"
    echo "Suite: ${SUITE}"
    echo "Codename: ${SUITE}"
    echo "Version: 1.0"
    echo "Architectures: amd64"
    echo "Components: ${COMPONENTS}"
    echo "Description: ${DESCRIPTION}"
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
  else
    echo "Warning: GPG_FINGERPRINT not set, skipping package signing"
  fi
  
  popd >/dev/null
  popd >/dev/null
  echo "APT repository built successfully"
fi

# Build RPM repository if we have RPM packages
if [ -d "out/rpm" ] && [ "$(ls -A out/rpm/*.rpm 2>/dev/null)" ]; then
  echo "Building YUM repository..."
  pushd out/rpm >/dev/null
  
  # Sign RPMs if GPG is available
  if [ -n "$GPG_FINGERPRINT" ]; then
    echo "Signing RPM packages"
    for rpm_file in *.rpm; do
      rpm --define "%_signature gpg" --define "%_gpg_name ${GPG_FINGERPRINT}" --addsign "$rpm_file" || echo "Warning: Could not sign $rpm_file"
    done
  fi
  
  echo "Creating YUM repository metadata"
  createrepo_c .
  
  # Sign repository metadata if GPG is available
  if [ -n "$GPG_FINGERPRINT" ]; then
    echo "Signing repository metadata"
    gpg --default-key "$GPG_FINGERPRINT" --detach-sign --armor repodata/repomd.xml
  fi
  
  popd >/dev/null
  echo "YUM repository built successfully"
fi

# Create comprehensive index page
cat > out/packages/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocumentDB Package Repository</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f7fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .section {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #667eea;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e0e0e0;
        }
        .install-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        .install-box code {
            display: block;
            margin: 0.5rem 0;
            color: #2d3748;
        }
        .package-list {
            list-style: none;
        }
        .package-item {
            background: #f5f5f5;
            padding: 1rem;
            margin: 0.5rem 0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.2s;
        }
        .package-item:hover {
            transform: translateX(5px);
            background: #e8e8e8;
        }
        .package-name {
            font-weight: 500;
            color: #667eea;
        }
        .package-size {
            color: #666;
            font-size: 0.9em;
        }
        .download-btn {
            background: #667eea;
            color: white;
            padding: 0.5rem 1rem;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9em;
            transition: background 0.2s;
        }
        .download-btn:hover {
            background: #5568d3;
        }
        .release-info {
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .release-info h2 {
            color: #2e7d32;
            border: none;
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.85em;
            margin-left: 0.5rem;
        }
        .tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .tab {
            padding: 0.5rem 1rem;
            background: #e0e0e0;
            border: none;
            border-radius: 4px 4px 0 0;
            cursor: pointer;
            font-size: 1rem;
        }
        .tab.active {
            background: #667eea;
            color: white;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 DocumentDB Package Repository</h1>
        <p>Official APT and YUM repositories for DocumentDB</p>
    </div>
    
    <div class="container">
        <div class="release-info" id="releaseInfo">
            <p>Loading release information...</p>
        </div>
        
        <div class="section">
            <h2>Quick Setup</h2>
            <div class="tabs">
                <button class="tab active" onclick="switchTab('debian')">Debian/Ubuntu</button>
                <button class="tab" onclick="switchTab('redhat')">RHEL/CentOS/Fedora</button>
            </div>
            
            <div id="debian-content" class="tab-content active">
                <h3>For Debian/Ubuntu Systems</h3>
                <div class="install-box">
                    <code># Add the repository</code>
                    <code>echo "deb [arch=amd64] https://documentdb.github.io/deb stable main" | sudo tee /etc/apt/sources.list.d/documentdb.list</code>
                    <code></code>
                    <code># Update and install</code>
                    <code>sudo apt-get update</code>
                    <code>sudo apt-get install documentdb</code>
                </div>
                <p>Or use our setup script:</p>
                <div class="install-box">
                    <code>curl -sSL https://documentdb.github.io/setup-apt.sh | sudo bash</code>
                </div>
            </div>
            
            <div id="redhat-content" class="tab-content">
                <h3>For RHEL/CentOS/Fedora Systems</h3>
                <div class="install-box">
                    <code># Add the repository</code>
                    <code>sudo tee /etc/yum.repos.d/documentdb.repo &lt;&lt;EOF</code>
                    <code>[documentdb]</code>
                    <code>name=DocumentDB Repository</code>
                    <code>baseurl=https://documentdb.github.io/rpm</code>
                    <code>enabled=1</code>
                    <code>gpgcheck=0</code>
                    <code>EOF</code>
                    <code></code>
                    <code># Install</code>
                    <code>sudo yum install documentdb</code>
                </div>
                <p>Or use our setup script:</p>
                <div class="install-box">
                    <code>curl -sSL https://documentdb.github.io/setup-yum.sh | sudo bash</code>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Direct Downloads</h2>
            <ul class="package-list" id="packageList">
                <li>Loading packages...</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>Repository URLs</h2>
            <ul>
                <li><strong>APT Repository:</strong> <code>https://documentdb.github.io/deb</code></li>
                <li><strong>YUM Repository:</strong> <code>https://documentdb.github.io/rpm</code></li>
                <li><strong>Metadata:</strong> <a href="release-info.json">release-info.json</a></li>
            </ul>
        </div>
    </div>
    
    <script>
        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tab + '-content').classList.add('active');
        }
        
        fetch('release-info.json')
            .then(response => response.json())
            .then(data => {
                const releaseInfo = document.getElementById('releaseInfo');
                releaseInfo.innerHTML = `
                    <h2>${data.name || data.tag_name} <span class="badge">${data.tag_name}</span></h2>
                    <p><strong>Released:</strong> ${new Date(data.published_at).toLocaleDateString()}</p>
                    <p><a href="${data.html_url}" target="_blank" style="color: #2e7d32;">View Release on GitHub →</a></p>
                `;
                
                const packageList = document.getElementById('packageList');
                if (data.assets && data.assets.length > 0) {
                    packageList.innerHTML = data.assets.map(asset => `
                        <li class="package-item">
                            <div>
                                <div class="package-name">${asset.name}</div>
                                <div class="package-size">${(asset.size / 1024 / 1024).toFixed(2)} MB • Downloaded ${asset.download_count} times</div>
                            </div>
                            <a href="${asset.name}" class="download-btn" download>Download</a>
                        </li>
                    `).join('');
                } else {
                    packageList.innerHTML = '<li>No packages available</li>';
                }
            })
            .catch(error => {
                console.error('Error loading packages:', error);
                document.getElementById('packageList').innerHTML = '<li>Error loading packages</li>';
            });
    </script>
</body>
</html>
HTMLEOF

echo "Package repository setup complete!"
echo ""
echo "Repository structure:"
ls -lh out/

# Copy setup scripts to the root of out directory for easy access
echo ""
echo "Copying setup scripts..."
cp .github/scripts/setup-apt.sh out/
cp .github/scripts/setup-yum.sh out/
echo "Setup scripts copied to root"

# Create an index file for the packages
cat > out/packages/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocumentDB Packages</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
        }
        h1 { color: #333; }
        .package-list {
            list-style: none;
            padding: 0;
        }
        .package-item {
            background: #f5f5f5;
            padding: 1rem;
            margin: 0.5rem 0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .package-name {
            font-weight: 500;
            color: #0366d6;
        }
        .package-size {
            color: #666;
            font-size: 0.9em;
        }
        .download-btn {
            background: #0366d6;
            color: white;
            padding: 0.5rem 1rem;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .download-btn:hover {
            background: #0256c7;
        }
        .release-info {
            background: #e8f5e9;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <h1>DocumentDB Packages</h1>
    <div class="release-info" id="releaseInfo">
        <p>Loading release information...</p>
    </div>
    <ul class="package-list" id="packageList">
        <li>Loading packages...</li>
    </ul>
    
    <script>
        fetch('release-info.json')
            .then(response => response.json())
            .then(data => {
                // Display release info
                const releaseInfo = document.getElementById('releaseInfo');
                releaseInfo.innerHTML = `
                    <h2>${data.name || data.tag_name}</h2>
                    <p><strong>Version:</strong> ${data.tag_name}</p>
                    <p><strong>Released:</strong> ${new Date(data.published_at).toLocaleDateString()}</p>
                    <p><a href="${data.html_url}" target="_blank">View on GitHub</a></p>
                `;
                
                // Display packages
                const packageList = document.getElementById('packageList');
                if (data.assets && data.assets.length > 0) {
                    packageList.innerHTML = data.assets.map(asset => `
                        <li class="package-item">
                            <div>
                                <div class="package-name">${asset.name}</div>
                                <div class="package-size">${(asset.size / 1024 / 1024).toFixed(2)} MB • Downloaded ${asset.download_count} times</div>
                            </div>
                            <a href="${asset.browser_download_url}" class="download-btn" download>Download</a>
                        </li>
                    `).join('');
                } else {
                    packageList.innerHTML = '<li>No packages available</li>';
                }
            })
            .catch(error => {
                console.error('Error loading packages:', error);
                document.getElementById('packageList').innerHTML = '<li>Error loading packages</li>';
            });
    </script>
</body>
</html>
EOF

echo "Package download complete!"
ls -lh out/packages/
