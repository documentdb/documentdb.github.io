import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kebabCase } from 'change-case';
import {
  getArticleByPath,
  linuxPackagesGuideContent,
  linuxPackagesOperationsContent,
} from '../app/services/articleService';
import {
  buildAptInstallCommand,
  buildRpmInstallCommand,
  buildSetupCommand,
} from '../app/lib/packageInstall';
import { FALLBACK_RELEASE } from '../app/lib/releaseInfo';

function getCodeBlocks(content: string, language: string): string[] {
  const pattern = new RegExp('```' + language + '\\n([\\s\\S]*?)\\n```', 'g');
  return Array.from(content.matchAll(pattern), (match) => match[1]);
}

describe('Linux package articles', () => {
  beforeEach(() => {
    const fixturePaths = new Map(
      ['index.md', 'navigation.yml'].map((file) => [
        path.join(process.cwd(), 'articles', 'getting-started', file),
        fileURLToPath(new URL(`./fixtures/getting-started/${file}`, import.meta.url)),
      ]),
    );
    const existsSync = fs.existsSync;
    const readFileSync = fs.readFileSync;

    vi.spyOn(fs, 'existsSync').mockImplementation((file) =>
      existsSync(fixturePaths.get(file.toString()) ?? file),
    );
    vi.spyOn(fs, 'readFileSync').mockImplementation((file, options) =>
      readFileSync(fixturePaths.get(file.toString()) ?? file, options),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the shared Linux package install and fresh-instance setup commands', () => {
    const blocks = getCodeBlocks(linuxPackagesGuideContent, 'bash');

    expect(blocks).toContain(buildAptInstallCommand('ubuntu24', 'auto', '18'));
    expect(blocks).toContain(buildRpmInstallCommand('rocky9', 'auto', '18'));
    expect(blocks).toContain(buildRpmInstallCommand('rhel9', 'auto', '18'));
    expect(blocks).toContain(buildSetupCommand('18'));
    expect(linuxPackagesGuideContent).toContain('amd64 or arm64');
    // Existing installs must see the upgrade route before the first install command.
    expect(linuxPackagesGuideContent.indexOf('(/docs/linux-packages#upgrading)')).toBeGreaterThan(-1);
    expect(linuxPackagesGuideContent.indexOf('(/docs/linux-packages#upgrading)')).toBeLessThan(
      linuxPackagesGuideContent.indexOf('```bash'),
    );
    expect(linuxPackagesGuideContent).toContain(
      'Removing packages preserves database files',
    );
    expect(linuxPackagesGuideContent).toContain('**all interfaces**');
    expect(linuxPackagesGuideContent).toContain('Firewall port `10260`');
    expect(linuxPackagesGuideContent).toContain('**local development only**');
    expect(linuxPackagesGuideContent).toContain('> use quickstart');
    expect(linuxPackagesGuideContent).toContain('db.orders.insertOne(');
    expect(linuxPackagesGuideContent).toContain('db.orders.find(');
    expect(linuxPackagesGuideContent).toContain(
      'mongosh localhost:10260 -u admin -p --authenticationMechanism',
    );
    expect(getArticleByPath('getting-started', ['packages'])?.frontmatter.description)
      .toContain('Ubuntu APT or EL9 RPM/dnf packages');
  });

  it('aligns the Getting Started article and renderer with goal-based installation choices', async () => {
    const article = getArticleByPath('getting-started', []);
    if (!article) {
      throw new Error('Missing Getting Started landing article');
    }

    const startHere = article.content.split('## Start here')[1]?.split('## Verify your setup')[0];
    expect(startHere).toContain('/packages?method=packages');
    expect(startHere).toContain('/packages?method=docker');
    expect(startHere?.indexOf('/packages?method=docker')).toBeLessThan(
      startHere?.indexOf('/packages?method=packages') ?? -1,
    );
    expect(startHere).toContain('recommended for evaluation and development');
    expect(startHere).toContain('install packages, then run the setup wizard');
    expect(startHere).toContain('no second server installation is needed');
    expect(article.content).toContain('db.orders.insertOne(');
    expect(article.content).toContain('db.orders.find(');
    expect(article.content).toContain('acknowledged: true');
    expect(article.content).toContain('Run this shell example on the same host as DocumentDB');
    expect(article.content).toContain('## Architecture Components');
    expect(article.content).toContain('four primary components');
    expect(article.content).toContain('**pg_documentdb_extended_rum**');
    expect(article.content).toContain('## Common Use Cases');
    expect(article.content).toContain('## Community and Support');
    const packageIndex = article.navigation.findIndex((item) =>
      item.link === '/docs/getting-started/packages',
    );
    const dockerIndex = article.navigation.findIndex((item) =>
      item.link === '/docs/getting-started/docker',
    );
    expect(dockerIndex).toBeGreaterThanOrEqual(0);
    expect(packageIndex).toBeGreaterThan(dockerIndex);

    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const source = await readFile(
      fileURLToPath(new URL('../app/docs/[section]/[[...slug]]/page.tsx', import.meta.url)),
      'utf8',
    );

    expect(source).toContain('href="/packages?method=packages"');
    // The Docker card has one destination; the install page would only repeat its command.
    expect(source).not.toContain('href="/packages?method=docker"');
    expect(source.indexOf('href="/docs/getting-started/docker"')).toBeLessThan(
      source.indexOf('href="/packages?method=packages"'),
    );
    expect(source).toContain('-p 127.0.0.1:10260:10260');
    expect(source).not.toContain('-p 10260:10260');
    expect(source).toContain("-e USERNAME='<YOUR_USERNAME>'");
    expect(source).toContain("-e PASSWORD='<YOUR_PASSWORD>'");
    expect(source).not.toContain('Pre-GA');
  });

  it('offers both server methods before client-specific setup or optional Docker commands', () => {
    for (const slug of ['nodejs-setup', 'python-setup', 'mongo-shell-quickstart']) {
      const article = getArticleByPath('getting-started', [slug]);
      if (!article) {
        throw new Error(`Missing client quick start ${slug}`);
      }
      const content = article.content;
      const prerequisite = content.split('## Have a running DocumentDB instance?')[1]
        ?.split('## Prerequisites')[0];

      expect(prerequisite, slug).toContain('/packages?method=packages');
      expect(prerequisite, slug).toContain('/packages?method=docker');
      expect(prerequisite, slug).toContain('localhost:10260');
      expect(prerequisite, slug).toContain('username `admin`');
      expect(prerequisite, slug).toContain('**local development only**');
      expect(prerequisite, slug).toContain('firewall port `10260`');
      expect(content, slug).toContain('## Optional: start a Docker instance');
      expect(content, slug).toContain('Skip this if you installed Linux packages');
      expect(content, slug).toContain('Wait for the readiness banner');
      expect(content, slug).not.toContain('For the fastest local setup');
      expect(content.indexOf('/packages?method=packages'), slug).toBeLessThan(
        content.indexOf('docker run'),
      );
    }
  });

  it('keeps first writes independent of optional sample data for both installation methods', () => {
    for (const slug of ['python-setup', 'mongo-shell-quickstart']) {
      const content = getArticleByPath('getting-started', [slug])?.content;
      expect(content, slug).toContain('not required for your first insert and read');
      expect(content, slug).toContain('`--load-sample-data` during setup');
      expect(content, slug).toContain('see [Set up and connect](/docs/getting-started/packages#set-up-and-connect)');
      expect(content, slug).toContain('`--init-data true`');
    }
    const docker = getArticleByPath('getting-started', ['docker'])?.content;
    expect(docker).toContain('db.orders.insertOne(');
    expect(docker).toContain('db.orders.find(');
  });

  it('documents trusted certificates without requiring Docker for Linux package clients', () => {
    for (const slug of ['nodejs-setup', 'python-setup', 'mongo-shell-quickstart']) {
      const content = getArticleByPath('getting-started', [slug])?.content;
      expect(content, slug).toContain('For Linux packages, follow [certificate configuration]');
      expect(content, slug).toContain('/docs/linux-packages#before-exposing-it-to-a-network');
      expect(content, slug).toContain('For Docker, copy the local certificate with:');
      expect(content, slug).toContain('tlsCAFile');
    }
  });

  it('links to rendered section anchors in the advanced Linux packages guide', () => {
    const anchors = Array.from(
      linuxPackagesOperationsContent.matchAll(/^## (.+)$/gm),
      (match) => kebabCase(match[1]),
    );
    for (const slug of [
      [], ['packages'], ['nodejs-setup'], ['python-setup'], ['mongo-shell-quickstart'],
    ]) {
      const article = getArticleByPath('getting-started', slug);
      if (!article) {
        throw new Error(`Missing Getting Started article ${slug.join('/')}`);
      }
      const links = Array.from(
        article.content.matchAll(/\]\(\/docs\/linux-packages#([^)]+)\)/g),
        (match) => match[1],
      );
      expect(links.length).toBeGreaterThan(0);
      for (const anchor of links) {
        expect(anchors).toContain(anchor);
      }
    }
  });

  it('keeps advanced setup details out of the quick start', () => {
    expect(linuxPackagesGuideContent).toContain(
      '/docs/linux-packages#unattended-setup',
    );
    expect(linuxPackagesGuideContent).toContain(
      '/docs/linux-packages#adopt-an-existing-postgre-sql-instance',
    );
    expect(linuxPackagesGuideContent).not.toContain('--admin-password-stdin');
    expect(linuxPackagesGuideContent).not.toContain('--target-postgres-instance');
  });

  it('documents the supported brownfield adoption workflow', () => {
    expect(linuxPackagesOperationsContent).toContain(
      '## Adopt an existing PostgreSQL instance',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'sudo documentdb-setup --target-postgres-instance 18/main --admin-user admin',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'The wizard intentionally does not restart an adopted',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'DOCUMENTDB_TOAST_COMPRESSION=default',
    );
    expect(linuxPackagesOperationsContent).toContain(
      '**locally on the gateway host**',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'remote PostgreSQL adoption is not supported',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'administrator access to change PostgreSQL configuration and restart its service',
    );
  });

  it('keeps extension-only guidance advanced and systemd names per major', () => {
    expect(linuxPackagesGuideContent).toContain(
      '/docs/linux-packages#install-the-postgre-sql-extension-only',
    );
    expect(linuxPackagesOperationsContent).toContain(
      '## Install the PostgreSQL extension only',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'does **not** install the gateway, create a network endpoint for drivers',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'sudo systemctl restart documentdb-local@18.target',
    );
    expect(linuxPackagesOperationsContent).not.toContain(
      'sudo systemctl restart documentdb-local.target',
    );
  });

  it('distinguishes scoped systemd restore from no-systemd cleanup', () => {
    expect(linuxPackagesOperationsContent).toContain(
      'sudo documentdb-setup --restore --pg-version 18',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'sudo documentdb-setup --restore --yes',
    );
    expect(linuxPackagesOperationsContent).toMatch(
      /A scoped restore alone is not\s+sufficient on a no-systemd host\./,
    );
    expect(linuxPackagesOperationsContent).toContain(
      'Restart the adopted PostgreSQL service after restore',
    );
    expect(linuxPackagesOperationsContent).toContain(
      "the command should produce no output",
    );
  });

  it('provides a complete unattended setup command', () => {
    expect(linuxPackagesOperationsContent).toContain(
      `printf '%s' "$ADMIN_PW" | sudo documentdb-setup --pg-version 18`,
    );
    expect(linuxPackagesOperationsContent).toContain(
      '--use-new-postgres-instance --admin-user admin --admin-password-stdin --yes',
    );
  });

  it('keeps package download and source links on the mirrored release', () => {
    const tags = [
      ...`${linuxPackagesGuideContent}\n${linuxPackagesOperationsContent}`.matchAll(/documentdb\/(?:releases\/download|blob)\/(v[^/]+)\//g),
    ].map((match) => match[1]);

    expect(tags.length).toBeGreaterThan(0);
    expect(new Set(tags)).toEqual(new Set([FALLBACK_RELEASE.tagName]));
  });

  it('serves the stable installer without a pinned or RC version', () => {
    expect(linuxPackagesGuideContent).toContain('https://documentdb.io/install.sh');
    expect(linuxPackagesGuideContent).toContain('installs the current release (v1.0-0) from the package repository');
    // install.sh rejects --version v1.0-0, and RCs are retired at GA.
    expect(linuxPackagesGuideContent).not.toContain('--version v1.0');
    expect(linuxPackagesGuideContent).not.toMatch(/RC2|release-candidate/);
  });

  it('uses the current release package guide and artifact version', () => {
    const offlineGuide = getArticleByPath('linux-packages', ['offline']);

    expect(linuxPackagesGuideContent).toContain(
      'documentdb/blob/v1.0-0/packaging/README.md',
    );
    expect(linuxPackagesGuideContent).toContain(
      '`--load-sample-data` to the setup command to seed the `StoreData` database',
    );
    expect(offlineGuide?.content).toContain(
      'ubuntu24.04-postgresql-18-documentdb_1.0-0_amd64.deb',
    );
    expect(offlineGuide?.content).toContain(
      'pass the five packages for the selected PostgreSQL major',
    );
    expect(offlineGuide?.content).toContain(
      'For PostgreSQL 18 only, the optional `documentdb` meta package may be included',
    );
    expect(offlineGuide?.content).toContain('`documentdb-common`');
    expect(offlineGuide?.content).toContain('`documentdb-gateway`');
    expect(offlineGuide?.content).toContain('`documentdb-postgresql-tools`');
    expect(offlineGuide?.content).not.toContain('pass all six files');
    expect(linuxPackagesOperationsContent).not.toContain(
      '## Known issues in 0.116',
    );
  });

  it('keeps package setup rerunnable and reinstall wording data-safe', async () => {
    const packageBlocks = getCodeBlocks(linuxPackagesGuideContent, 'bash');
    const mongoRepositoryBlock = packageBlocks.find((block) =>
      block.includes('https://pgp.mongodb.com/server-8.0.asc'),
    );

    expect(mongoRepositoryBlock).toContain(
      'gpg --dearmor --yes -o /usr/share/keyrings/mongodb.gpg',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'Removing packages alone does not',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'package removal preserves PostgreSQL data and in-database content',
    );
    expect(linuxPackagesOperationsContent).not.toContain(
      'remove the earlier packages and perform the current',
    );

    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const packageInstall = await readFile(
      fileURLToPath(new URL('../PACKAGE-INSTALL.md', import.meta.url)),
      'utf8',
    );

    expect(packageInstall).toContain(
      'five packages for the selected PostgreSQL major',
    );
    expect(packageInstall).toContain(
      'the optional `documentdb` meta package may be included',
    );
    expect(packageInstall).toContain(
      'Removing packages',
    );
    expect(packageInstall).toContain(
      'alone does not create a fresh database',
    );
    expect(packageInstall).not.toContain('Pass the whole set');
  });

  it('does not list the fixed setup core-version update as a current issue', () => {
    expect(linuxPackagesOperationsContent).not.toContain(
      'does not run `ALTER EXTENSION documentdb_core UPDATE`',
    );
    expect(linuxPackagesOperationsContent).toContain(
      'ALTER EXTENSION documentdb_core UPDATE;',
    );
  });

  it('documents the current opt-in StoreData sample', async () => {
    const dockerGuide = getArticleByPath('getting-started', ['docker']);
    expect(dockerGuide?.content).toContain('use StoreData');
    expect(dockerGuide?.content).toContain(
      '41,505 documents in `stores` and 2 documents in `ratings`',
    );
    expect(dockerGuide?.content).toContain(
      'Existing volumes are not migrated automatically',
    );
    expect(dockerGuide?.content).not.toContain('use sampledb');

    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const source = await readFile(
      fileURLToPath(new URL('../app/services/articleService.ts', import.meta.url)),
      'utf8',
    );

    // The DocumentDB Local page comes from the docs repo; the site adds no image or sample section.
    expect(source).not.toContain('Currently identical to');
    expect(source).not.toContain(
      '5 users, 5 products, 4 orders, and 2',
    );
  });

  it('keeps executable local Docker recipes on loopback with explicit credentials', async () => {
    const quickStarts = [
      'docker',
      'vscode-quickstart',
      'nodejs-setup',
      'python-setup',
      'mongo-shell-quickstart',
    ];

    for (const slug of quickStarts) {
      const article = getArticleByPath('getting-started', [slug]);
      if (!article) {
        throw new Error(`Missing curated article getting-started/${slug}`);
      }

      const dockerBlocks = getCodeBlocks(article.content, 'bash').filter(
        (block) =>
          block.includes('docker run') &&
          block.includes('ghcr.io/documentdb/documentdb/documentdb-local'),
      );

      expect(dockerBlocks.length, slug).toBeGreaterThan(0);
      for (const block of dockerBlocks) {
        expect(block, slug).toContain('-p 127.0.0.1:10260:10260');
        expect(block, slug).not.toContain('-p 10260:10260');
        expect(block, slug).not.toContain('--username');
        expect(block, slug).not.toContain('--password');
      }
    }

    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const articleSource = await readFile(
      fileURLToPath(new URL('../app/services/articleService.ts', import.meta.url)),
      'utf8',
    );
    const packagePageSource = await readFile(
      fileURLToPath(new URL('../app/packages/page.tsx', import.meta.url)),
      'utf8',
    );

    expect(articleSource).toContain(
      "  ghcr.io/documentdb/documentdb/documentdb-local:latest \\\\\n  --init-data true",
    );
    expect(articleSource).toContain(
      '  -p 127.0.0.1:10260:10260 \\\\',
    );
    expect(packagePageSource).toContain(
      '  -p 127.0.0.1:10260:10260 \\\\',
    );
    expect(packagePageSource).toContain(
      "  -e USERNAME='<YOUR_USERNAME>' \\\\",
    );
    expect(packagePageSource).toContain(
      "  -e PASSWORD='<YOUR_PASSWORD>' \\\\",
    );
  });

  it('passes Node.js and Python credentials outside connection URIs', () => {
    const nodeGuide = getArticleByPath('getting-started', ['nodejs-setup']);
    const pythonGuide = getArticleByPath('getting-started', ['python-setup']);

    if (!nodeGuide || !pythonGuide) {
      throw new Error('Missing curated driver quick start');
    }

    const nodeBlocks = getCodeBlocks(nodeGuide.content, 'javascript');
    const nodeMain = nodeBlocks.find((block) =>
      block.includes('process.env.DOCUMENTDB_USERNAME'),
    );
    const nodeTrusted = nodeBlocks.find((block) =>
      block.includes('tlsCAFile'),
    );

    expect(nodeGuide.content).not.toContain(
      'mongodb://<YOUR_USERNAME>:<YOUR_PASSWORD>',
    );
    expect(nodeMain).toContain('process.env.DOCUMENTDB_PASSWORD');
    expect(nodeMain).toContain('if (!username || !password)');
    expect(nodeMain).toContain('auth: { username, password }');
    expect(nodeMain).toContain('authSource: "admin"');
    expect(nodeMain).toContain('new MongoClient(uri, options)');
    expect(nodeTrusted).toContain('auth: { username, password }');
    expect(nodeTrusted).toContain('authSource: "admin"');
    expect(nodeTrusted).not.toContain('<YOUR_PASSWORD>');

    const pythonBlocks = getCodeBlocks(pythonGuide.content, 'python');
    const pythonMain = pythonBlocks.find((block) =>
      block.includes('os.environ.get("DOCUMENTDB_USERNAME")'),
    );
    const pythonTrusted = pythonBlocks.find((block) =>
      block.includes('tlsCAFile'),
    );

    expect(pythonGuide.content).not.toContain(
      'mongodb://<YOUR_USERNAME>:<YOUR_PASSWORD>',
    );
    expect(pythonMain).toContain('os.environ.get("DOCUMENTDB_PASSWORD")');
    expect(pythonMain).toContain('if not username or not password:');
    expect(pythonMain).toContain('username=username');
    expect(pythonMain).toContain('password=password');
    expect(pythonTrusted).toContain('username=username');
    expect(pythonTrusted).toContain('password=password');
    expect(pythonTrusted).not.toContain('<YOUR_PASSWORD>');

    const nodeDockerBlock = getCodeBlocks(nodeGuide.content, 'bash').find(
      (block) => block.includes('docker run'),
    );
    const pythonDockerBlock = getCodeBlocks(pythonGuide.content, 'bash').find(
      (block) => block.includes('docker run'),
    );

    for (const content of [nodeGuide.content, pythonGuide.content]) {
      const block = getCodeBlocks(content, 'bash').find(
        (value) => value.includes('export DOCUMENTDB_USERNAME='),
      );
      expect(block).toContain("export DOCUMENTDB_USERNAME='<YOUR_USERNAME>'");
      expect(block).toContain("export DOCUMENTDB_PASSWORD='<YOUR_PASSWORD>'");
      expect(content.indexOf('## Set your client credentials')).toBeLessThan(
        content.indexOf('## Optional: start a Docker instance'),
      );
    }

    for (const block of [nodeDockerBlock, pythonDockerBlock]) {
      expect(block).toContain("export DOCUMENTDB_USERNAME='<YOUR_USERNAME>'");
      expect(block).toContain("export DOCUMENTDB_PASSWORD='<YOUR_PASSWORD>'");
      expect(block).toContain(
        '${DOCUMENTDB_USERNAME:?Set DOCUMENTDB_USERNAME}',
      );
      expect(block).toContain(
        '${DOCUMENTDB_PASSWORD:?Set DOCUMENTDB_PASSWORD}',
      );
    }
  });

  it('keeps Package Finder advanced hints linked and version-agnostic', async () => {
    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const source = await readFile(
      fileURLToPath(new URL('../app/packages/page.tsx', import.meta.url)),
      'utf8',
    );

    expect(source).toContain('href="/docs/linux-packages#unattended-setup"');
    expect(source).toContain('--load-sample-data</code> to seed the{" "}');
    expect(source).toContain('individual subpackages can carry');
    expect(source).not.toContain('and the gateway are');
  });
});

describe('manual extension upgrade SQL', () => {
  it.each([
    ['the operations guide', () => linuxPackagesOperationsContent],
    ['PACKAGE-INSTALL.md', () => fs.readFileSync(fileURLToPath(new URL('../PACKAGE-INSTALL.md', import.meta.url)), 'utf8')],
  ])('restarts PostgreSQL, updates every extension in one transaction and gates the gateway in %s', (_name, read) => {
    const text = read();
    const command = text.match(/sudo systemctl restart documentdb-postgresql@18\.service &&\nsudo -u documentdb-local psql[\s\S]*?documentdb-gateway-local@18\.service/)?.[0];
    expect(command).toBeDefined();
    expect(command).toContain('-X -1 -v ON_ERROR_STOP=1');
    // Exactly the four statements: no COMMIT/BEGIN of its own to split the transaction.
    expect(command!.match(/ -c '/g)).toHaveLength(4);
    expect(command).not.toMatch(/BEGIN|COMMIT|ROLLBACK/);
    const order = [
      "-c 'ALTER EXTENSION documentdb_core UPDATE;'",
      "-c 'ALTER EXTENSION documentdb UPDATE;'",
      "-c 'CREATE EXTENSION IF NOT EXISTS documentdb_extended_rum CASCADE;'",
      "-c 'ALTER EXTENSION documentdb_extended_rum UPDATE;' &&\nsudo systemctl start",
    ].map((part) => command!.indexOf(part));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // The preload check comes before the transaction, which can't detect a missing preload.
    expect(text.indexOf('SHOW shared_preload_libraries;')).toBeGreaterThan(-1);
    expect(text.indexOf('SHOW shared_preload_libraries;')).toBeLessThan(text.indexOf(command!));
    // The old separate-statement form committed each ALTER on its own.
    expect(text).not.toMatch(/^ALTER EXTENSION documentdb_core UPDATE;$/m);
    expect(text).toMatch(/only in\s+the `postgres` database/);
    // Restarting the whole target would start the gateway before setup updates the extensions.
    expect(text).toMatch(/restart documentdb-postgresql@18\.service &&\nsudo documentdb-setup/);
    expect(text).not.toMatch(/restart documentdb-local@18\.target &&\nsudo documentdb-setup/);
  });
});

describe('docs-owned article normalization', () => {
  beforeEach(() => {
    const fixturePaths = new Map([
      [path.join(process.cwd(), 'articles', 'documentdb-local', 'index.md'),
        fileURLToPath(new URL('./fixtures/documentdb-local/index.md', import.meta.url))],
      [path.join(process.cwd(), 'articles', 'getting-started', 'release-notes-1.0.md'),
        fileURLToPath(new URL('./fixtures/getting-started/release-notes-1.0.md', import.meta.url))],
    ]);
    const existsSync = fs.existsSync;
    const readFileSync = fs.readFileSync;
    vi.spyOn(fs, 'existsSync').mockImplementation((file) => existsSync(fixturePaths.get(file.toString()) ?? file));
    vi.spyOn(fs, 'readFileSync').mockImplementation((file, options) =>
      readFileSync(fixturePaths.get(file.toString()) ?? file, options),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves the DocumentDB Local page as the docs repo wrote it', () => {
    const article = getArticleByPath('documentdb-local', []);
    expect(article?.content).toContain('## Built-in sample data');
    expect(article?.content).not.toMatch(/## (Container image tags|Data initialization)/);
    expect(article?.content).not.toContain('on a fresh volume');
  });

  it('sends the release notes upgrade link to the operations guide', () => {
    const article = getArticleByPath('getting-started', ['release-notes-1.0']);
    expect(article?.content).toContain('](/docs/linux-packages#upgrading)');
    expect(article?.content).not.toContain('prebuilt-packages.md#upgrading-to-10');
  });
});
