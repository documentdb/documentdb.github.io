import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directories: string[] = [];
const generator = path.resolve('scripts/generate-sitemap.mjs');
const rootSitemap = 'Sitemap: https://documentdb.io/sitemap.xml';
const operatorSitemap = 'Sitemap: https://documentdb.io/documentdb-kubernetes-operator/latest/sitemap.xml';

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('operator sitemap discovery', () => {
  it.each([false, true])('advertises both sitemaps with existing robots=%s', async (existingRobots) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'documentdb-sitemap-'));
    directories.push(directory);
    const out = path.join(directory, 'out');
    await mkdir(out);
    await writeFile(path.join(out, 'index.html'), '<html><body>DocumentDB</body></html>');
    if (existingRobots) {
      await writeFile(path.join(out, 'robots.txt'), `User-agent: *\nDisallow: /private/\n\n${rootSitemap}\n`);
    }
    execFileSync(process.execPath, [generator], { cwd: directory });
    const robots = await readFile(path.join(out, 'robots.txt'), 'utf8');
    expect(robots.split('\n').filter((line) => line === rootSitemap)).toHaveLength(1);
    expect(robots.split('\n').filter((line) => line === operatorSitemap)).toHaveLength(1);
    if (existingRobots) {
      expect(robots).toContain('Disallow: /private/');
    }
    execFileSync(process.execPath, [generator], { cwd: directory });
    expect(await readFile(path.join(out, 'robots.txt'), 'utf8')).toBe(robots);
    expect(await readFile(path.join(out, 'sitemap.xml'), 'utf8')).toContain('<loc>https://documentdb.io/</loc>');
  });
});
