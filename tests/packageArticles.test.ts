import { describe, expect, it } from 'vitest';
import {
  getArticleByPath,
  linuxPackagesGuideContent,
  linuxPackagesOperationsContent,
} from '../app/services/articleService';

describe('Linux package articles', () => {
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

  it('uses the current release package guide and artifact version', () => {
    const offlineGuide = getArticleByPath('linux-packages', ['offline']);

    expect(linuxPackagesGuideContent).toContain(
      'documentdb/blob/v0.117-0/packaging/README.md',
    );
    expect(linuxPackagesGuideContent).toContain(
      '`--load-sample-data` to the setup command to seed the `StoreData` database',
    );
    expect(offlineGuide?.content).toContain(
      'ubuntu24.04-postgresql-18-documentdb_0.117-0_amd64.deb',
    );
    expect(linuxPackagesOperationsContent).not.toContain(
      '## Known issues in 0.116',
    );
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

    expect(source).toContain(
      '41,505 store documents and 2 rating documents',
    );
    expect(source).toContain(
      'documentdb-local:pg18-0.117.0',
    );
    expect(source).toContain(
      'Currently identical to \\`pg17-0.117.0\\`',
    );
    expect(source).not.toContain(
      '5 users, 5 products, 4 orders, and 2',
    );
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
