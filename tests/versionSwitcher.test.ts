import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { VersionSwitcherEntry } from '../app/services/versionService';

// Current docs and a v0.117 snapshot taken before Pre-built Packages became Linux Packages Quick Start.
const pages = [
  'articles/getting-started/index.md',
  'articles/getting-started/prebuilt-packages.md',
  'articles/getting-started/nodejs-setup.md',
  'versioned/v0.117/articles/getting-started/index.md',
  'versioned/v0.117/articles/getting-started/prebuilt-packages.md',
];

let root: string;
let getVersionSwitcherEntries: typeof import('../app/services/versionService').getVersionSwitcherEntries;

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'version-switcher-'));
  for (const page of pages) {
    fs.mkdirSync(path.dirname(path.join(root, page)), { recursive: true });
    fs.writeFileSync(path.join(root, page), '# Page\n');
  }
  // versionService resolves its directories from the working directory, partly at import.
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  vi.resetModules();
  ({ getVersionSwitcherEntries } = await import('../app/services/versionService'));
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

function entry(entries: VersionSwitcherEntry[], label: string): VersionSwitcherEntry {
  const match = entries.find((candidate) => candidate.label.startsWith(label));
  if (!match) throw new Error(`No switcher entry starting with ${label}`);
  return match;
}

describe('getVersionSwitcherEntries', () => {
  it('finds a renamed page in an older version', () => {
    const archived = entry(getVersionSwitcherEntries('current', 'getting-started', 'packages'), 'v0.117');
    expect(archived.href).toBe('/docs/versions/v0.117/getting-started/prebuilt-packages');
    expect(archived.note).toBeUndefined();
  });

  it('skips the moved notice on the way back to current', () => {
    const current = entry(getVersionSwitcherEntries('v0.117', 'getting-started', 'prebuilt-packages'), 'Current');
    expect(current.href).toBe('/docs/getting-started/packages');
    expect(current.note).toBeUndefined();
  });

  it('says so when a page has no counterpart', () => {
    const archived = entry(getVersionSwitcherEntries('current', 'getting-started', 'nodejs-setup'), 'v0.117');
    expect(archived.href).toBe('/docs/versions/v0.117/getting-started');
    expect(archived.note).toBe('No matching page, opens Getting Started');
  });
});
