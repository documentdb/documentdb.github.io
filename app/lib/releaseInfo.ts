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
  /** Git tag of the mirrored release, e.g. "v0.117-0". */
  tagName: string;
  /** Extension package version on DEB, e.g. "0.117-0". */
  aptVersion: string;
  /** Extension package version on RPM, e.g. "0.117.0-1.el9". */
  rpmVersion: string;
  /**
   * Version of every non-extension package, e.g. "0.117.0".
   *
   * The extension keeps the control-file form (`0.117-0`) while the meta,
   * per-major, gateway, tools and common packages use the flat dotted form.
   * Pinning examples MUST pick the right one for the package being pinned:
   * `apt install documentdb-18=0.117-0` fails with "Version '0.117-0' for
   * 'documentdb-18' was not found", because that package is `0.117.0`.
   */
  metaVersion: string;
  /** RPM form of the non-extension packages, e.g. "0.117.0-1". */
  metaRpmVersion: string;
  releaseUrl: string;
  assetNames: readonly string[];
};

// A reference release, not evidence of current repository availability.
export const FALLBACK_RELEASE: ReleaseInfo = {
  tagName: "v0.117-0",
  aptVersion: "0.117-0",
  rpmVersion: "0.117.0-1.el9",
  metaVersion: "0.117.0",
  metaRpmVersion: "0.117.0-1",
  releaseUrl: "https://github.com/documentdb/documentdb/releases/tag/v0.117-0",
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

export function parseReleaseInfo(payload: unknown): ReleaseInfo {
  if (!payload || typeof payload !== "object") {
    throw new Error("The repository returned invalid release metadata.");
  }
  const raw = payload as RawReleaseInfo;
  const names = assetNamesOf(raw);
  if (typeof raw.tag_name !== "string" || !/^v\d+\.\d+[.-]\d+(?:[.-][a-zA-Z0-9]+)*$/.test(raw.tag_name)) {
    throw new Error("The repository returned an invalid release tag.");
  }
  const tagName = raw.tag_name;
  const releaseUrl = `https://github.com/documentdb/documentdb/releases/tag/${tagName}`;

  // The extension keeps the control-file form (0.117-0) on DEB, while RPM
  // splits it into Version/Release and renders 0.117.0-1.el9. Everything else
  // uses the flat dotted form. Read all three off real filenames so the page
  // cannot claim a shape the release does not contain.
  const aptVersion =
    firstMatch(names, /^ubuntu[\d.]+-postgresql-\d+-documentdb_([^_]+)_/) ??
    firstMatch(names, /^deb\d+-postgresql-\d+-documentdb_([^_]+)_/);

  const rpmVersion =
    firstMatch(names, /^rhel\d+-postgresql\d+-documentdb-(.+)\.(?:x86_64|aarch64)\.rpm$/);

  const metaVersion =
    firstMatch(names, /^ubuntu[\d.]+-documentdb_([^_]+)_all\.deb$/) ??
    firstMatch(names, /^documentdb-(\d+\.\d+\.\d+)-\d+\.noarch\.rpm$/);

  // e.g. documentdb-0.117.0-1.noarch.rpm -> 0.117.0-1
  const metaRpmVersion =
    firstMatch(names, /^documentdb-(\d+\.\d+\.\d+-\d+)\.noarch\.rpm$/);

  if (!aptVersion || !rpmVersion || !metaVersion || !metaRpmVersion) {
    throw new Error("The repository release metadata does not contain the expected package versions.");
  }

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

export type ReleaseState = {
  release: ReleaseInfo;
  status: "loading" | "live" | "fallback";
  error: string | null;
};

export function useReleaseInfo(): ReleaseState {
  const [state, setState] = useState<ReleaseState>({
    release: FALLBACK_RELEASE,
    status: "loading",
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    fetch(`${basePath}/packages/release-info.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Release metadata is unavailable (HTTP ${response.status}).`);
        }
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) {
          setState({ release: parseReleaseInfo(payload), status: "live", error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            release: FALLBACK_RELEASE,
            status: "fallback",
            error: error instanceof Error && error.name !== "AbortError"
              ? error.message
              : "The release metadata request timed out.",
          });
        }
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return state;
}
