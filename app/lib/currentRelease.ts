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
export const CURRENT_RELEASE_TAG = "v0.117-0";
