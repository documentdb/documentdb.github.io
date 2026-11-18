#!/usr/bin/env node
/**
 * Fails the build when either of the site's fallback releases drifts from the
 * release its package channel actually mirrors.
 *
 * The /packages page used to hardcode its versions, and they went stale: the
 * page still advertised 0.114-0 (and 0.113-0 for the repository examples) after
 * v0.116-0 had been published and mirrored. The page now reads each channel's
 * release feed at runtime, but it still needs a compiled-in fallback for the
 * first paint and for the case where that fetch fails - so the fallback can
 * drift in exactly the same way, just less visibly.
 *
 * This check closes that loop: whenever the deployment mirrors the releases,
 * each fallback baked into the bundle must name its channel's release.
 *
 * Skipped when neither feed exists, which is the normal case for a site-only
 * build (BUILD_PACKAGES=false, or any fork without the packaging secrets).
 * There is nothing to compare against then.
 */

const fs = require("node:fs");
const path = require("node:path");

// Mirrors releaseInfoPaths in app/lib/releaseInfo.ts.
const channels = [
  { channel: "latest", feed: path.join("out", "packages", "release-info-latest.json") },
  { channel: "stable", feed: path.join("out", "packages", "release-info.json") },
];
const fallbackSourcePath = path.join("app", "lib", "releaseInfo.ts");

const present = channels.filter(({ feed }) => fs.existsSync(feed));
if (present.length === 0) {
  console.log("No release feeds in out/packages; skipping release drift check.");
  process.exit(0);
}
// A deploy mirrors both channels, so a lone feed means the other channel was not built.
if (present.length !== channels.length) {
  const missing = channels.filter((entry) => !present.includes(entry)).map(({ feed }) => feed);
  console.error(`Release drift: ${missing.join(", ")} is missing; cannot verify every fallback release.`);
  process.exit(1);
}

const source = fs.readFileSync(fallbackSourcePath, "utf8");
const fallbacks = source.slice(source.indexOf("export const FALLBACK_RELEASES"));

/** Reads a string field out of FALLBACK_RELEASES[channel]. */
function fallbackField(channel, field) {
  const entry = new RegExp(`\\b${channel}:\\s*\\{([^}]*)\\}`).exec(fallbacks);
  const match = entry && new RegExp(`\\b${field}:\\s*"([^"]+)"`).exec(entry[1]);
  return match ? match[1] : null;
}

// The version strings are derived from real asset filenames, so a mismatch here
// means the fallback would render install commands for packages the release
// does not contain.
const derived = [
  {
    field: "aptVersion",
    pattern: /^ubuntu[\d.]+-postgresql-\d+-documentdb_([^_]+)_/,
  },
  {
    field: "rpmVersion",
    pattern: /^rhel\d+-postgresql\d+-documentdb-(.+)\.(?:x86_64|aarch64)\.rpm$/,
  },
  {
    field: "metaVersion",
    pattern: /^ubuntu[\d.]+-documentdb_([^_]+)_all\.deb$/,
  },
];

let failed = false;
for (const { channel, feed } of channels) {
  const mirrored = JSON.parse(fs.readFileSync(feed, "utf8"));
  const mirroredTag = mirrored.tag_name;
  if (typeof mirroredTag !== "string" || mirroredTag.length === 0) {
    console.error(`${feed} has no tag_name; cannot verify the ${channel} fallback release.`);
    failed = true;
    continue;
  }

  const fallbackTag = fallbackField(channel, "tagName");
  if (fallbackTag !== mirroredTag) {
    console.error(
      [
        `Release drift: the site's ${channel} fallback release does not match the mirrored release.`,
        "",
        `  mirrored (${feed}): ${mirroredTag}`,
        `  fallback (FALLBACK_RELEASES.${channel}): ${fallbackTag ?? "<not found>"}`,
        "",
      ].join("\n"),
    );
    failed = true;
    continue;
  }

  const assetNames = Array.isArray(mirrored.assets)
    ? mirrored.assets.map((asset) => asset && asset.name).filter((name) => typeof name === "string")
    : [];
  let channelFailed = false;
  for (const { field, pattern } of derived) {
    const actual = assetNames.map((name) => pattern.exec(name)).find((m) => m && m[1]);
    if (!actual) {
      // The release simply does not ship that package shape; the fallback keeps
      // whatever it had, which is not drift.
      continue;
    }
    const expected = actual[1];
    const declared = fallbackField(channel, field);
    if (declared !== expected) {
      console.error(
        `Release drift: FALLBACK_RELEASES.${channel}.${field} is "${declared}" but ${mirroredTag} ships "${expected}".`,
      );
      channelFailed = true;
    }
  }
  failed ||= channelFailed;
  if (!channelFailed) {
    console.log(`The ${channel} fallback matches the mirrored release (${mirroredTag}).`);
  }
}

if (failed) {
  console.error(
    "\nUpdate FALLBACK_RELEASES in app/lib/releaseInfo.ts. It is what visitors see before the\n" +
      "release feeds load, and permanently if a fetch fails.",
  );
  process.exit(1);
}
