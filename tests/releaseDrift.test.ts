import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { FALLBACK_RELEASES, type ReleaseInfo } from '../app/lib/releaseInfo';

const script = fileURLToPath(new URL('../.github/scripts/check_release_drift.js', import.meta.url));
const releaseInfoSource = fileURLToPath(new URL('../app/lib/releaseInfo.ts', import.meta.url));
const directories: string[] = [];

// The feed a deploy writes for a release, reduced to the assets the check reads.
function feed({ tagName, aptVersion, rpmVersion, metaVersion }: Pick<ReleaseInfo, 'tagName' | 'aptVersion' | 'rpmVersion' | 'metaVersion'>) {
  return {
    tag_name: tagName,
    assets: [
      `ubuntu24.04-documentdb_${metaVersion}_all.deb`,
      `ubuntu24.04-postgresql-18-documentdb_${aptVersion}_amd64.deb`,
      `rhel9-postgresql18-documentdb-${rpmVersion}.x86_64.rpm`,
    ].map((name) => ({ name })),
  };
}

// Runs the check from a scratch checkout holding the real fallbacks and the given feeds.
function checkDrift(feeds: { latest?: object; stable?: object }) {
  const root = mkdtempSync(path.join(tmpdir(), 'release-drift-'));
  directories.push(root);
  mkdirSync(path.join(root, 'app', 'lib'), { recursive: true });
  copyFileSync(releaseInfoSource, path.join(root, 'app', 'lib', 'releaseInfo.ts'));
  mkdirSync(path.join(root, 'out', 'packages'), { recursive: true });
  if (feeds.latest) writeFileSync(path.join(root, 'out', 'packages', 'release-info-latest.json'), JSON.stringify(feeds.latest));
  if (feeds.stable) writeFileSync(path.join(root, 'out', 'packages', 'release-info.json'), JSON.stringify(feeds.stable));
  const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('release drift check', () => {
  const latest = feed(FALLBACK_RELEASES.latest);
  const stable = feed(FALLBACK_RELEASES.stable);

  it('passes when each fallback names the release its channel mirrors', () => {
    const { status, output } = checkDrift({ latest, stable });
    expect(output).toContain('The latest fallback matches the mirrored release (v1.2-0).');
    expect(output).toContain('The stable fallback matches the mirrored release (v1.0-0).');
    expect(status).toBe(0);
  });

  it('skips a site-only build with no feeds', () => {
    const { status, output } = checkDrift({});
    expect(output).toContain('skipping release drift check');
    expect(status).toBe(0);
  });

  it.each(['latest', 'stable'] as const)('fails when only the %s feed was built', (channel) => {
    const { status, output } = checkDrift({ [channel]: channel === 'latest' ? latest : stable });
    expect(output).toContain('is missing');
    expect(status).toBe(1);
  });

  it('fails when stable moves to 1.2 but its fallback still names 1.0', () => {
    const { status, output } = checkDrift({ latest, stable: latest });
    expect(output).toContain("the site's stable fallback release does not match");
    expect(output).toContain('FALLBACK_RELEASES.stable): v1.0-0');
    expect(output).not.toContain("the site's latest fallback release does not match");
    expect(status).toBe(1);
  });

  it('fails when latest moves on but its fallback does not', () => {
    const next = feed({ tagName: 'v1.3-0', aptVersion: '1.3-0', rpmVersion: '1.3.0-1.el9', metaVersion: '1.3.0' });
    const { status, output } = checkDrift({ latest: next, stable });
    expect(output).toContain("the site's latest fallback release does not match");
    expect(output).toContain('The stable fallback matches the mirrored release (v1.0-0).');
    expect(status).toBe(1);
  });

  it('fails when a rebuilt release ships package versions the fallback does not name', () => {
    const rebuilt = feed({ ...FALLBACK_RELEASES.latest, aptVersion: '1.2-1' });
    const { status, output } = checkDrift({ latest: rebuilt, stable });
    expect(output).toContain('FALLBACK_RELEASES.latest.aptVersion is "1.2-0" but v1.2-0 ships "1.2-1".');
    expect(status).toBe(1);
  });

  it('fails when a feed has no tag', () => {
    const { status, output } = checkDrift({ latest: { assets: [] }, stable });
    expect(output).toContain('has no tag_name');
    expect(status).toBe(1);
  });
});
