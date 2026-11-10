/**
 * Slugs under /docs/getting-started/ that no longer have their own content and
 * now point at the page that replaced them. Kept in one place so the moved
 * notice, its metadata and the version switcher agree about where a page went.
 */
const movedGettingStartedPages: Record<string, { href: string; title: string }> = {
    'prebuilt-packages': {
        href: '/docs/getting-started/packages',
        title: 'Linux Packages Quick Start',
    },
    'vscode-extension-guide': {
        href: '/docs/getting-started/vscode-quickstart',
        title: 'Visual Studio Code Quick Start',
    },
};

export function getMovedPage(section: string, file: string) {
    if (section !== 'getting-started') {
        return undefined;
    }

    return movedGettingStartedPages[file];
}

/** Older pages whose content now lives at /docs/<section>/<file>. */
export function getPagesMovedTo(section: string, file: string): { section: string; file: string }[] {
    const href = `/docs/${section}/${file}`;

    return Object.entries(movedGettingStartedPages)
        .filter(([, page]) => page.href === href)
        .map(([movedFile]) => ({ section: 'getting-started', file: movedFile }));
}
