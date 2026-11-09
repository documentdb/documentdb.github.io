import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveMarkdownLink } from '../app/lib/markdownLinks';

describe('resolveMarkdownLink', () => {
  it('maps a sibling Markdown file to its published article route', () => {
    expect(
      resolveMarkdownLink(
        'functions.md',
        '/docs/postgres-api/index.md',
      ),
    ).toBe('/docs/postgres-api/functions/');
  });

  it('resolves encoded operator filenames from the source directory', () => {
    expect(
      resolveMarkdownLink(
        './%24bucket.md',
        '/docs/reference/operators/aggregation/%24bucketauto.md',
      ),
    ).toBe('/docs/reference/operators/aggregation/%24bucket/');
  });

  it('normalizes parent-directory references before publishing the route', () => {
    expect(
      resolveMarkdownLink(
        '../aggregation/aggregate.md',
        '/docs/reference/commands/query-and-write/getMore.md',
      ),
    ).toBe('/docs/reference/commands/aggregation/aggregate/');
  });

  it('collapses index files to their directory route', () => {
    expect(
      resolveMarkdownLink(
        '../index.md#quick-start',
        '/docs/getting-started/guides/python.md',
      ),
    ).toBe('/docs/getting-started/#quick-start');
  });

  it('preserves query strings and fragments', () => {
    expect(
      resolveMarkdownLink(
        'python-setup.md?view=full#connect',
        '/docs/getting-started/index.md',
      ),
    ).toBe('/docs/getting-started/python-setup/?view=full#connect');
  });

  it.each([
    'https://example.com/readme.md',
    '//example.com/readme.md',
    '/docs/reference/',
    '#examples',
    'mailto:guide.md',
  ])('leaves non-source-document link %s unchanged', (href) => {
    expect(
      resolveMarkdownLink(href, '/docs/getting-started/index.md'),
    ).toBe(href);
  });

  // content.config.json maps the docs repository's api-reference/ folder onto
  // /docs/reference. Authors link against the folder they can see, so without
  // the mapping a cross-section link resolves to a route that does not exist.
  it('maps the api-reference source folder onto the published reference section', () => {
    expect(
      resolveMarkdownLink(
        '../api-reference/operators/aggregation/%24limit.md',
        '/docs/getting-started/index.md',
      ),
    ).toBe('/docs/reference/operators/aggregation/%24limit/');
  });

  it('maps api-reference when the link climbs out of the reference section itself', () => {
    expect(
      resolveMarkdownLink(
        '../../../api-reference/commands/query-and-write/find.md',
        '/docs/reference/operators/aggregation/%24search.md',
      ),
    ).toBe('/docs/reference/commands/query-and-write/find/');
  });

  it('leaves sections that publish under their own folder name alone', () => {
    expect(
      resolveMarkdownLink(
        '../postgres-api/functions.md',
        '/docs/getting-started/index.md',
      ),
    ).toBe('/docs/postgres-api/functions/');
  });
});

// The resolver runs inside a client component. NEXT_BASE_PATH is not
// NEXT_PUBLIC_-prefixed, so its value is stripped from the browser bundle:
// anything that reads it here yields a prefixed href during the static render
// and an unprefixed one after hydration, which is invisible in the exported
// HTML and only shows up in a browser. The route must therefore stay
// base-path-relative, and next/link applies the prefix on both sides.
describe('resolveMarkdownLink under a configured base path', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function importWithBasePath(basePath: string) {
    vi.resetModules();
    vi.stubEnv('NEXT_BASE_PATH', basePath);
    return (await import('../app/lib/markdownLinks')).resolveMarkdownLink;
  }

  it('returns an unprefixed route, leaving the base path to next/link', async () => {
    const resolve = await importWithBasePath('/preview');

    expect(resolve('functions.md', '/docs/postgres-api/index.md')).toBe(
      '/docs/postgres-api/functions/',
    );
  });

  it('leaves a mapped cross-section route unprefixed as well', async () => {
    const resolve = await importWithBasePath('/preview');

    expect(
      resolve(
        '../api-reference/operators/aggregation/%24limit.md',
        '/docs/getting-started/index.md',
      ),
    ).toBe('/docs/reference/operators/aggregation/%24limit/');
  });

  it('keeps the query and fragment intact', async () => {
    const resolve = await importWithBasePath('preview');

    expect(
      resolve('python-setup.md?view=full#connect', '/docs/getting-started/index.md'),
    ).toBe('/docs/getting-started/python-setup/?view=full#connect');
  });

  it('leaves links it does not rewrite untouched', async () => {
    const resolve = await importWithBasePath('/preview');

    expect(resolve('#examples', '/docs/getting-started/index.md')).toBe('#examples');
    expect(
      resolve('https://example.com/readme.md', '/docs/getting-started/index.md'),
    ).toBe('https://example.com/readme.md');
  });

  it('produces the same route whether or not a base path is configured', async () => {
    const withPreview = await importWithBasePath('/preview');
    const resolvedWithPreview = withPreview(
      'functions.md',
      '/docs/postgres-api/index.md',
    );

    vi.unstubAllEnvs();
    vi.resetModules();
    const { resolveMarkdownLink: withoutPreview } = await import(
      '../app/lib/markdownLinks'
    );

    expect(resolvedWithPreview).toBe(
      withoutPreview('functions.md', '/docs/postgres-api/index.md'),
    );
  });
});

// A build-level assertion on the exported HTML cannot catch this: the export is
// rendered server-side, where the variable is readable, so the emitted markup
// looks correct and only the hydrated page is wrong. Guard it at the source
// instead, which is where the mistake is actually made.
describe('client-reachable modules and the private base path', () => {
  const clientReachableSources = [
    'app/lib/markdownLinks.ts',
    'app/components/Markdown.tsx',
  ];

  it.each(clientReachableSources)(
    '%s does not read NEXT_BASE_PATH or import sitePath',
    async (relativePath) => {
      const { readFile } = await import('node:fs/promises');
      const { fileURLToPath } = await import('node:url');
      const source = await readFile(
        fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
        'utf8',
      );
      const code = source.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');

      expect(code).not.toContain('NEXT_BASE_PATH');
    },
  );

  // The resolver must give the same route with or without a base path; the
  // renderer may prefix through withBasePath, which reads the public copy.
  it('app/lib/markdownLinks.ts does not import sitePath', async () => {
    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const source = await readFile(
      fileURLToPath(new URL('../app/lib/markdownLinks.ts', import.meta.url)),
      'utf8',
    );
    const code = source.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
    expect(code).not.toContain('sitePath');
    expect(code).not.toContain('withBasePath');
  });
});
