import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

async function render(content: string, basePath?: string) {
  vi.resetModules();
  // Pin both variables so an ambient NEXT_BASE_PATH can't leak into the no-base case.
  vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePath ?? '');
  vi.stubEnv('NEXT_BASE_PATH', '');
  const Markdown = (await import('../app/components/Markdown')).default;
  return renderToStaticMarkup(createElement(Markdown, { content, sourcePath: '/docs/getting-started/index.md' }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Markdown root-relative links', () => {
  it('prefixes the base path on a project-page deployment', async () => {
    const html = await render('[a](/docs/documentdb-local#usage-telemetry) [b](/blogs/) [c](https://x.test/y) [d](#here) [e](//cdn.test/z)', '/documentdb.github.io');
    expect(html).toContain('href="/documentdb.github.io/docs/documentdb-local#usage-telemetry"');
    expect(html).toContain('href="/documentdb.github.io/blogs/"');
    expect(html).toContain('href="https://x.test/y"');
    expect(html).toContain('href="#here"');
    expect(html).toContain('href="//cdn.test/z"');
  });

  it('leaves root paths and protocol-relative URLs alone without a base path', async () => {
    const html = await render('[a](/docs/x) [b](//cdn.test/z)');
    expect(html).toContain('href="/docs/x"');
    expect(html).toContain('href="//cdn.test/z"');
  });
});
