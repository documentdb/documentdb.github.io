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

// Top-level build outputs that are not HTML pages: Next.js assets, the APT/RPM
// package repositories, release metadata, and images. The packages workflow
// adds deb/, rpm/, and packages/ after this script runs in the deploy job, but
// they are excluded here too so local full builds behave identically.
const excludedTopLevelDirectories = new Set([
  '_next',
  'deb',
  'rpm',
  'packages',
  'images',
]);

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
    pages.push({
      url: relativePath === '' ? '/' : `/${relativePath}/`,
      lastModified: fs.statSync(indexFile).mtime,
    });
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

console.log(`Wrote out/sitemap.xml with ${pages.length} URLs and advertised it in out/robots.txt.`);
