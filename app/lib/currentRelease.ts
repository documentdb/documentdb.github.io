/**
 * Tag of the DocumentDB release the current documentation describes.
 *
 * This duplicates `FALLBACK_RELEASE.tagName`, and deliberately so. That module
 * is a client module, and a value imported from one into server code arrives as
 * a client reference rather than the string - it renders as "undefined" in the
 * static export. Server code that needs the release tag reads it from here.
 *
 * `tests/currentRelease.test.ts` asserts the two stay equal, so the CI release
 * drift check keeps parsing the object literal it already parses, and this
 * constant cannot silently fall behind it.
 */
export const CURRENT_RELEASE_TAG = "v1.0-0";

// Snapshots are labeled by release line, so labels for current drop the build suffix too.
export const CURRENT_RELEASE_LINE = CURRENT_RELEASE_TAG.replace(/-\d+$/, "");

// Release notes for CURRENT_RELEASE_TAG; change the two together.
export const CURRENT_RELEASE_NOTES_PATH = "/docs/getting-started/release-notes-1.0";
