import { kebabCase } from 'change-case';

/**
 * Anchor id for a guide H2, exactly as Markdown.tsx emits it. Anything that links into a
 * guide section derives the fragment here, so the renderer and the link cannot disagree.
 */
export function headingAnchor(title: string): string {
  return kebabCase(title);
}

// GitHub's fragment for the heading, which in-page links in the docs Markdown use.
export function githubHeadingAnchor(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

export const vscodeExistingConnectionSectionTitle = 'Connect an existing instance';
export const vscodeExistingConnectionSectionAnchor = headingAnchor(vscodeExistingConnectionSectionTitle);
