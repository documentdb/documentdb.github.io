import { kebabCase } from 'change-case';

/**
 * Anchor id for a guide H2, exactly as Markdown.tsx emits it. Anything that links into a
 * guide section derives the fragment here, so the renderer and the link cannot disagree.
 */
export function headingAnchor(title: string): string {
  return kebabCase(title);
}

/** The guide section the homepage quick start points at when the VS Code deep link does nothing. */
export const vscodeSetupSectionTitle = 'Set up DocumentDB Local';
export const vscodeSetupSectionAnchor = headingAnchor(vscodeSetupSectionTitle);
