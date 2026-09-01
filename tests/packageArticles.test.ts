import { describe, expect, it } from 'vitest';
import {
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

  it('keeps Package Finder advanced hints linked and version-agnostic', async () => {
    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const source = await readFile(
      fileURLToPath(new URL('../app/packages/page.tsx', import.meta.url)),
      'utf8',
    );

    expect(source).toContain('href="/docs/linux-packages#unattended-setup"');
    expect(source).toContain('individual subpackages can carry');
    expect(source).not.toContain('and the gateway are');
  });
});
