"use client";

import { useEffect, useState } from "react";

// The site publishes out/packages/release-info.json on every deployment, built
// from the GitHub release the package repository actually mirrors. It is the
// only authoritative statement of "what version is on documentdb.io", so the
// UI derives its version strings from it rather than repeating them.
//
// Before this module the versions were hardcoded in the page, and they drifted:
// the page still advertised 0.114-0 (and 0.113-0 for the repository examples)
// after v0.116-0 had been published and mirrored.

export type ReleaseInfo = {
  /** Git tag of the mirrored release, e.g. "v0.116-0". */
  tagName: string;
  /** Extension package version on DEB, e.g. "0.116-0". */
  aptVersion: string;
  /** Extension package version on RPM, e.g. "0.116.0-1.el9". */
  rpmVersion: string;
  /**
   * Version of every non-extension package, e.g. "0.116.0".
   *
   * The extension keeps the control-file form (`0.116-0`) while the meta,
   * per-major, gateway, tools and common packages use the flat dotted form.
   * Pinning examples MUST pick the right one for the package being pinned:
   * `apt install documentdb-18=0.116-0` fails with "Version '0.116-0' for
   * 'documentdb-18' was not found", because that package is `0.116.0`.
   */
  metaVersion: string;
  /** RPM form of the non-extension packages, e.g. "0.116.0-1". */
  metaRpmVersion: string;
  releaseUrl: string;
  assetNames: readonly string[];
};

// Used until the fetch resolves, and permanently if it fails. A stale-but-valid
// page is much better than a blank one, so this is a real release rather than a
// placeholder. Keep it in step with the newest release; the drift check in CI
// fails the build when it falls behind release-info.json.
export const FALLBACK_RELEASE: ReleaseInfo = {
  tagName: "v0.116-0",
  aptVersion: "0.116-0",
  rpmVersion: "0.116.0-1.el9",
  metaVersion: "0.116.0",
  metaRpmVersion: "0.116.0-1",
  releaseUrl: "https://github.com/documentdb/documentdb/releases/tag/v0.116-0",
  assetNames: [],
};

type RawReleaseInfo = {
  tag_name?: unknown;
  html_url?: unknown;
  assets?: unknown;
};

function assetNamesOf(raw: RawReleaseInfo): string[] {
  if (!Array.isArray(raw.assets)) {
    return [];
  }
  return raw.assets
    .map((asset) =>
      asset && typeof asset === "object" && typeof (asset as { name?: unknown }).name === "string"
        ? (asset as { name: string }).name
        : null,
    )
    .filter((name): name is string => name !== null);
}

function firstMatch(names: readonly string[], pattern: RegExp): string | null {
  for (const name of names) {
    const match = pattern.exec(name);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Derives the display versions from a release-info.json payload.
 *
 * Each field falls back independently: a release that stops shipping one
 * package shape must not blank out the versions that are still present.
 */
export function parseReleaseInfo(payload: unknown): ReleaseInfo {
  if (!payload || typeof payload !== "object") {
    return FALLBACK_RELEASE;
  }
  const raw = payload as RawReleaseInfo;
  const names = assetNamesOf(raw);

  const tagName = typeof raw.tag_name === "string" ? raw.tag_name : FALLBACK_RELEASE.tagName;
  const releaseUrl =
    typeof raw.html_url === "string"
      ? raw.html_url
      : `https://github.com/documentdb/documentdb/releases/tag/${tagName}`;

  // The extension keeps the control-file form (0.116-0) on DEB, while RPM
  // splits it into Version/Release and renders 0.116.0-1.el9. Everything else
  // uses the flat dotted form. Read all three off real filenames so the page
  // cannot claim a shape the release does not contain.
  const aptVersion =
    firstMatch(names, /^ubuntu[\d.]+-postgresql-\d+-documentdb_([^_]+)_/) ??
    firstMatch(names, /^deb\d+-postgresql-\d+-documentdb_([^_]+)_/) ??
    FALLBACK_RELEASE.aptVersion;

  const rpmVersion =
    firstMatch(names, /^rhel\d+-postgresql\d+-documentdb-(.+)\.(?:x86_64|aarch64)\.rpm$/) ??
    FALLBACK_RELEASE.rpmVersion;

  const metaVersion =
    firstMatch(names, /^ubuntu[\d.]+-documentdb_([^_]+)_all\.deb$/) ??
    firstMatch(names, /^documentdb-(\d+\.\d+\.\d+)-\d+\.noarch\.rpm$/) ??
    FALLBACK_RELEASE.metaVersion;

  // e.g. documentdb-0.116.0-1.noarch.rpm -> 0.116.0-1
  const metaRpmVersion =
    firstMatch(names, /^documentdb-(\d+\.\d+\.\d+-\d+)\.noarch\.rpm$/) ??
    FALLBACK_RELEASE.metaRpmVersion;

  return {
    tagName,
    aptVersion,
    rpmVersion,
    metaVersion,
    metaRpmVersion,
    releaseUrl,
    assetNames: names,
  };
}

/**
 * Reads the mirrored release description published alongside the packages.
 *
 * Returns the fallback synchronously so the first paint is always correct-ish,
 * then swaps in the live values. The site is a static export, so this has to
 * happen in the browser; NEXT_PUBLIC_BASE_PATH is the one base-path value Next
 * keeps in the client bundle.
 */
export function useReleaseInfo(): ReleaseInfo {
  const [release, setRelease] = useState<ReleaseInfo>(FALLBACK_RELEASE);

  useEffect(() => {
    let cancelled = false;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    fetch(`${basePath}/packages/release-info.json`)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((payload) => {
        if (!cancelled) {
          setRelease(parseReleaseInfo(payload));
        }
      })
      .catch(() => {
        // Keep the fallback: an unreachable or malformed feed must not empty
        // the install commands the page exists to show.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return release;
}
