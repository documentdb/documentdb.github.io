import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aptServesFullStack,
  aptTargetLabels,
  aptTargetPgVersions,
  buildAptInstallCommand,
  buildRpmInstallCommand,
  buildSetupCommand,
  rpmServesFullStack,
  rpmTargetLabels,
} from '../app/lib/packageInstall';
import type {
  AptArch,
  AptDistro,
  RpmArch,
  RpmDistro,
  RpmPgVersion,
} from '../app/lib/packageInstall';
import {
  FALLBACK_RELEASE,
  parseReleaseInfo,
} from '../app/lib/releaseInfo';

/**
 * These commands are published on /packages for users to copy and paste, so a
 * wrong codename or architecture is a broken install instruction on a public
 * site rather than a failing test somewhere internal. The maps below are
 * duplicated from the implementation on purpose: an accidental edit to the
 * private mapping should have to be made deliberately in two places.
 */
const expectedPgdgSuites: Record<AptDistro, string> = {
  ubuntu24: 'noble',
};

const expectedRhelMajors: Record<RpmDistro, string> = {
  rocky9: '9',
  rhel9: '9',
};

const expectedRpmRepositoryPaths: Record<RpmDistro, string> = {
  rocky9: 'rhel9',
  rhel9: 'rhel9',
};

const aptDistros = Object.keys(aptTargetLabels) as AptDistro[];
const rpmDistros = Object.keys(rpmTargetLabels) as RpmDistro[];
const aptArches: AptArch[] = ['amd64', 'arm64'];
const rpmArches: RpmArch[] = ['x86_64', 'aarch64'];
const rpmPgVersions: RpmPgVersion[] = ['17', '18'];

/** Every APT distro/arch/version combination the packages page can offer. */
const aptMatrix = aptDistros.flatMap((distro) =>
  aptArches.flatMap((arch) =>
    aptTargetPgVersions[distro].map((pg) => ({ distro, arch, pg })),
  ),
);

const rpmMatrix = rpmDistros.flatMap((distro) =>
  rpmArches.flatMap((arch) => rpmPgVersions.map((pg) => ({ distro, arch, pg }))),
);

describe('package metadata', () => {
  it('declares supported PostgreSQL versions for every labelled APT target', () => {
    for (const distro of aptDistros) {
      expect(aptTargetPgVersions[distro], `no versions declared for ${distro}`).toBeDefined();
      expect(aptTargetPgVersions[distro].length).toBeGreaterThan(0);
    }
  });

  it('covers every labelled APT target in the PGDG suite mapping', () => {
    // A target added to the labels without a matching suite would silently
    // produce "deb ... undefined-pgdg main" in a published command.
    expect(Object.keys(expectedPgdgSuites).sort()).toEqual([...aptDistros].sort());
  });
});

describe('release metadata', () => {
  it('uses v1.0-0 for the first paint and feed fallback', () => {
    expect(FALLBACK_RELEASE).toMatchObject({
      tagName: 'v1.0-0',
      aptVersion: '1.0-0',
      rpmVersion: '1.0.0-1.el9',
      metaVersion: '1.0.0',
      metaRpmVersion: '1.0.0-1',
      releaseUrl: 'https://github.com/documentdb/documentdb/releases/tag/v1.0-0',
    });
  });

  it('derives v1.0 package versions from the published asset shapes', () => {
    expect(parseReleaseInfo({
      tag_name: 'v1.0-0',
      html_url: 'https://github.com/documentdb/documentdb/releases/tag/v1.0-0',
      assets: [
        { name: 'ubuntu24.04-documentdb_1.0.0_all.deb' },
        { name: 'ubuntu24.04-postgresql-18-documentdb_1.0-0_amd64.deb' },
        { name: 'documentdb-1.0.0-1.noarch.rpm' },
        { name: 'rhel9-postgresql18-documentdb-1.0.0-1.el9.x86_64.rpm' },
      ],
    })).toMatchObject({
      tagName: 'v1.0-0',
      aptVersion: '1.0-0',
      rpmVersion: '1.0.0-1.el9',
      metaVersion: '1.0.0',
      metaRpmVersion: '1.0.0-1',
    });
  });
});

describe('buildAptInstallCommand', () => {
  it.each(aptMatrix)('produces a complete command for $distro/$arch/pg$pg', ({ distro, arch, pg }) => {
    const command = buildAptInstallCommand(distro, arch, pg);
    // Deliberately not matching "null": these commands legitimately redirect
    // to /dev/null.
    expect(command).not.toMatch(/undefined|NaN/);
  });

  it.each(aptDistros)('uses the correct PGDG suite for %s', (distro) => {
    const command = buildAptInstallCommand(distro, 'amd64', aptTargetPgVersions[distro][0]);
    expect(command).toContain(`/pub/repos/apt ${expectedPgdgSuites[distro]}-pgdg main`);
  });

  it.each(aptArches)('pins the DocumentDB repository to arch %s', (arch) => {
    const command = buildAptInstallCommand('ubuntu24', arch, '17');
    expect(command).toContain(`[arch=${arch} `);
  });

  it('resolves the architecture on the host when arch is "auto"', () => {
    const command = buildAptInstallCommand('ubuntu24', 'auto', '18');
    // The published doc example must be copy-pasteable on amd64 and arm64
    // alike, so it shells out rather than baking in an architecture.
    expect(command).toContain('[arch=$(dpkg --print-architecture) ');
    expect(command).not.toContain('[arch=amd64 ');
    expect(command).not.toContain('[arch=arm64 ');
  });

  it.each(aptDistros)('uses %s as the DocumentDB repository component', (distro) => {
    const command = buildAptInstallCommand(distro, 'amd64', aptTargetPgVersions[distro][0]);
    expect(command).toContain(`documentdb.io/deb stable ${distro}`);
  });

  it.each(aptMatrix)('installs the right package for $distro/$arch/pg$pg', ({ distro, arch, pg }) => {
    const command = buildAptInstallCommand(distro, arch, pg);
    // Since v0.116-0, Tier-1 targets ship the full package set. There the
    // per-major stand-alone pulls the whole stack; everywhere else the
    // repository still serves the extension alone, and offering `documentdb-N`
    // would be an install command that cannot resolve.
    const expected = aptServesFullStack(distro, pg)
      ? `documentdb-${pg}`
      : `postgresql-${pg}-documentdb`;
    expect(command).toContain(`sudo apt install -y ${expected}`);
  });

});

describe('buildRpmInstallCommand', () => {
  it.each(rpmMatrix)('produces a complete command for $distro/$arch/pg$pg', ({ distro, arch, pg }) => {
    const command = buildRpmInstallCommand(distro, arch, pg);
    // Deliberately not matching "null": these commands legitimately redirect
    // to /dev/null.
    expect(command).not.toMatch(/undefined|NaN/);
  });

  it.each(rpmDistros)('derives the EL major version for %s', (distro) => {
    const major = expectedRhelMajors[distro];
    const command = buildRpmInstallCommand(distro, 'x86_64', '17');
    expect(command).toContain(`epel-release-latest-${major}.noarch.rpm`);
    expect(command).toContain(`EL-${major}-x86_64`);
  });

  it.each(rpmArches)('uses arch %s in the PGDG repository name', (arch) => {
    const command = buildRpmInstallCommand('rocky9', arch, '17');
    expect(command).toContain(`EL-9-${arch}/pgdg-redhat-repo-latest.noarch.rpm`);
  });

  it('resolves the architecture on the host when arch is "auto"', () => {
    const command = buildRpmInstallCommand('rhel9', 'auto', '18');
    expect(command).toContain('EL-9-$(uname -m)/pgdg-redhat-repo-latest.noarch.rpm');
    expect(command).toContain('codeready-builder-for-rhel-9-$(uname -m)-rpms');
    expect(command).not.toContain('EL-9-x86_64');
    expect(command).not.toContain('EL-9-aarch64');
  });

  it.each(rpmDistros)('points %s at the shared EL9 DocumentDB repository', (distro) => {
    const command = buildRpmInstallCommand(distro, 'x86_64', '17');
    expect(command).toContain(
      `baseurl=https://documentdb.io/rpm/${expectedRpmRepositoryPaths[distro]}`,
    );
  });

  it.each(rpmMatrix)('installs the right package for $distro/$arch/pg$pg', ({ distro, arch, pg }) => {
    const command = buildRpmInstallCommand(distro, arch, pg);
    const expected = rpmServesFullStack(distro, pg)
      ? `documentdb-${pg}`
      : `postgresql${pg}-documentdb`;
    expect(command).toContain(`sudo dnf install -y ${expected}`);
  });

  it('serves the full stack for every published target', () => {
    expect(rpmServesFullStack('rocky9', '18')).toBe(true);
    expect(rpmServesFullStack('rocky9', '17')).toBe(true);
    expect(rpmServesFullStack('rhel9', '18')).toBe(true);
    expect(rpmServesFullStack('rhel9', '17')).toBe(true);
    expect(aptServesFullStack('ubuntu24', '18')).toBe(true);
    expect(aptServesFullStack('ubuntu24', '17')).toBe(true);
    expect(buildAptInstallCommand('ubuntu24', 'amd64', '18')).toContain(
      'sudo apt install -y documentdb-18',
    );
  });

  it('uses CRB for Rocky, AlmaLinux, and CentOS Stream', () => {
    const command = buildRpmInstallCommand('rocky9', 'x86_64', '18');
    expect(command).toContain('sudo dnf config-manager --set-enabled crb');
    expect(command).not.toContain('subscription-manager repos --enable');
    expect(command).not.toContain('codeready-builder-for-rhel');
  });

  it('switches PGDG to its major-only path on CentOS Stream only', () => {
    const lines = buildRpmInstallCommand('rocky9', 'x86_64', '18')
      .split('\n')
      .filter((l) => l.startsWith('if (. /etc/os-release'));
    // Once before the first dnf call (a repo left by an earlier attempt) and once after PGDG is added.
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(lines[1]);
    expect(buildRpmInstallCommand('rhel9', 'x86_64', '18')).not.toContain('pgdg-redhat-all.repo');
    const baseurl =
      'baseurl=https://download.postgresql.org/pub/repos/yum/18/redhat/rhel-$releasever_major.$releasever_minor-$basearch\n';
    const run = (osRelease: string, withRepo = true) => {
      const dir = mkdtempSync(join(tmpdir(), 'pgdg-'));
      writeFileSync(join(dir, 'os-release'), osRelease);
      if (withRepo) writeFileSync(join(dir, 'pgdg.repo'), baseurl);
      const script = lines[0]
        .replaceAll('/etc/os-release', join(dir, 'os-release'))
        .replaceAll('/etc/yum.repos.d/pgdg-redhat-all.repo', join(dir, 'pgdg.repo'))
        .replace('sudo sed -i ', 'sed -i.bak ')
        .replace(/ && \\$/, '');
      execFileSync('sh', ['-c', script]);
      return withRepo ? readFileSync(join(dir, 'pgdg.repo'), 'utf8') : '';
    };
    const fixed = '/redhat/rhel-$releasever_major-$basearch';
    expect(run('ID=centos\n')).toContain(fixed);
    expect(run('ID="centos"\n')).toContain(fixed);
    expect(run("ID='centos'\n")).toContain(fixed);
    expect(run('ID="rocky"\n')).toBe(baseurl);
    expect(run('ID="centos\n')).toBe(baseurl);
    expect(run('ID="centos"\n', false)).toBe('');
  });

  it('uses subscription-manager for registered RHEL', () => {
    const command = buildRpmInstallCommand('rhel9', 'aarch64', '18');
    expect(command).toContain(
      'sudo subscription-manager repos --enable codeready-builder-for-rhel-9-aarch64-rpms',
    );
    expect(command).not.toContain('dnf config-manager --set-enabled crb');
  });

  it('enables gpgcheck against the DocumentDB signing key', () => {
    const command = buildRpmInstallCommand('rocky9', 'x86_64', '17');
    expect(command).toContain("'gpgcheck=1'");
    expect(command).toContain("'gpgkey=https://documentdb.io/documentdb-archive-keyring.gpg'");
  });
});

describe('buildSetupCommand', () => {
  it.each(['17', '18'] as const)(
    'pins PostgreSQL %s and creates a fresh private instance',
    (pgVersion) => {
      expect(buildSetupCommand(pgVersion)).toBe(
        `sudo documentdb-setup --pg-version ${pgVersion} --use-new-postgres-instance --admin-user admin`,
      );
    },
  );
});
