import { kebabCase } from 'change-case';

/**
 * Anchor id for a guide H2, exactly as Markdown.tsx emits it. Anything that links into a
 * guide section derives the fragment here, so the renderer and the link cannot disagree.
 */
export function headingAnchor(title: string): string {
  return kebabCase(title);
}

export const vscodeExistingConnectionSectionTitle = 'Connect an existing instance';
export const vscodeExistingConnectionSectionAnchor = headingAnchor(vscodeExistingConnectionSectionTitle);
