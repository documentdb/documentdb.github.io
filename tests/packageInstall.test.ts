import { describe, expect, it } from 'vitest';
import {
  aptTargetLabels,
  aptTargetPgVersions,
  buildAptInstallCommand,
  buildRpmInstallCommand,
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
  ubuntu22: 'jammy',
  ubuntu24: 'noble',
  deb11: 'bullseye',
  deb12: 'bookworm',
  deb13: 'trixie',
};

const expectedRhelMajors: Record<RpmDistro, string> = {
  rhel8: '8',
  rhel9: '9',
};

const aptDistros = Object.keys(aptTargetLabels) as AptDistro[];
const rpmDistros = Object.keys(rpmTargetLabels) as RpmDistro[];
const aptArches: AptArch[] = ['amd64', 'arm64'];
const rpmArches: RpmArch[] = ['x86_64', 'aarch64'];
const rpmPgVersions: RpmPgVersion[] = ['16', '17', '18'];

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
    const command = buildAptInstallCommand('ubuntu24', arch, '16');
    expect(command).toContain(`[arch=${arch} `);
  });

  it.each(aptDistros)('uses %s as the DocumentDB repository component', (distro) => {
    const command = buildAptInstallCommand(distro, 'amd64', aptTargetPgVersions[distro][0]);
    expect(command).toContain(`documentdb.io/deb stable ${distro}`);
  });

  it.each(aptMatrix)('installs postgresql-$pg-documentdb for $distro/$arch', ({ distro, arch, pg }) => {
    const command = buildAptInstallCommand(distro, arch, pg);
    expect(command).toContain(`sudo apt install -y postgresql-${pg}-documentdb`);
  });

  it('does not offer PostgreSQL 18 on Debian 11', () => {
    // Documented on the packages page: PGDG bullseye resolves 16 and 17 only.
    expect(aptTargetPgVersions.deb11).not.toContain('18');
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
    const command = buildRpmInstallCommand(distro, 'x86_64', '16');
    expect(command).toContain(`epel-release-latest-${major}.noarch.rpm`);
    expect(command).toContain(`EL-${major}-x86_64`);
  });

  it.each(rpmArches)('uses arch %s in the PGDG and CodeReady repository names', (arch) => {
    const command = buildRpmInstallCommand('rhel9', arch, '16');
    expect(command).toContain(`EL-9-${arch}/pgdg-redhat-repo-latest.noarch.rpm`);
    expect(command).toContain(`codeready-builder-for-rhel-9-${arch}-rpms`);
  });

  it.each(rpmDistros)('points the DocumentDB repository at rpm/%s', (distro) => {
    const command = buildRpmInstallCommand(distro, 'x86_64', '16');
    expect(command).toContain(`baseurl=https://documentdb.io/rpm/${distro}`);
  });

  it.each(rpmMatrix)('installs postgresql$pg-documentdb for $distro/$arch', ({ distro, arch, pg }) => {
    const command = buildRpmInstallCommand(distro, arch, pg);
    expect(command).toContain(`sudo dnf install -y postgresql${pg}-documentdb`);
  });

  it('enables gpgcheck against the DocumentDB signing key', () => {
    const command = buildRpmInstallCommand('rhel9', 'x86_64', '16');
    expect(command).toContain("'gpgcheck=1'");
    expect(command).toContain("'gpgkey=https://documentdb.io/documentdb-archive-keyring.gpg'");
  });
});
