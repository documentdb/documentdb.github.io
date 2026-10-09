import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// v0.117-0 ships no installer; RC2's installs from the stable repository.
// Release assets can be replaced, so the digest is pinned too.
export const installerSource = {
  release: 'v1.0-RC2',
  sha256: 'b9d16b3b86d3b1541e701be0ce38086dcb0bc904f761a36c7ede9fefe91d45f2',
};

export async function publishInstaller(outputDirectory = 'out') {
  if (!/^v\d[\w.-]*$/.test(installerSource.release) ||
      !/^[a-f0-9]{64}$/.test(installerSource.sha256)) {
    throw new Error('Installer source must name a release tag and SHA256');
  }
  const url = `https://github.com/documentdb/documentdb/releases/download/${installerSource.release}/install.sh`;
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    throw new Error(`Installer download failed: HTTP ${response.status}`);
  }
  const script = Buffer.from(await response.arrayBuffer());
  const digest = createHash('sha256').update(script).digest('hex');
  if (digest !== installerSource.sha256) {
    throw new Error(`Installer checksum mismatch: ${digest}`);
  }
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(resolve(outputDirectory, 'install.sh'), script);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await publishInstaller();
}
