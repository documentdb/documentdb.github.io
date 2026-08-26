export type AptDistro = "ubuntu22" | "ubuntu24" | "deb11" | "deb12" | "deb13";
export type RpmDistro = "rhel8" | "rhel9";
export type AptArch = "amd64" | "arm64" | "auto";
export type RpmArch = "x86_64" | "aarch64" | "auto";
export type AptPgVersion = "16" | "17" | "18";
export type RpmPgVersion = "16" | "17" | "18";

export const aptTargetLabels: Record<AptDistro, string> = {
  ubuntu22: "Ubuntu 22.04 (Jammy)",
  ubuntu24: "Ubuntu 24.04 (Noble)",
  deb11: "Debian 11 (Bullseye)",
  deb12: "Debian 12 (Bookworm)",
  deb13: "Debian 13 (Trixie)",
};

export const rpmTargetLabels: Record<RpmDistro, string> = {
  rhel8: "RHEL-compatible 8 (tested on Rocky Linux 8)",
  rhel9: "RHEL-compatible 9 (tested on Rocky Linux 9)",
};

export const aptTargetPgVersions: Record<AptDistro, AptPgVersion[]> = {
  ubuntu22: ["16", "17", "18"],
  ubuntu24: ["16", "17", "18"],
  deb11: ["16", "17"],
  deb12: ["16", "17", "18"],
  deb13: ["16", "17", "18"],
};

const aptPgdgSuites: Record<AptDistro, string> = {
  ubuntu22: "jammy",
  ubuntu24: "noble",
  deb11: "bullseye",
  deb12: "bookworm",
  deb13: "trixie",
};

const rpmMajorVersions: Record<RpmDistro, "8" | "9"> = {
  rhel8: "8",
  rhel9: "9",
};

// Distributions where the repository serves the full v0.116-0 package set
// (`documentdb` meta, `documentdb-N`, `documentdb-common`, `documentdb-gateway`,
// `documentdb-postgresql-tools`) rather than the extension package alone.
// v0.116-0 ships Tier-1 only, so everywhere else still resolves the older
// extension-only release and must keep the `postgresql-N-documentdb` command.
export const aptFullStackDistros: readonly AptDistro[] = ["ubuntu24"];
export const rpmFullStackDistros: readonly RpmDistro[] = ["rhel9"];

// The stand-alone packages exist only for the majors the full stack was built
// for. PostgreSQL 16 resolves the older extension-only build even on a
// full-stack distribution, so it must not be offered the stand-alone command.
const fullStackPgVersions = ["17", "18"];

export function aptServesFullStack(
  aptTarget: AptDistro,
  aptPgVersion: AptPgVersion,
): boolean {
  return (
    aptFullStackDistros.includes(aptTarget) &&
    fullStackPgVersions.includes(aptPgVersion)
  );
}

export function rpmServesFullStack(
  rpmTarget: RpmDistro,
  rpmPgVersion: RpmPgVersion,
): boolean {
  return (
    rpmFullStackDistros.includes(rpmTarget) &&
    fullStackPgVersions.includes(rpmPgVersion)
  );
}

export function buildAptInstallCommand(
  aptTarget: AptDistro,
  aptArch: AptArch,
  aptPgVersion: AptPgVersion,
): string {
  const pgdgSuite = aptPgdgSuites[aptTarget];
  // "auto" resolves the architecture on the host running the command, so a
  // single published example is copy-pasteable on both amd64 and arm64. The
  // Package Finder passes a literal architecture, because there the user has
  // chosen one explicitly.
  const arch = aptArch === "auto" ? "$(dpkg --print-architecture)" : aptArch;
  // `documentdb-N` pulls the whole stack (extension + gateway + tools +
  // documentdb-common) and owns the systemd lifecycle for that major.
  const installTarget = aptServesFullStack(aptTarget, aptPgVersion)
    ? `documentdb-${aptPgVersion}`
    : `postgresql-${aptPgVersion}-documentdb`;

  return `sudo apt update && \\
sudo apt install -y curl ca-certificates gnupg && \\
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql.gpg && \\
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt ${pgdgSuite}-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null && \\
curl -fsSL https://documentdb.io/documentdb-archive-keyring.gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/documentdb-archive-keyring.gpg && \\
echo "deb [arch=${arch} signed-by=/usr/share/keyrings/documentdb-archive-keyring.gpg] https://documentdb.io/deb stable ${aptTarget}" | sudo tee /etc/apt/sources.list.d/documentdb.list >/dev/null && \\
sudo apt update && \\
sudo apt install -y ${installTarget}`;
}

export function buildRpmInstallCommand(
  rpmTarget: RpmDistro,
  rpmArch: RpmArch,
  rpmPgVersion: RpmPgVersion,
): string {
  const rhelMajorVersion = rpmMajorVersions[rpmTarget];
  // See buildAptInstallCommand: "auto" resolves on the host so one published
  // example works on x86_64 and aarch64 alike.
  const arch = rpmArch === "auto" ? "$(uname -m)" : rpmArch;
  const installTarget = rpmServesFullStack(rpmTarget, rpmPgVersion)
    ? `documentdb-${rpmPgVersion}`
    : `postgresql${rpmPgVersion}-documentdb`;

  return `sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-${rhelMajorVersion}.noarch.rpm && \\
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-${rhelMajorVersion}-${arch}/pgdg-redhat-repo-latest.noarch.rpm && \\
sudo dnf -qy module disable postgresql && \\
sudo dnf install -y dnf-plugins-core && \\
(sudo dnf config-manager --set-enabled crb || \\
 sudo dnf config-manager --set-enabled powertools || \\
 sudo dnf config-manager --set-enabled codeready-builder-for-rhel-${rhelMajorVersion}-${arch}-rpms) && \\
sudo rpm --import https://documentdb.io/documentdb-archive-keyring.gpg && \\
printf '%s\\n' \\
  '[documentdb]' \\
  'name=DocumentDB Repository' \\
  'baseurl=https://documentdb.io/rpm/${rpmTarget}' \\
  'enabled=1' \\
  'gpgcheck=1' \\
  'gpgkey=https://documentdb.io/documentdb-archive-keyring.gpg' | sudo tee /etc/yum.repos.d/documentdb.repo >/dev/null && \\
sudo dnf install -y ${installTarget}`;
}

// Shown after a full-stack install: the packages ship a wizard that creates the
// PostgreSQL instance, installs the extensions and starts the gateway, so the
// install command alone does not leave a reachable endpoint.
export function buildSetupCommand(): string {
  return `sudo documentdb-setup --admin-user admin`;
}
