import { describe, expect, it } from 'vitest';
import {
  aptServesFullStack,
  aptTargetLabels,
  aptTargetPgVersions,
  buildAptInstallCommand,
  buildRpmInstallCommand,
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
  rhel9: '9',
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
    // v0.116-0 ships the full package set for Tier-1 targets only. There the
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

  it.each(rpmArches)('uses arch %s in the PGDG and CodeReady repository names', (arch) => {
    const command = buildRpmInstallCommand('rhel9', arch, '17');
    expect(command).toContain(`EL-9-${arch}/pgdg-redhat-repo-latest.noarch.rpm`);
    expect(command).toContain(`codeready-builder-for-rhel-9-${arch}-rpms`);
  });

  it('resolves the architecture on the host when arch is "auto"', () => {
    const command = buildRpmInstallCommand('rhel9', 'auto', '18');
    expect(command).toContain('EL-9-$(uname -m)/pgdg-redhat-repo-latest.noarch.rpm');
    expect(command).toContain('codeready-builder-for-rhel-9-$(uname -m)-rpms');
    expect(command).not.toContain('EL-9-x86_64');
    expect(command).not.toContain('EL-9-aarch64');
  });

  it.each(rpmDistros)('points the DocumentDB repository at rpm/%s', (distro) => {
    const command = buildRpmInstallCommand(distro, 'x86_64', '17');
    expect(command).toContain(`baseurl=https://documentdb.io/rpm/${distro}`);
  });

  it.each(rpmMatrix)('installs the right package for $distro/$arch/pg$pg', ({ distro, arch, pg }) => {
    const command = buildRpmInstallCommand(distro, arch, pg);
    const expected = rpmServesFullStack(distro, pg)
      ? `documentdb-${pg}`
      : `postgresql${pg}-documentdb`;
    expect(command).toContain(`sudo dnf install -y ${expected}`);
  });

  it('serves the full stack for every published target', () => {
    expect(rpmServesFullStack('rhel9', '18')).toBe(true);
    expect(rpmServesFullStack('rhel9', '17')).toBe(true);
    expect(aptServesFullStack('ubuntu24', '18')).toBe(true);
    expect(aptServesFullStack('ubuntu24', '17')).toBe(true);
    expect(buildAptInstallCommand('ubuntu24', 'amd64', '18')).toContain(
      'sudo apt install -y documentdb-18',
    );
  });

  it('enables gpgcheck against the DocumentDB signing key', () => {
    const command = buildRpmInstallCommand('rhel9', 'x86_64', '17');
    expect(command).toContain("'gpgcheck=1'");
    expect(command).toContain("'gpgkey=https://documentdb.io/documentdb-archive-keyring.gpg'");
  });
});
