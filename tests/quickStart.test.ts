import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from '../app/page';
import { SetupRetryHint } from '../app/components/QuickStartTabs';
import {
  headingAnchor,
  vscodeSetupSectionAnchor,
  vscodeSetupSectionTitle,
} from '../app/lib/docsAnchors';
import { getArticleByPath } from '../app/services/articleService';
import {
  documentdbVsCodeExtensionMarketplaceUrl,
  documentdbVsCodeLocalQuickStartDeepLink,
} from '../app/services/externalLinks';

const html = renderToStaticMarkup(createElement(Home));

/** The quick start card only, so assertions cannot be satisfied by unrelated page content. */
const card = html.slice(html.indexOf('id="run-with-docker"'));

/** One tab panel only: bounded by the next panel, or by the end of the hero section. */
function panel(id: 'terminal' | 'vscode') {
  const start = card.indexOf(`id="quickstart-panel-${id}"`);
  expect(start).toBeGreaterThan(-1);
  const candidates = [
    card.indexOf('id="quickstart-panel-vscode"', start + 1),
    card.indexOf('</section>', start),
  ].filter((index) => index > start);
  expect(candidates.length).toBeGreaterThan(0);
  return card.slice(start, Math.min(...candidates));
}

const vscodeGuideUrl = `/docs/getting-started/vscode-quickstart#${vscodeSetupSectionAnchor}`;

describe('homepage local quick start', () => {
  it('preserves the public anchor and the terminal path as the default tab', () => {
    expect(html).toContain('id="run-with-docker"');

    // Asserted attribute by attribute: matching a fixed attribute sequence would fail on a
    // no-op JSX prop reorder while telling us nothing extra.
    for (const attr of [
      'id="quickstart-tab-terminal"',
      'aria-selected="true"',
      'aria-controls="quickstart-panel-terminal"',
      'id="quickstart-panel-terminal"',
      'aria-labelledby="quickstart-tab-terminal"',
      'id="quickstart-tab-vscode"',
      'aria-controls="quickstart-panel-vscode"',
      'id="quickstart-panel-vscode"',
      'aria-labelledby="quickstart-tab-vscode"',
    ]) {
      expect(card).toContain(attr);
    }

    // The VS Code panel is the one hidden on first paint, and its tab is out of the tab order.
    expect(card).toMatch(/id="quickstart-panel-vscode"[^>]*hidden=""/);
    expect(card).not.toMatch(/id="quickstart-panel-terminal"[^>]*hidden=""/);
  });

  it('ships a command that is safe to publish and actually parses in a shell', () => {
    // A bare -p publishes on every interface; the guide this card links to calls that out.
    expect(card).toContain('-p 127.0.0.1:10260:10260');
    expect(card).not.toContain('-p 10260:10260 ');
    // Unquoted <PLACEHOLDER> is parsed as a redirection, so the pasted command is a syntax error.
    expect(card).toContain("--username &#x27;&lt;YOUR_USERNAME&gt;&#x27;");
    expect(card).toContain("--password &#x27;&lt;YOUR_PASSWORD&gt;&#x27;");
    expect(card).toContain(
      'ghcr.io/documentdb/documentdb/documentdb-local:latest',
    );
  });

  it('labels the tabs by interface and says the paths share an image, not a container', () => {
    expect(card).toContain('>Terminal</button>');
    expect(card).toContain('>VS Code</button>');
    expect(card).toContain('Both run the same DocumentDB Local image.');
  });

  it('carries the whole VS Code flow on one button, with the install explained underneath', () => {
    expect(documentdbVsCodeLocalQuickStartDeepLink).toBe(
      'vscode://ms-azuretools.vscode-documentdb/local',
    );
    const vscode = panel('vscode');

    // VS Code offers to install a missing extension when the deep link targets it, so a
    // separate "Install the extension" action was a step the visitor never has to take.
    // Attribute by attribute rather than as one sequence, so a JSX prop reorder cannot fail it.
    const button = vscode.slice(0, vscode.indexOf('>Set up in VS Code</a>'));
    expect(button).toContain(`href="${documentdbVsCodeLocalQuickStartDeepLink}"`);
    expect(button).toContain('aria-describedby="quickstart-vscode-setup-caption"');
    expect(vscode).not.toContain('Install the extension');
    expect(vscode).not.toContain('Open setup in VS Code');

    // The caption is what the button is described by, and it is where the Marketplace link
    // lives now: explained, not hidden, but not a second button.
    const captionStart = vscode.indexOf('id="quickstart-vscode-setup-caption"');
    const caption = vscode.slice(captionStart, vscode.indexOf('</p>', captionStart));
    expect(caption).toContain('Opens VS Code and its setup wizard.');
    expect(caption).toContain(`href="${documentdbVsCodeExtensionMarketplaceUrl}"`);
    // VS Code offers; the visitor confirms. "Installs" promised more than the flow does.
    expect(caption).toContain('VS Code offers to install it first.');

    expect(vscode).toContain('Choose this for the smoothest experience.');
  });

  it('does not put a Docker prerequisite only under the guided path', () => {
    // Both paths need Docker and the Terminal tab does not say so; saying it only under VS
    // Code made the guided path look like the one with extra requirements.
    expect(panel('vscode')).not.toMatch(/docker/i);
    expect(panel('vscode')).not.toContain('Linux containers');
  });

  it('shows the guided path as two steps, the wizard and the payoff', () => {
    expect(panel('terminal').match(/<li\b/g)).toHaveLength(3);
    expect(panel('vscode').match(/<li\b/g)).toHaveLength(2);
    expect(panel('vscode')).toContain('select Continue');
    expect(panel('vscode')).toContain('select Start DocumentDB Local');
    // loadSampleData defaults to true in the extension's quickStartTypes.ts.
    expect(panel('vscode')).toContain('Sample data is loaded by default.');
  });

  it('carries no pinned extension version, which the guide owns instead', () => {
    // Matched by shape rather than by one literal, so bumping the pin to 0.10.2 is caught
    // too. Deliberately not a bare \d+\.\d+\.\d+, which would match the 127.0.0.1 in the
    // command and the loopback address in the steps.
    expect(card).not.toMatch(/version \d+\.\d+\.\d+/i);
    expect(card).not.toMatch(/\d+\.\d+\.\d+ or (later|newer|above)/i);
    expect(card).not.toMatch(/\bv\d+\.\d+\.\d+\b/);
  });

  it('links both guides from inside their own panels', () => {
    // Conditionally rendering one link left the VS Code guide out of the exported HTML
    // entirely, since the server renders with the terminal tab active.
    expect(panel('terminal')).toContain('href="/docs/getting-started/docker"');
    expect(panel('terminal')).toContain('Full Docker guide');
    expect(panel('vscode')).toContain(`href="${vscodeGuideUrl}"`);
  });

  it('points the VS Code fallback at a section the guide actually has', () => {
    // Markdown.tsx anchors each H2 with kebabCase(title); the link must land on the section
    // that lists the other ways to open the wizard, not at the top of the page.
    const guide = getArticleByPath('getting-started', ['vscode-quickstart']);
    expect(guide?.content).toContain(`## ${vscodeSetupSectionTitle}`);
    expect(vscodeSetupSectionAnchor).toBe(headingAnchor('Set up DocumentDB Local'));
    expect(vscodeSetupSectionAnchor).toBe('set-up-document-db-local');
    expect(guide?.content).toContain('VS Code offers to install it first');
    // The install-on-link flow fails on machines whose policy points VS Code at a private
    // marketplace before the account check completes; the guide names that error verbatim.
    expect(guide?.content).toContain('No extension gallery service configured');
    expect(guide?.content).toContain('code --install-extension ms-azuretools.vscode-documentdb');
  });

  it('offers a labelled route between the two paths', () => {
    expect(card).toContain('aria-label="Switch to the VS Code tab"');
    expect(card).toContain('aria-label="Switch to the Terminal tab"');
  });

  it('keeps troubleshooting out of the happy path', () => {
    const vscode = panel('vscode');
    expect(vscode).not.toContain('If nothing happens');
    // The retry line appears only some seconds after the button is used. The live region is
    // mounted from the first paint so it is announced when filled, but it starts empty, and
    // it sits below the steps so its arrival never shifts what is being read.
    expect(vscode).not.toContain('Nothing happened?');
    expect(vscode).toMatch(/<div role="status">\s*<\/div>/);
    expect(vscode.search(/<div role="status">/)).toBeGreaterThan(vscode.lastIndexOf('</ol>'));
    expect(vscode).not.toContain('DocumentDB: Set up DocumentDB Local');

    // A short link after the steps, not a paragraph of doubt in front of someone who has
    // not clicked yet.
    const fallback = vscode.indexOf('Not working in VS Code?');
    expect(fallback).toBeGreaterThan(vscode.lastIndexOf('</ol>'));
    expect(vscode.slice(fallback)).toContain(`href="${vscodeGuideUrl}"`);
    // Same link text shape as the Terminal panel's "Full Docker guide", so the two panels
    // rhyme and a successful visitor still has a neutral route to the guide.
    expect(vscode.slice(fallback)).toContain('>full VS Code guide</a>');
    expect(vscode.slice(fallback)).toContain('activity bar or the Command');
  });

  it('repeats the deep link as the retry control once the hint is visible', () => {
    const hint = renderToStaticMarkup(
      createElement(SetupRetryHint, {
        visible: true,
        deepLinkUrl: documentdbVsCodeLocalQuickStartDeepLink,
        marketplaceUrl: documentdbVsCodeExtensionMarketplaceUrl,
      }),
    );
    expect(hint).toContain('Nothing happened?');
    // The second click is the one that works on managed devices, so it is one action away.
    expect(hint).toContain(`href="${documentdbVsCodeLocalQuickStartDeepLink}"`);
    expect(hint).toContain('>Set up in VS Code</a>');
    expect(hint).toContain(`href="${documentdbVsCodeExtensionMarketplaceUrl}"`);
    // Nothing about the error itself: that explanation belongs in the guide.
    expect(hint).not.toMatch(/error/i);
  });
});
