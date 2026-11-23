import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { agentKitRevision, agentKitUrl, galleryRevision, samplePrompts } from '../app/components/campaign/promptContent';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function render(basePath = '') {
  vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePath);
  vi.stubEnv('NEXT_BASE_PATH', '');
  const page = await import('../app/campaigns/landing/page');
  return { html: renderToStaticMarkup(createElement(page.default)), metadata: page.metadata };
}

describe('agent landing page', () => {
  it('publishes the standalone landing path without an experiment variant', async () => {
    const { html, metadata } = await render();
    expect(metadata.alternates?.canonical).toBe('/campaigns/landing/');
    expect(metadata.openGraph?.url).toBe('/campaigns/landing/');
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(html).not.toContain('/campaigns/sample/');
    expect(html).not.toContain('data-tracker-config');
    expect(html).not.toContain('data-tracking');
  });

  it('starts with the article summary, tutorial, and a paused poster', async () => {
    const { html } = await render();
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('data-carousel-slide="starter"');
    expect(html).toContain('Why are there so many document databases?');
    expect(html).toContain('Getting-started tutorial');
    expect(html).toContain('data-mode="poster"');
    expect(html).toContain('data-playing="false"');
    expect(html).toContain('src="/images/campaign-film-poster.webp"');
    expect(html).not.toContain('<canvas');
  });

  it('retains both tested application prompts and the published Agent-Kit source', async () => {
    const { html } = await render();
    for (const sample of samplePrompts) {
      expect(html).toContain(`id="tab-${sample.id}"`);
      expect(sample.prompt).toContain(`Clone ${agentKitUrl}`);
      expect(sample.prompt).toContain(agentKitRevision);
      expect(sample.prompt).toContain(galleryRevision);
    }
    expect(html).not.toMatch(/coming soon/i);
  });

  it('preserves the four folded links and static-subpath asset URLs', async () => {
    const { html } = await render('/preview');
    const nav = html.match(/<nav aria-label="Explore DocumentDB"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(nav).toContain('hidden=""');
    expect([...nav.matchAll(/<a href="([^"]+)"/g)].map(match => match[1])).toEqual([
      '/preview/why-document-databases/',
      '/preview/docs/getting-started/',
      '/preview/packages/',
      agentKitUrl,
    ]);
    expect(html).toContain('src="/preview/images/campaign-film-poster.webp"');
  });
});

describe('local document database article', () => {
  it('renders the polished article and its website tutorial link', async () => {
    const article = await import('../app/why-document-databases/page');
    const html = renderToStaticMarkup(createElement(article.default));
    expect(article.metadata.alternates?.canonical).toBe('/why-document-databases/');
    expect(html).toContain('Why are there so many document databases?');
    expect(html.match(/<table/g)).toHaveLength(3);
    expect(html).toContain('href="/docs/getting-started/"');
  });
});
