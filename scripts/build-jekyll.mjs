import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = path.resolve('out');
const sections = ['blogs', 'announcements'];
const legacyBasePath = process.env.JEKYLL_BASE_PATH?.trim()
  .replace(/^\/+|\/+$/g, '').replace(/(?:^|\/)blogs$/, '');
const rawBasePath = process.env.NEXT_BASE_PATH?.trim() ?? legacyBasePath ?? '';
const basePath = rawBasePath ? `/${rawBasePath.replace(/^\/+|\/+$/g, '')}` : '';
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'documentdb-jekyll-'));

try {
  const source = path.join(temporaryDirectory, 'source');
  const destination = path.join(temporaryDirectory, 'site');
  fs.mkdirSync(source);
  for (const section of sections) {
    fs.cpSync(path.join(repositoryRoot, section), path.join(source, section), { recursive: true });
  }

  const result = spawnSync('bundle', [
    'exec', 'jekyll', 'build',
    '--config', path.join(repositoryRoot, 'blogs/_config.yml'),
    '--source', source,
    '--destination', destination,
    '--baseurl', basePath,
    '--disable-disk-cache',
  ], { cwd: repositoryRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Jekyll build failed (${result.signal ?? result.status})`);
  }

  for (const section of sections) {
    if (!fs.existsSync(path.join(destination, section, 'index.html'))) {
      throw new Error(`Jekyll did not generate /${section}/index.html`);
    }
  }

  // Jekyll cleans its destination; publish only its sections to preserve the Next.js export.
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const section of sections) {
    const target = path.join(outputDirectory, section);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(path.join(destination, section), target, { recursive: true });
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
