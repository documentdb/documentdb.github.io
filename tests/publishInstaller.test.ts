import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { installerSource, publishInstaller } from '../scripts/publish-installer.mjs';

const originalSource = { ...installerSource };
const directories: string[] = [];
const script = '#!/bin/sh\nprintf "installer fixture\\n"\n';

async function outputDirectory() {
  const directory = await mkdtemp(path.join(tmpdir(), 'documentdb-installer-'));
  directories.push(directory);
  return directory;
}

afterEach(async () => {
  Object.assign(installerSource, originalSource);
  vi.unstubAllGlobals();
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('published installer', () => {
  it('pins a release tag and checksum', () => {
    expect(installerSource.release).toMatch(/^v\d/);
    expect(installerSource.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('publishes the verified bytes without changing the execution barrier', async () => {
    installerSource.release = 'v9.9-0';
    installerSource.sha256 = createHash('sha256').update(script).digest('hex');
    const download = vi.fn().mockResolvedValue(new Response(script));
    vi.stubGlobal('fetch', download);
    const directory = await outputDirectory();
    await publishInstaller(directory);
    expect(await readFile(path.join(directory, 'install.sh'), 'utf8')).toBe(script);
    expect(download.mock.calls[0][0]).toBe(
      'https://github.com/documentdb/documentdb/releases/download/v9.9-0/install.sh',
    );
  });

  it.each(['HTTP error', 'checksum mismatch', 'network error'])('refuses %s without publishing', async (failure) => {
    installerSource.release = 'v9.9-0';
    installerSource.sha256 = '0'.repeat(64);
    const download = vi.fn();
    if (failure === 'network error') {
      download.mockRejectedValue(new Error('network error'));
    } else {
      download.mockResolvedValue(new Response(script, { status: failure === 'HTTP error' ? 404 : 200 }));
    }
    vi.stubGlobal('fetch', download);
    const directory = await outputDirectory();
    await expect(publishInstaller(directory)).rejects.toThrow();
    await expect(readFile(path.join(directory, 'install.sh'))).rejects.toThrow();
  });

  it('rejects a moving source reference before downloading', async () => {
    installerSource.release = 'latest';
    const download = vi.fn();
    vi.stubGlobal('fetch', download);
    await expect(publishInstaller(await outputDirectory())).rejects.toThrow('release tag');
    expect(download).not.toHaveBeenCalled();
  });
});
