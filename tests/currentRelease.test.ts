import { describe, expect, it } from 'vitest';
import { FALLBACK_RELEASE } from '../app/lib/releaseInfo';
import { CURRENT_RELEASE_TAG } from '../app/lib/currentRelease';

describe('CURRENT_RELEASE_TAG', () => {
  // The version switcher labels "current" with this tag. If it falls behind the
  // release the rest of the site documents, every docs page tells the reader
  // they are on a version they are not on - the exact confusion versioned docs
  // exist to remove.
  it('matches the release the site documents', () => {
    expect(CURRENT_RELEASE_TAG).toBe(FALLBACK_RELEASE.tagName);
  });
});
