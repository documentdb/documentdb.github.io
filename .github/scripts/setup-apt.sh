#!/bin/bash
# DocumentDB APT Repository Setup Script

set -e

REPO_URL="https://documentdb.github.io/deb"
SUITE="stable"
COMPONENT="main"
LIST_FILE="/etc/apt/sources.list.d/documentdb.list"

echo "Setting up DocumentDB APT repository..."

# Add repository to sources list
echo "deb [arch=amd64] $REPO_URL $SUITE $COMPONENT" | sudo tee $LIST_FILE

# Note: If GPG key is available, download it
# Uncomment the following lines once GPG key is published
# echo "Importing GPG key..."
# wget -qO - https://documentdb.github.io/gpg-key.asc | sudo apt-key add -

echo "Updating package list..."
sudo apt-get update

echo ""
echo "✓ DocumentDB repository has been added!"
echo ""
echo "You can now install DocumentDB with:"
echo "  sudo apt-get install documentdb"
