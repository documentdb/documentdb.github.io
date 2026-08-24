#!/usr/bin/env node
/**
 * Fails the build when the site's fallback release drifts from the release the
 * package repository actually mirrors.
 *
 * The /packages page used to hardcode its versions, and they went stale: the
 * page still advertised 0.114-0 (and 0.113-0 for the repository examples) after
 * v0.116-0 had been published and mirrored. The page now reads
 * out/packages/release-info.json at runtime, but it still needs a compiled-in
 * fallback for the first paint and for the case where that fetch fails - so the
 * fallback can drift in exactly the same way, just less visibly.
 *
 * This check closes that loop: whenever the deployment mirrors a release, the
 * fallback baked into the bundle must name the same one.
 *
 * Skipped when release-info.json is absent, which is the normal case for a
 * site-only build (BUILD_PACKAGES=false, or any fork without the packaging
 * secrets). There is nothing to compare against then.
 */

const fs = require("node:fs");
const path = require("node:path");

const releaseInfoPath = path.join(process.cwd(), "out", "packages", "release-info.json");
const fallbackSourcePath = path.join(process.cwd(), "app", "lib", "releaseInfo.ts");

if (!fs.existsSync(releaseInfoPath)) {
  console.log(`No ${path.relative(process.cwd(), releaseInfoPath)}; skipping release drift check.`);
  process.exit(0);
}

const source = fs.readFileSync(fallbackSourcePath, "utf8");

/** Reads a string field out of the FALLBACK_RELEASE object literal. */
function fallbackField(field) {
  const match = new RegExp(`${field}:\\s*"([^"]+)"`).exec(source);
  return match ? match[1] : null;
}

const mirrored = JSON.parse(fs.readFileSync(releaseInfoPath, "utf8"));
const mirroredTag = mirrored.tag_name;
if (typeof mirroredTag !== "string" || mirroredTag.length === 0) {
  console.error("release-info.json has no tag_name; cannot verify the site's fallback release.");
  process.exit(1);
}

const fallbackTag = fallbackField("tagName");
if (fallbackTag !== mirroredTag) {
  console.error(
    [
      "Release drift: the site's fallback release does not match the mirrored release.",
      "",
      `  mirrored (out/packages/release-info.json): ${mirroredTag}`,
      `  fallback (app/lib/releaseInfo.ts):         ${fallbackTag ?? "<not found>"}`,
      "",
      "Update FALLBACK_RELEASE in app/lib/releaseInfo.ts to the mirrored release.",
      "It is what visitors see before the release feed loads, and permanently if",
      "that fetch fails.",
    ].join("\n"),
  );
  process.exit(1);
}

// The version strings are derived from real asset filenames, so a mismatch here
// means the fallback would render install commands for packages the release
// does not contain.
const assetNames = Array.isArray(mirrored.assets)
  ? mirrored.assets.map((asset) => asset && asset.name).filter((name) => typeof name === "string")
  : [];

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
for (const { field, pattern } of derived) {
  const actual = assetNames.map((name) => pattern.exec(name)).find((m) => m && m[1]);
  if (!actual) {
    // The release simply does not ship that package shape; the fallback keeps
    // whatever it had, which is not drift.
    continue;
  }
  const expected = actual[1];
  const declared = fallbackField(field);
  if (declared !== expected) {
    console.error(
      `Release drift: FALLBACK_RELEASE.${field} is "${declared}" but ${mirroredTag} ships "${expected}".`,
    );
    failed = true;
  }
}

if (failed) {
  console.error("\nUpdate FALLBACK_RELEASE in app/lib/releaseInfo.ts.");
  process.exit(1);
}

console.log(`Release fallback matches the mirrored release (${mirroredTag}).`);
