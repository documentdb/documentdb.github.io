import {
  aptTargetLabels,
  aptTargetPgVersions,
  rpmTargetLabels,
  rpmServesFullStack,
  type AptArch,
  type AptDistro,
  type AptPgVersion,
  type RpmArch,
  type RpmDistro,
  type RpmPgVersion,
} from "./packageInstall";
import type { ReleaseInfo } from "./releaseInfo";

export type InstallMethod = "packages" | "docker";
export type PackageSelection =
  | { family: "apt"; target: AptDistro; arch: AptArch; pg: AptPgVersion }
  | { family: "rpm"; target: RpmDistro; arch: RpmArch; pg: RpmPgVersion };
export type InstallSelection = { method: InstallMethod; packages: PackageSelection };
export type SelectionResult =
  | { selection: InstallSelection; error: null }
  | { selection: null; error: string };

export const defaultInstallSelection: InstallSelection = {
  method: "packages",
  packages: { family: "apt", target: "ubuntu24", arch: "auto", pg: "18" },
};

export const installQueryKeys = ["method", "family", "target", "pg", "arch"] as const;

function isAptTarget(value: string): value is AptDistro {
  return Object.hasOwn(aptTargetLabels, value);
}

function isRpmTarget(value: string): value is RpmDistro {
  return Object.hasOwn(rpmTargetLabels, value);
}

export function parseInstallSelection(search: string): SelectionResult {
  const params = new URLSearchParams(search);
  if (installQueryKeys.some((key) => params.getAll(key).length > 1)) {
    return { selection: null, error: "This link contains conflicting install choices. Choose your settings below." };
  }
  const method = params.get("method") ?? "packages";
  const family = params.get("family") ?? "apt";
  const pg = params.get("pg") ?? "18";
  const arch = params.get("arch") ?? "auto";
  const target = params.get("target") ?? (family === "rpm" ? "rocky9" : "ubuntu24");

  if (method !== "packages" && method !== "docker") {
    return { selection: null, error: "This install method is not supported. Choose Native Linux or Docker." };
  }
  if (pg !== "17" && pg !== "18") {
    return { selection: null, error: "Native packages are available for PostgreSQL 17 and 18. Choose a supported version." };
  }
  if (family === "apt") {
    if (!isAptTarget(target) || !aptTargetPgVersions[target].includes(pg)) {
      return { selection: null, error: "This APT target is not supported. Choose Ubuntu 24.04." };
    }
    if (arch !== "auto" && arch !== "amd64" && arch !== "arm64") {
      return { selection: null, error: "Choose automatic architecture, amd64, or arm64 for APT." };
    }
    return { selection: { method, packages: { family, target, arch, pg } }, error: null };
  }
  if (family === "rpm") {
    if (!isRpmTarget(target) || !rpmServesFullStack(target, pg)) {
      return { selection: null, error: "This RPM target is not supported. Choose an EL9 distribution below." };
    }
    if (arch !== "auto" && arch !== "x86_64" && arch !== "aarch64") {
      return { selection: null, error: "Choose automatic architecture, x86_64, or aarch64 for RPM." };
    }
    return { selection: { method, packages: { family, target, arch, pg } }, error: null };
  }
  return { selection: null, error: "This package format is not supported. Choose an available Linux distribution." };
}

export function installSelectionQuery(selection: InstallSelection): string {
  const { family, target, pg, arch } = selection.packages;
  return new URLSearchParams({ method: selection.method, family, target, pg, arch }).toString();
}

export function selectInstallTarget(selection: InstallSelection, target: string): SelectionResult {
  const params = new URLSearchParams(installSelectionQuery(selection));
  const family = isAptTarget(target) ? "apt" : isRpmTarget(target) ? "rpm" : null;
  if (!family) {
    return { selection: null, error: "This distribution is not supported. Choose a listed Linux distribution." };
  }
  const previousArch = selection.packages.arch;
  const arch = previousArch === "auto"
    ? "auto"
    : previousArch === "arm64" || previousArch === "aarch64"
      ? family === "apt" ? "arm64" : "aarch64"
      : family === "apt" ? "amd64" : "x86_64";
  params.set("family", family);
  params.set("target", target);
  params.set("arch", arch);
  return parseInstallSelection(params.toString());
}

export function releaseHasPackages(release: ReleaseInfo, selection: PackageSelection): boolean {
  const names = release.assetNames;
  const has = (pattern: RegExp) => names.some((name) => pattern.test(name));
  const { pg, arch, family } = selection;
  if (family === "apt") {
    const arches = arch === "auto" ? ["amd64", "arm64"] : [arch];
    return [`documentdb-${pg}`, "documentdb-common", "documentdb-postgresql-tools"].every(
      (name) => has(new RegExp(`^ubuntu24\\.04-${name}_[^_]+_all\\.deb$`)),
    ) && arches.every((value) =>
      has(new RegExp(`^ubuntu24\\.04-documentdb-gateway_[^_]+_${value}\\.deb$`)) &&
      has(new RegExp(`^ubuntu24\\.04-postgresql-${pg}-documentdb_[^_]+_${value}\\.deb$`)),
    );
  }
  const arches = arch === "auto" ? ["x86_64", "aarch64"] : [arch];
  return [`documentdb-${pg}`, "documentdb-common", "documentdb-postgresql-tools"].every(
    (name) => has(new RegExp(`^${name}-[0-9][^.]*\\..*\\.noarch\\.rpm$`)),
  ) && arches.every((value) =>
    has(new RegExp(`^documentdb-gateway-.*\\.el9\\.${value}\\.rpm$`)) &&
    has(new RegExp(`^rhel9-postgresql${pg}-documentdb-.*\\.el9\\.${value}\\.rpm$`)),
  );
}
