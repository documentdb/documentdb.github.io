import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import matter from 'gray-matter';
import { load as loadYaml } from 'js-yaml';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Navbar from '../app/components/Navbar';

type Section = 'announcements' | 'blogs';
type Post = { href: string; section: Section; featured: boolean };

const source = path.join(process.cwd(), 'blogs');

function getSection(value: unknown): Section {
  if (value !== 'announcements' && value !== 'blogs') {
    throw new Error(`Invalid post section: ${String(value)}`);
  }
  return value;
}

function getPosts(baseurl: string): Post[] {
  const localPosts = fs.readdirSync(path.join(source, '_posts')).map((file) => {
    const { data } = matter(fs.readFileSync(path.join(source, '_posts', file), 'utf8'));
    const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    return {
      href: `${baseurl}/blogs/posts/${slug}/`,
      section: getSection(data.section ?? 'blogs'),
      featured: data.featured === true,
    };
  });
  const externalPosts: unknown = loadYaml(
    fs.readFileSync(path.join(source, '_data/posts.yml'), 'utf8'),
  );
  if (!Array.isArray(externalPosts)) {
    throw new Error('External posts must be a YAML array');
  }
  const entries: unknown[] = externalPosts;
  return localPosts.concat(entries.map((post) => {
    if (!post || typeof post !== 'object' || !('uri' in post)
      || typeof post.uri !== 'string' || !('section' in post)) {
      throw new Error('External posts must have a URI and section');
    }
    return {
      href: post.uri,
      section: getSection(post.section),
      featured: 'featured' in post && post.featured === true,
    };
  }));
}

describe('main site navigation', () => {
  it('renders separate crawlable links for announcements and blogs', () => {
    const html = renderToStaticMarkup(createElement(Navbar));
    expect(html).toMatch(/<a\b[^>]*href="\/announcements\/"[^>]*><span>Announcements<\/span><\/a>/);
    expect(html).toMatch(/<a\b[^>]*href="\/blogs\/"[^>]*><span>Blogs<\/span><\/a>/);
  });
});

describe.each([
  { baseurl: '', legacy: false },
  { baseurl: '/preview', legacy: false },
  { baseurl: '/preview', legacy: true },
])('Jekyll content sections at "$baseurl" (legacy config: $legacy)', ({ baseurl, legacy }) => {
  let workspace: string;
  let destination: string;
  let posts: Post[];
  const environment = {
    ...process.env,
    NEXT_BASE_PATH: legacy ? undefined : baseurl,
    JEKYLL_BASE_PATH: legacy ? `${baseurl}/blogs/` : undefined,
  };
  const sectionPaths = {
    announcements: '/announcements/',
    blogs: '/blogs/',
  };

  beforeAll(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'documentdb-blog-sections-'));
    destination = path.join(workspace, 'out');
    fs.mkdirSync(path.join(destination, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(destination, 'blogs', 'announcements'), { recursive: true });
    fs.writeFileSync(path.join(destination, 'index.html'), '<h1>Next.js home</h1>');
    fs.writeFileSync(path.join(destination, 'docs', 'index.html'), '<h1>Next.js docs</h1>');
    fs.writeFileSync(path.join(destination, 'blogs', 'announcements', 'index.html'), 'stale nested route');
    execFileSync(process.execPath, [
      path.join(process.cwd(), 'scripts/build-jekyll.mjs'),
    ], {
      cwd: workspace,
      env: environment,
      stdio: 'pipe',
    });
    posts = getPosts(baseurl);
  }, 60_000);

  afterAll(() => {
    if (workspace) fs.rmSync(workspace, { recursive: true, force: true });
  });

  it.each<Section>(['announcements', 'blogs'])('lists only %s, including featured and external posts', (section) => {
    const html = fs.readFileSync(path.join(destination, sectionPaths[section], 'index.html'), 'utf8');
    const cards = [...html.matchAll(/class="post-card\b([^"]*)"\s+href="([^"]+)"/g)];
    const expected = posts.filter((post) => post.section === section);

    expect(expected.length).toBeGreaterThan(0);
    expect(cards.map((card) => card[2]).sort()).toEqual(expected.map((post) => post.href).sort());
    for (const post of expected) {
      const card = cards.find((match) => match[2] === post.href);
      expect(card?.[1].includes('post-card--featured')).toBe(post.featured);
    }
    expect(html).toContain(`<h1 class="blog-hero__title">${section === 'blogs' ? 'Blogs' : 'Announcements'}</h1>`);
    expect(html).toContain(`<link rel="canonical" href="https://documentdb.io${baseurl}${sectionPaths[section]}">`);
    expect(html).toContain(`<a href="${baseurl}/announcements/"${section === 'announcements' ? ' aria-current="page"' : ''}>Announcements</a>`);
    expect(html).toContain(`<a href="${baseurl}/blogs/"${section === 'blogs' ? ' aria-current="page"' : ''}>Blogs</a>`);
    expect(html).toContain(`<link rel="stylesheet" href="${baseurl}/blogs/assets/blog.css">`);
    expect(html).toContain(`<a class="release-bar" href="${baseurl}/v1/">`);
  });

  it('keeps the 1.0 release announcements and their card emphasis in Announcements', () => {
    const announcements = fs.readFileSync(path.join(destination, 'announcements', 'index.html'), 'utf8');
    const blogs = fs.readFileSync(path.join(destination, 'blogs', 'index.html'), 'utf8');
    const cards = [...announcements.matchAll(/class="post-card\b([^"]*)"\s+href="([^"]+)"/g)];
    for (const slug of ['documentdb-1-0', 'documentdb-for-vs-code-1-0', 'kubernetes-operator-versioning']) {
      const href = `${baseurl}/blogs/posts/${slug}/`;
      const card = cards.find((match) => match[2] === href);
      expect(card?.[1]).toContain('post-card--featured');
      expect(card?.[1]).toContain('post-card--release');
      expect(blogs).not.toContain(`href="${href}"`);
    }
    expect(announcements).toContain(`<a class="blog-hero__cta" href="${baseurl}/blogs/posts/documentdb-1-0/">`);
    expect(blogs).not.toContain('class="blog-hero__cta"');
  });

  it('preserves the release article cross-links and VS Code images', () => {
    const release = fs.readFileSync(path.join(destination, 'blogs', 'posts', 'documentdb-1-0', 'index.html'), 'utf8');
    for (const slug of ['documentdb-for-vs-code-1-0', 'kubernetes-operator-versioning', 'versioning']) {
      expect(release).toContain(`href="${baseurl}/blogs/posts/${slug}/"`);
    }
    const vscode = fs.readFileSync(path.join(destination, 'blogs', 'posts', 'documentdb-for-vs-code-1-0', 'index.html'), 'utf8');
    const imageSources = [...vscode.matchAll(/\bsrc="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((src) => src.includes('/blogs/assets/'));
    expect(imageSources).toHaveLength(6);
    for (const src of imageSources) {
      expect(src).toMatch(new RegExp(`^${baseurl}/blogs/assets/`));
      expect(fs.existsSync(path.join(destination, src.slice(baseurl.length)))).toBe(true);
    }
    expect(vscode).toContain(`<meta property="og:image" content="https://documentdb.io${baseurl}/blogs/assets/images/posts/documentdb-for-vs-code-1-0/hero.png">`);
  });

  it('publishes sibling directories without overwriting Next.js pages or retaining the old nested route', () => {
    expect(fs.readFileSync(path.join(destination, 'index.html'), 'utf8')).toBe('<h1>Next.js home</h1>');
    expect(fs.readFileSync(path.join(destination, 'docs', 'index.html'), 'utf8')).toBe('<h1>Next.js docs</h1>');
    expect(fs.existsSync(path.join(destination, 'blogs', 'assets', 'blog.css'))).toBe(true);
    expect(fs.existsSync(path.join(destination, 'blogs', 'announcements'))).toBe(false);
  });

  it('leaves published pages untouched if Jekyll fails', () => {
    const announcementPath = path.join(destination, 'announcements', 'index.html');
    const announcement = fs.readFileSync(announcementPath, 'utf8');
    expect(() => execFileSync(process.execPath, [
      path.join(process.cwd(), 'scripts/build-jekyll.mjs'),
    ], {
      cwd: workspace,
      env: { ...environment, BUNDLE_GEMFILE: path.join(workspace, 'missing-Gemfile') },
      stdio: 'pipe',
    })).toThrow();
    expect(fs.readFileSync(announcementPath, 'utf8')).toBe(announcement);
    expect(fs.readFileSync(path.join(destination, 'index.html'), 'utf8')).toBe('<h1>Next.js home</h1>');
  });

  it('preserves local article URLs and links back to the correct section', () => {
    const localPosts = posts.filter((post) => post.href.startsWith(`${baseurl}/blogs/posts/`));
    for (const post of localPosts) {
      const relativePath = post.href.slice(baseurl.length);
      const html = fs.readFileSync(path.join(destination, relativePath, 'index.html'), 'utf8');
      const backLabel = post.section === 'announcements' ? 'announcements' : 'blog posts';
      expect(html).toContain(`<a href="${baseurl}${sectionPaths[post.section]}">&larr; Back to all ${backLabel}</a>`);
      expect(html).toContain(`<link rel="canonical" href="https://documentdb.io${post.href}">`);
      expect(html).toContain(`<a href="${baseurl}${sectionPaths[post.section]}" aria-current="page">`);
    }
  });

  it('preserves the combined feed for existing subscribers', () => {
    const feed = fs.readFileSync(path.join(destination, 'blogs', 'feed.xml'), 'utf8');
    expect(feed).toContain(`<id>https://documentdb.io${baseurl}/blogs/</id>`);
    expect(feed).toContain(`<link href="https://documentdb.io${baseurl}/blogs/feed.xml" rel="self"/>`);
    for (const post of posts.filter((post) => post.href.startsWith(`${baseurl}/blogs/posts/`))) {
      expect(feed).toContain(`<id>https://documentdb.io${post.href}</id>`);
    }
    expect(feed).not.toContain('<!doctype html>');
  });
});
