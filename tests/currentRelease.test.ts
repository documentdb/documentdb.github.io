import fs from 'node:fs';
import { load as loadYaml } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { FALLBACK_RELEASE } from '../app/lib/releaseInfo';
import { CURRENT_RELEASE_LINE, CURRENT_RELEASE_NOTES_PATH, CURRENT_RELEASE_TAG } from '../app/lib/currentRelease';
import type { Article } from '../app/types/Article';

describe('CURRENT_RELEASE_TAG', () => {
  // The version switcher labels "current" with this tag. If it falls behind the
  // release the rest of the site documents, every docs page tells the reader
  // they are on a version they are not on - the exact confusion versioned docs
  // exist to remove.
  it('matches the release the site documents', () => {
    expect(CURRENT_RELEASE_TAG).toBe(FALLBACK_RELEASE.tagName);
  });

  // Archived versions are labeled v0.117, so current must read v1.0, not v1.0-0.
  it('drops the build suffix for the release line', () => {
    expect(CURRENT_RELEASE_LINE).toMatch(/^v\d+\.\d+$/);
    expect(CURRENT_RELEASE_TAG.startsWith(`${CURRENT_RELEASE_LINE}-`)).toBe(true);
  });

  // The docs index card comes from content.yml, so it can't import the constant.
  it('shares its release notes link with the docs index', () => {
    const content = loadYaml(fs.readFileSync('articles/content.yml', 'utf8')) as Article;
    const links = content.landing.secondaryLinks?.map((item) => item.link);
    expect(links).toContain(CURRENT_RELEASE_NOTES_PATH);
  });
});
