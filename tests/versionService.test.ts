import { describe, expect, it } from 'vitest';
import { compareVersionLabelsNewestFirst, keepDocsLinksInVersion } from '../app/services/versionService';

describe('compareVersionLabelsNewestFirst', () => {
  it('orders release lines numerically, newest first', () => {
    expect(['v1.9', 'v0.117', 'v1.10', 'v1.0'].sort(compareVersionLabelsNewestFirst))
      .toEqual(['v1.10', 'v1.9', 'v1.0', 'v0.117']);
  });
});

describe('keepDocsLinksInVersion', () => {
  const snapshot: Record<string, { section: string; file: string }> = {
    'getting-started/python-setup': { section: 'getting-started', file: 'python-setup' },
    // Renamed since the snapshot: current Linux Packages Quick Start was Pre-built Packages.
    'getting-started/packages': { section: 'getting-started', file: 'prebuilt-packages' },
    'documentdb-local/index': { section: 'documentdb-local', file: 'index' },
  };
  const findPage = (section: string, file: string) => snapshot[`${section}/${file}`] ?? null;
  const rewrite = (markdown: string, page = { section: 'getting-started', file: 'index' }) =>
    keepDocsLinksInVersion(markdown, 'v0.117', page, findPage);

  it('keeps links to pages the snapshot has inside the version', () => {
    expect(rewrite('[Python](https://documentdb.io/docs/getting-started/python-setup/)'))
      .toBe('[Python](/docs/versions/v0.117/getting-started/python-setup/)');
    expect(rewrite('[Sample data](https://documentdb.io/docs/documentdb-local/#built-in-sample-data)'))
      .toBe('[Sample data](/docs/versions/v0.117/documentdb-local/#built-in-sample-data)');
    expect(rewrite('[Docs](https://documentdb.io/docs/)')).toBe('[Docs](/docs/versions/v0.117/)');
  });

  it('follows pages renamed since the snapshot', () => {
    expect(rewrite('[Pre-built Packages](https://documentdb.io/docs/getting-started/packages/)'))
      .toBe('[Pre-built Packages](/docs/versions/v0.117/getting-started/prebuilt-packages/)');
  });

  it('leaves pages the snapshot lacks on the current site', () => {
    const links = '[API](https://documentdb.io/docs/reference/) [Offline](https://documentdb.io/docs/linux-packages/offline/) [Get packages](https://documentdb.io/packages)';
    expect(rewrite(links)).toBe(links);
  });

  it('never turns a link into a link to the page it is on', () => {
    const quickStart = '[Linux Packages Quick Start](https://documentdb.io/docs/getting-started/packages/)';
    expect(rewrite(quickStart, { section: 'getting-started', file: 'prebuilt-packages' })).toBe(quickStart);
    expect(rewrite('[StoreData](https://documentdb.io/docs/documentdb-local/#built-in-sample-data)', { section: 'documentdb-local', file: 'index' }))
      .toBe('[StoreData](#built-in-sample-data)');
  });
});
