# DocumentDB Package Repository

This site hosts APT and YUM repositories for DocumentDB packages.

## Quick Installation

### Debian/Ubuntu
```bash
curl -sSL https://documentdb.github.io/setup-apt.sh | sudo bash
sudo apt-get install documentdb
```

### RHEL/CentOS/Fedora
```bash
curl -sSL https://documentdb.github.io/setup-yum.sh | sudo bash
sudo yum install documentdb  # or dnf
```

## Manual Setup

### APT Repository (Debian/Ubuntu)
```bash
echo "deb [arch=amd64] https://documentdb.github.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/documentdb.list
sudo apt-get update
sudo apt-get install documentdb
```

### YUM Repository (RHEL/CentOS/Fedora)
```bash
sudo tee /etc/yum.repos.d/documentdb.repo <<EOF
[documentdb]
name=DocumentDB Repository
baseurl=https://documentdb.github.io/rpm
enabled=1
gpgcheck=0
EOF

sudo yum install documentdb
```

## Direct Downloads

Browse and download packages directly: [https://documentdb.github.io/packages/](https://documentdb.github.io/packages/)

## Repository Information

- **APT Repository:** `https://documentdb.github.io/deb`
- **YUM Repository:** `https://documentdb.github.io/rpm`
- **Setup Scripts:**
  - APT: `https://documentdb.github.io/setup-apt.sh`
  - YUM: `https://documentdb.github.io/setup-yum.sh`
- **Package Browser:** `https://documentdb.github.io/packages/`

## Updates

The repository is automatically updated whenever a new release is published in the [documentdb/documentdb](https://github.com/documentdb/documentdb) repository.

## Documentation

For more information about DocumentDB, visit the [main repository](https://github.com/documentdb/documentdb).
