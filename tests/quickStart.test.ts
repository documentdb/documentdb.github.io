import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from '../app/page';
import Markdown from '../app/components/Markdown';
import {
  headingAnchor,
  vscodeExistingConnectionSectionAnchor,
  vscodeExistingConnectionSectionTitle,
} from '../app/lib/docsAnchors';
import { getArticleByPath } from '../app/services/articleService';
import { documentdbVsCodeLocalQuickStartDeepLink } from '../app/services/externalLinks';

const html = renderToStaticMarkup(createElement(Home));
const cardStart = html.indexOf('id="run-with-docker"');
const card = html.slice(cardStart, html.indexOf('</section>', cardStart));
const vscodeGuideUrl = '/docs/getting-started/vscode-quickstart';
const existingConnectionUrl = `${vscodeGuideUrl}#${vscodeExistingConnectionSectionAnchor}`;

function panel(id: 'command' | 'guided') {
  const start = card.indexOf(`id="quickstart-panel-${id}"`);
  const end = id === 'command'
    ? card.indexOf('id="quickstart-panel-guided"', start + 1)
    : card.length;
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return card.slice(start, end);
}

const guide = getArticleByPath('getting-started', ['vscode-quickstart']);
if (!guide) {
  throw new Error('The VS Code quick-start guide must exist');
}
const guideContent = guide.content;
const guideHtml = renderToStaticMarkup(
  createElement(Markdown, {
    content: guideContent,
    sourcePath: 'getting-started/vscode-quickstart.md',
  }),
);

describe('homepage local quick start', () => {
  it('preserves the public anchor and selects the Docker command by default', () => {
    expect(cardStart).toBeGreaterThan(-1);

    for (const id of ['command', 'guided']) {
      const selected = id === 'command';
      const tab = card.match(
        new RegExp(`<button\\b[^>]*id="quickstart-tab-${id}"[^>]*>`),
      )?.[0];
      expect(tab).toBeDefined();
      expect(tab).toContain(`aria-selected="${selected}"`);
      expect(tab).toContain(`aria-controls="quickstart-panel-${id}"`);
      expect(tab).toContain(`tabindex="${selected ? 0 : -1}"`);

      const panelTag = card.match(
        new RegExp(`<div\\b[^>]*id="quickstart-panel-${id}"[^>]*>`),
      )?.[0];
      expect(panelTag).toContain('role="tabpanel"');
      expect(panelTag).toContain(`aria-labelledby="quickstart-tab-${id}"`);
      if (selected) {
        expect(panelTag).not.toContain('hidden=""');
      } else {
        expect(panelTag).toContain('hidden=""');
      }
    }
  });

  it('preserves the loopback binding, quoted placeholders, and official image', () => {
    const command = panel('command');
    expect(command).toContain('-p 127.0.0.1:10260:10260');
    expect(command).not.toContain('-p 10260:10260 ');
    expect(command).toContain("--username &#x27;&lt;YOUR_USERNAME&gt;&#x27;");
    expect(command).toContain("--password &#x27;&lt;YOUR_PASSWORD&gt;&#x27;");
    expect(command).toContain('ghcr.io/documentdb/documentdb/documentdb-local:latest');
    expect(command).not.toContain('--init-data');
  });

  it('labels setup workflows and identifies the extension before selection', () => {
    const selector = card.slice(
      card.indexOf('role="tablist"'),
      card.indexOf('role="tabpanel"'),
    );
    expect(selector).toContain('Docker command');
    expect(selector).toContain('Run it yourself');
    expect(selector).toContain('Guided setup');
    expect(selector).toContain('VS Code extension');
    expect(selector).not.toContain('>Terminal<');
    expect(selector).not.toContain('>VS Code<');
    expect(card).not.toContain('Want a GUI?');
    expect(card).not.toContain('connects to this container too');
  });

  it('states the shared Docker requirement once, outside either panel', () => {
    const requirement = 'Both options require Docker.';
    expect(card.split(requirement)).toHaveLength(2);
    expect(card.indexOf(requirement)).toBeLessThan(card.indexOf('role="tablist"'));
    expect(panel('command')).not.toContain(requirement);
    expect(panel('guided')).not.toContain(requirement);
    expect(panel('guided')).not.toContain('Linux containers');
  });

  it('opens the Linux packages guide from below both panels, not before the default path', () => {
    const href = 'href="/docs/getting-started/packages"';
    const link = card.indexOf(href);
    expect(card.split(href)).toHaveLength(2);
    expect(link).toBeGreaterThan(card.indexOf('id="quickstart-panel-guided"'));
    // Closes the guided panel and the tabs wrapper, so the footer is visible from either tab.
    expect(card.slice(0, card.lastIndexOf('<p', link))).toMatch(/<\/div><\/div>$/);
    expect(card.slice(link)).toMatch(/^href="[^"]+"[^>]*>Linux packages guide</);
  });

  it('explains manual control and guided provisioning rather than editor choice', () => {
    expect(card).toContain('Run it yourself');
    expect(panel('guided')).toContain(
      'creates your local database, generates credentials, and saves a connection',
    );
    expect(card).not.toContain('smoothest experience');
    expect(card).not.toContain('One click');
    expect(card).not.toContain('300 MB');
  });

  it('offers one guided launch action with an honest editor and extension caption', () => {
    expect(documentdbVsCodeLocalQuickStartDeepLink).toBe(
      'vscode://ms-azuretools.vscode-documentdb/local',
    );
    const guided = panel('guided');
    const launch = guided.match(
      /<a\b[^>]*>Set up in VS Code<\/a>/,
    )?.[0];
    expect(launch).toContain(`href="${documentdbVsCodeLocalQuickStartDeepLink}"`);
    expect(launch).toContain('aria-describedby="quickstart-vscode-setup-caption"');
    expect(card.split(`href="${documentdbVsCodeLocalQuickStartDeepLink}"`)).toHaveLength(2);

    const captionStart = guided.indexOf('id="quickstart-vscode-setup-caption"');
    const caption = guided.slice(captionStart, guided.indexOf('</p>', captionStart));
    // One click covers VS Code with or without the extension; only VS Code itself must come first.
    expect(caption).toMatch(
      /Don&#x27;t have VS Code\? <a [^>]*href="https:\/\/code\.visualstudio\.com\/">Download it<\/a> first\./,
    );
    expect(caption).not.toContain('marketplace.visualstudio.com');
    expect(caption).not.toContain('vscode:extension/');
    expect(guided).not.toContain('>Install the extension</');
  });

  it('keeps both workflows concise without numbered steps', () => {
    const command = panel('command');
    const guided = panel('guided');
    const editCredentials = 'Replace the username and password, then run the command.';
    const connect = 'Then connect with your preferred client.';
    expect(command).not.toContain('<ol');
    expect(command.split(editCredentials)).toHaveLength(2);
    expect(command.indexOf(editCredentials)).toBeLessThan(command.indexOf('<pre'));
    expect(command.indexOf(connect)).toBeGreaterThan(command.indexOf('</pre>'));
    expect(command.indexOf('Docker setup guide')).toBeGreaterThan(command.indexOf(connect));
    expect(command).not.toContain('Connect on 127.0.0.1:10260 with your app');
    expect(command).not.toContain('Run your first query.');
    expect(guided).not.toContain('<ol');
    expect(guided).not.toContain('Confirm the prompts');
    expect(guided).not.toContain('select Continue');
    expect(guided).not.toContain('select Start DocumentDB Local');
    expect(guided).toContain('When setup finishes, select Open Connection.');
    expect(guided).not.toContain('Sample data is enabled by default.');
  });

  it('leaves extension versions in the guide, not the homepage', () => {
    expect(card).not.toMatch(/version \d+\.\d+\.\d+/i);
    expect(card).not.toMatch(/\d+\.\d+\.\d+ or (later|newer|above)/i);
    expect(card).not.toMatch(/\bv\d+\.\d+\.\d+\b/);
  });

  it('exports a permanent full-guide link for each path without timed retry UI', () => {
    expect(panel('command')).toContain('href="/docs/getting-started/docker"');
    expect(panel('command')).toContain('Docker setup guide');
    expect(panel('guided')).toContain(`href="${vscodeGuideUrl}"`);
    expect(panel('guided')).toContain('VS Code setup guide');
    expect(panel('guided').indexOf('>VS Code setup guide</a>')).toBeGreaterThan(
      panel('guided').indexOf('When setup finishes, select Open Connection'),
    );
    expect(card).not.toContain('Nothing happened?');
    expect(card).not.toContain('Not working in VS Code?');
    expect(panel('guided')).not.toContain('role="status"');
  });

  it('omits the existing-instance footer from the homepage', () => {
    expect(card).not.toContain('id="quickstart-existing-connection"');
    expect(card).not.toContain('Already running DocumentDB?');
    expect(card).not.toContain('Connect your existing instance in VS Code.');
    expect(card).not.toContain(`href="${existingConnectionUrl}"`);
  });
});

describe('VS Code quick-start guide', () => {
  it('renders the existing-instance destination using the shared heading algorithm', () => {
    expect(vscodeExistingConnectionSectionAnchor).toBe(
      headingAnchor(vscodeExistingConnectionSectionTitle),
    );
    expect(vscodeExistingConnectionSectionAnchor).toBe('connect-an-existing-instance');
    expect(guideHtml).toContain(`id="${vscodeExistingConnectionSectionAnchor}"`);
    expect(guideHtml).toContain('id="set-up-document-db-local"');
  });

  it('keeps guided setup first and connects an existing instance without provisioning', () => {
    const setup = guideContent.indexOf('## Set up DocumentDB Local');
    const manual = guideContent.indexOf('## Alternative: start the container yourself');
    const connect = guideContent.indexOf(`## ${vscodeExistingConnectionSectionTitle}`);
    expect(setup).toBeGreaterThan(-1);
    expect(manual).toBeGreaterThan(setup);
    expect(connect).toBeGreaterThan(manual);
    const instructions = guideContent.slice(
      connect,
      guideContent.indexOf('## Verify the connection in the extension'),
    );
    expect(instructions).toContain('instance that is already running');
    expect(instructions).toContain('do not need to run the setup wizard or create another container');
    expect(instructions).toContain('New Local Connection');
    expect(instructions).toContain("your instance's port");
    expect(instructions).not.toContain('docker run');
  });

  it('explains both sample-data defaults without assuming a specific database exists', () => {
    const verification = guideContent.slice(
      guideContent.indexOf('## Verify the connection in the extension'),
      guideContent.indexOf('## Import, export, and querying'),
    );
    expect(verification).toContain('Guided setup loads sample data by default unless you turn that option off');
    expect(verification).toContain('manual Docker command above starts without sample data');
    expect(verification).toContain('An empty instance is expected when sample data is disabled');
    expect(verification).toContain('add a test document');
    expect(verification).not.toContain('StoreData');
    expect(verification).not.toContain('sampledb');
  });

  it('retains prerequisites and launch recovery in the guide', () => {
    expect(guideContent).toContain('## Prerequisites');
    expect(guideContent).toContain('Docker Desktop or Docker Engine');
    expect(guideContent).toContain('container and persistent data volume');
    expect(guideContent).toContain('It does not install Docker.');
    expect(guideContent).not.toContain('changes nothing else on your machine');
    expect(guideContent).toContain('DocumentDB: Set up DocumentDB Local');
    expect(guideContent).toContain('No extension gallery service configured');
    expect(guideContent).toContain('code --install-extension ms-azuretools.vscode-documentdb');
    // Without --force the CLI keeps an older version, and old versions reject the /local link.
    expect(guideContent).toContain('code --install-extension ms-azuretools.vscode-documentdb --force');
    expect(guideContent).toContain('opened without a connection string');
    expect(guideContent).toContain('Reload VS Code after installing or updating');
    expect(guideContent).not.toContain('VS Code offers to install it first');
  });
});
