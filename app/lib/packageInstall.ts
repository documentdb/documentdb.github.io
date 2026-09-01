export type AptDistro = "ubuntu24";
export type RpmDistro = "rocky9" | "rhel9";
export type AptArch = "amd64" | "arm64" | "auto";
export type RpmArch = "x86_64" | "aarch64" | "auto";
export type AptPgVersion = "17" | "18";
export type RpmPgVersion = "17" | "18";

export const aptTargetLabels: Record<AptDistro, string> = {
  ubuntu24: "Ubuntu 24.04 (Noble)",
};

export const rpmTargetLabels: Record<RpmDistro, string> = {
  rocky9: "Rocky Linux / AlmaLinux / CentOS Stream 9",
  rhel9: "Red Hat Enterprise Linux 9 (registered)",
};

export const aptTargetPgVersions: Record<AptDistro, AptPgVersion[]> = {
  ubuntu24: ["17", "18"],
};

const aptPgdgSuites: Record<AptDistro, string> = {
  ubuntu24: "noble",
};

const rpmMajorVersions: Record<RpmDistro, "8" | "9"> = {
  rocky9: "9",
  rhel9: "9",
};

const rpmRepositoryPaths: Record<RpmDistro, "rhel9"> = {
  rocky9: "rhel9",
  rhel9: "rhel9",
};

// The website mirrors the official release's Tier-1 package matrix exactly.
export const aptFullStackDistros: readonly AptDistro[] = ["ubuntu24"];
export const rpmFullStackDistros: readonly RpmDistro[] = ["rocky9", "rhel9"];

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
  const repositoryPath = rpmRepositoryPaths[rpmTarget];
  // See buildAptInstallCommand: "auto" resolves on the host so one published
  // example works on x86_64 and aarch64 alike.
  const arch = rpmArch === "auto" ? "$(uname -m)" : rpmArch;
  const installTarget = rpmServesFullStack(rpmTarget, rpmPgVersion)
    ? `documentdb-${rpmPgVersion}`
    : `postgresql${rpmPgVersion}-documentdb`;
  const distributionPrerequisites =
    rpmTarget === "rhel9"
      ? `sudo subscription-manager repos --enable codeready-builder-for-rhel-${rhelMajorVersion}-${arch}-rpms && \\
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-${rhelMajorVersion}.noarch.rpm`
      : `sudo dnf install -y dnf-plugins-core && \\
sudo dnf config-manager --set-enabled crb && \\
sudo dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-${rhelMajorVersion}.noarch.rpm`;

  return `${distributionPrerequisites} && \\
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-${rhelMajorVersion}-${arch}/pgdg-redhat-repo-latest.noarch.rpm && \\
sudo dnf -qy module disable postgresql && \\
sudo rpm --import https://documentdb.io/documentdb-archive-keyring.gpg && \\
printf '%s\\n' \\
  '[documentdb]' \\
  'name=DocumentDB Repository' \\
  'baseurl=https://documentdb.io/rpm/${repositoryPath}' \\
  'enabled=1' \\
  'gpgcheck=1' \\
  'gpgkey=https://documentdb.io/documentdb-archive-keyring.gpg' | sudo tee /etc/yum.repos.d/documentdb.repo >/dev/null && \\
sudo dnf install -y ${installTarget}`;
}

// Shown after a full-stack install: the packages ship a wizard that creates the
// PostgreSQL instance, installs the extensions and starts the gateway, so the
// install command alone does not leave a reachable endpoint.
export function buildSetupCommand(pgVersion: AptPgVersion | RpmPgVersion): string {
  return `sudo documentdb-setup --pg-version ${pgVersion} --use-new-postgres-instance --admin-user admin`;
}
