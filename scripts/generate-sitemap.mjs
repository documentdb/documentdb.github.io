// Generates out/sitemap.xml from the exported site and ensures out/robots.txt
// advertises it. Runs as the last build step, after the Next.js export and the
// Jekyll blogs build have both written into out/.
//
// Deliberately dependency-free (plain node:fs) so it runs in every
// environment the build runs in, including ones without dev dependencies.

import fs from 'node:fs';
import path from 'node:path';

const siteUrl = 'https://documentdb.io';
const outDir = path.join(process.cwd(), 'out');

// Top-level build outputs that are not pages at all: Next.js assets, the
// APT/RPM package repositories, and images. The packages workflow adds deb/
// and rpm/ after this script runs in the deploy job, but they are excluded
// here too so local full builds behave identically. Note that out/packages/ is
// NOT excluded: it is the exported /packages download page; the workflow only
// adds release-info.json (not a page) next to it.
//
// Pages that exist but must not be advertised are handled by isNoindex()
// rather than by name. That covers both forms the not-found route takes - with
// trailingSlash the export writes out/404/index.html alongside out/404.html,
// and the App Router adds out/_not-found/index.html - and anything else the
// framework starts emitting later. Listing a noindex URL is what earns the
// "submitted URL marked noindex" warning in Search Console, and a page already
// states that about itself, so there is no second list to keep in sync.
const excludedTopLevelDirectories = new Set([
  '_next',
  'deb',
  'rpm',
  'images',
]);

let noindexPagesSkipped = 0;
const brokenPages = [];

/**
 * True when the page asks crawlers not to index it. Reads the meta tag in
 * either attribute order and tolerates content lists such as "noindex,nofollow".
 */
function isNoindex(html) {
  return (html.match(/<meta\b[^>]*>/gi) ?? []).some(
    (tag) =>
      /\bname=["']?robots["']?/i.test(tag) &&
      /\bcontent=["'][^"']*\bnoindex\b/i.test(tag),
  );
}

/**
 * Detects a page that rendered as Next's error document rather than as content.
 *
 * A server-side `redirect()` in a statically exported route cannot redirect —
 * there is no server — so Next emits an error document instead. It is served
 * with HTTP 200 and a `<html id="__next_error__">` shell, which means neither a
 * status-code link check nor a crawler can tell it from a real page. Two such
 * routes were listed in this sitemap and linked from live pages before this
 * check existed. Fail the build rather than advertise them again.
 */
function isErrorDocument(html) {
  return /<html[^>]*\bid=["']__next_error__["']/i.test(html);
}

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Walks the export directory and returns one entry per page, where a page is
 * any directory containing an index.html (the shape `trailingSlash: true` and
 * Jekyll's `permalink: pretty` both produce).
 */
function collectPages(directory, relativePath = '') {
  const pages = [];
  const indexFile = path.join(directory, 'index.html');

  if (fs.existsSync(indexFile)) {
    const html = fs.readFileSync(indexFile, 'utf8');
    if (isErrorDocument(html)) {
      brokenPages.push(relativePath === '' ? '/' : `/${relativePath}/`);
    } else if (isNoindex(html)) {
      noindexPagesSkipped += 1;
    } else {
      pages.push({
        url: relativePath === '' ? '/' : `/${relativePath}/`,
        lastModified: fs.statSync(indexFile).mtime,
      });
    }
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (relativePath === '' && excludedTopLevelDirectories.has(entry.name)) continue;

    pages.push(
      ...collectPages(
        path.join(directory, entry.name),
        relativePath === '' ? entry.name : `${relativePath}/${entry.name}`,
      ),
    );
  }

  return pages;
}

if (!fs.existsSync(outDir)) {
  console.error('out/ does not exist - run the site build before the sitemap step.');
  process.exit(1);
}

const pages = collectPages(outDir).sort((a, b) => a.url.localeCompare(b.url));

if (brokenPages.length > 0) {
  console.error(
    [
      'These routes rendered as Next error documents rather than as pages:',
      ...brokenPages.map((url) => `  ${url}`),
      '',
      'They would be served with HTTP 200 and an empty body, so neither a status-code',
      'link check nor a crawler can tell them from real pages. The usual cause is a',
      'server-side redirect() in a statically exported route, which cannot redirect.',
      'Render a page instead (see app/components/MovedNotice.tsx).',
    ].join('\n'),
  );
  process.exit(1);
}

if (pages.length === 0) {
  console.error('No pages found in out/ - refusing to write an empty sitemap.');
  process.exit(1);
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) =>
    [
      '  <url>',
      `    <loc>${xmlEscape(siteUrl + page.url)}</loc>`,
      `    <lastmod>${page.lastModified.toISOString()}</lastmod>`,
      '  </url>',
    ].join('\n'),
  ),
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap);

// Advertise the sitemap from robots.txt. public/robots.txt (when present) has
// already been copied into out/ by the Next.js build; otherwise create a
// minimal one.
const robotsPath = path.join(outDir, 'robots.txt');
const sitemapLine = `Sitemap: ${siteUrl}/sitemap.xml`;

if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  if (!robots.includes(sitemapLine)) {
    fs.writeFileSync(
      robotsPath,
      `${robots.trimEnd()}\n\n${sitemapLine}\n`,
    );
  }
} else {
  fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\n\n${sitemapLine}\n`);
}

console.log(
  `Wrote out/sitemap.xml with ${pages.length} URLs (skipped ${noindexPagesSkipped} noindex ${
    noindexPagesSkipped === 1 ? 'page' : 'pages'
  }) and advertised it in out/robots.txt.`,
);
