#!/bin/bash
# DocumentDB YUM Repository Setup Script

set -e

REPO_FILE="/etc/yum.repos.d/documentdb.repo"

echo "Setting up DocumentDB YUM repository..."

# Create repository configuration
sudo tee $REPO_FILE > /dev/null <<EOF
[documentdb]
name=DocumentDB Repository
baseurl=https://documentdb.github.io/rpm
enabled=1
gpgcheck=0
EOF

# Note: Once GPG key is available, update gpgcheck=1 and add:
# gpgkey=https://documentdb.github.io/gpg-key.asc

echo ""
echo "✓ DocumentDB repository has been added!"
echo ""
echo "You can now install DocumentDB with:"
echo "  sudo yum install documentdb"
echo "or"
echo "  sudo dnf install documentdb"
