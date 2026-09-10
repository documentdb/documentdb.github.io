import { describe, expect, it } from "vitest";
import {
  defaultInstallSelection,
  installSelectionQuery,
  parseInstallSelection,
  releaseHasPackages,
  selectInstallTarget,
} from "../app/lib/installSelection";
import { FALLBACK_RELEASE, parseReleaseInfo } from "../app/lib/releaseInfo";

describe("install selection links", () => {
  it("defaults to the complete native PG18 stack with host-resolved architecture", () => {
    expect(parseInstallSelection("")).toEqual({ selection: defaultInstallSelection, error: null });
  });

  it.each(["docker", "packages"])("opens the explicitly linked %s method", (method) => {
    expect(parseInstallSelection(`?method=${method}`).selection?.method).toBe(method);
  });

  it.each([
    "method=packages&family=apt&target=ubuntu24&pg=17&arch=arm64",
    "method=packages&family=rpm&target=rhel9&pg=18&arch=aarch64",
    "method=docker&family=rpm&target=rocky9&pg=17&arch=auto",
  ])("round-trips all choices in %s", (query) => {
    const result = parseInstallSelection(query);
    expect(result.error).toBeNull();
    if (!result.selection) throw new Error("Expected a valid selection");
    expect(parseInstallSelection(installSelectionQuery(result.selection))).toEqual(result);
  });

  it.each([
    "method=other",
    "family=unknown",
    "pg=15",
    "pg=16",
    "pg=19",
    "arch=i386",
    "target=ubuntu22",
    "target=rocky9",
    "family=rpm&arch=amd64",
    "family=rpm&target=rhel8",
    "method=docker&method=packages",
    "pg=17&pg=18",
    "target=__proto__",
    "target=constructor",
    "arch=%24%28touch%20anything%29",
  ])("rejects unsupported or ambiguous choices without a usable command target: %s", (query) => {
    expect(parseInstallSelection(query)).toEqual({
      selection: null,
      error: expect.any(String),
    });
  });

  it("allows campaign parameters without treating them as install choices", () => {
    expect(parseInstallSelection("?utm_source=blog&method=packages").selection).toEqual(defaultInstallSelection);
  });

  it("preserves major and CPU family when switching distributions", () => {
    const initial = parseInstallSelection("pg=17&arch=arm64").selection;
    if (!initial) throw new Error("Expected a valid selection");
    const rpm = selectInstallTarget(initial, "rhel9");
    expect(rpm.selection?.packages).toEqual({ family: "rpm", target: "rhel9", arch: "aarch64", pg: "17" });
    if (!rpm.selection) throw new Error("Expected an RPM selection");
    expect(selectInstallTarget(rpm.selection, "ubuntu24").selection).toEqual(initial);
  });

  it("keeps automatic architecture and rejects unknown distributions", () => {
    expect(selectInstallTarget(defaultInstallSelection, "rocky9").selection?.packages.arch).toBe("auto");
    expect(selectInstallTarget(defaultInstallSelection, "other").selection).toBeNull();
  });
});

describe("published package availability", () => {
  const assetNames = [
    ...["documentdb-18", "documentdb-common", "documentdb-postgresql-tools"].flatMap((name) => [
      `ubuntu24.04-${name}_0.117.0_all.deb`,
      `${name}-0.117.0-1.noarch.rpm`,
    ]),
    ...["amd64", "arm64"].flatMap((arch) => [
      `ubuntu24.04-documentdb-gateway_0.117.0_${arch}.deb`,
      `ubuntu24.04-postgresql-18-documentdb_0.117-0_${arch}.deb`,
    ]),
    ...["x86_64", "aarch64"].flatMap((arch) => [
      `documentdb-gateway-0.117.0-1.el9.${arch}.rpm`,
      `rhel9-postgresql18-documentdb-0.117.0-1.el9.${arch}.rpm`,
    ]),
  ];
  const release = { ...FALLBACK_RELEASE, assetNames };

  it("requires the full stack, including both architectures for automatic selection", () => {
    expect(releaseHasPackages(release, defaultInstallSelection.packages)).toBe(true);
    expect(releaseHasPackages(release, { family: "rpm", target: "rhel9", arch: "auto", pg: "18" })).toBe(true);
    expect(releaseHasPackages(FALLBACK_RELEASE, defaultInstallSelection.packages)).toBe(false);
    expect(releaseHasPackages(release, { family: "apt", target: "ubuntu24", arch: "amd64", pg: "17" })).toBe(false);
  });

  it.each(assetNames)("does not advertise a complete automatic install without %s", (missing) => {
    const partial = { ...release, assetNames: assetNames.filter((name) => name !== missing) };
    const selection = missing.endsWith(".deb")
      ? defaultInstallSelection.packages
      : { family: "rpm" as const, target: "rocky9" as const, arch: "auto" as const, pg: "18" as const };
    expect(releaseHasPackages(partial, selection)).toBe(false);
  });

  it("allows a specific shipped architecture when the other one is missing", () => {
    const partial = { ...release, assetNames: assetNames.filter((name) => !name.includes("_arm64.deb")) };
    expect(releaseHasPackages(partial, { family: "apt", target: "ubuntu24", arch: "amd64", pg: "18" })).toBe(true);
    expect(releaseHasPackages(partial, defaultInstallSelection.packages)).toBe(false);
  });

  it.each([null, {}, { tag_name: "v0.117-0", assets: [] }, { tag_name: "../other", assets: [] }])(
    "surfaces malformed or incomplete metadata instead of inventing current versions",
    (payload) => {
      expect(() => parseReleaseInfo(payload)).toThrow();
    },
  );
});
