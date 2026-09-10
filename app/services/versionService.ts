import fs from 'fs';
import path from 'path';
import { load as loadYaml } from 'js-yaml';
import matter from 'gray-matter';
import { Link } from '../types/Link';
import { CURRENT_RELEASE_TAG } from '../lib/currentRelease';

/**
 * Serves frozen documentation snapshots compiled by scripts/compile-content.tsx
 * into versioned/<label>/. The main (rolling) documentation is served by
 * articleService.ts from articles/; this module only handles archived versions
 * rendered under /docs/versions/<label>/.
 *
 * Versioned pages render the snapshot content as-is: the editorial overrides
 * that articleService applies to current pages deliberately do not apply here,
 * because a snapshot must show the docs exactly as they were at the tag.
 */

const versionedDirectory = path.join(process.cwd(), 'versioned');

/** Labels of all compiled documentation versions, newest first. */
export function getDocVersions(): string[] {
  if (!fs.existsSync(versionedDirectory)) {
    return [];
  }

  return fs
    .readdirSync(versionedDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort()
    .reverse();
}

function versionArticlesDir(version: string): string {
  return path.join(versionedDirectory, version, 'articles');
}

/** Article sections available in a given version snapshot. */
export function getVersionedSections(version: string): string[] {
  const base = versionArticlesDir(version);

  if (!fs.existsSync(base)) {
    return [];
  }

  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

/** Whether a specific article exists in a version snapshot. */
export function versionedArticleExists(version: string, section: string, file: string): boolean {
  return fs.existsSync(path.join(versionArticlesDir(version), section, `${file}.md`));
}

/** All {version, section, slug} combinations, for generateStaticParams. */
export function getAllVersionedArticlePaths(): { version: string; section: string; slug: string[] }[] {
  const paths: { version: string; section: string; slug: string[] }[] = [];

  for (const version of getDocVersions()) {
    for (const section of getVersionedSections(version)) {
      const sectionPath = path.join(versionArticlesDir(version), section);
      const files = fs
        .readdirSync(sectionPath, { withFileTypes: true })
        .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.md'))
        .map((dirent) => dirent.name.replace('.md', ''));

      for (const file of files) {
        paths.push({ version, section, slug: file === 'index' ? [] : [file] });
      }
    }
  }

  return paths;
}

/** Sidebar navigation for a versioned section, with links under /docs/versions/<version>/. */
export function getVersionedNavigation(version: string, section: string): Link[] {
  const navPath = path.join(versionArticlesDir(version), section, 'navigation.yml');

  if (!fs.existsSync(navPath)) {
    return [];
  }

  const rawLinks = loadYaml(fs.readFileSync(navPath, 'utf8')) as Link[];

  return rawLinks.map((link) => {
    let transformedLink = link.link;

    if (transformedLink.endsWith('.md')) {
      const file = transformedLink.replace('.md', '');
      transformedLink =
        file === 'index'
          ? `/docs/versions/${version}/${section}`
          : `/docs/versions/${version}/${section}/${file}`;
    }

    return { ...link, link: transformedLink, children: undefined };
  });
}

/** Human-readable section title (shared by current and versioned navigation). */
export function formatSectionTitle(section: string): string {
  const words = section
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return words.replace(/documentdb/i, 'DocumentDB').replace(/\bapi\b/i, 'API');
}

const SECTION_ORDER = [
  'getting-started',
  'documentdb-local',
  'postgres-api',
  'architecture',
  'kubernetes-operator',
  'release-notes',
];

/** Sort sections into their canonical display order (unknown sections last). */
export function orderSections(sections: string[]): string[] {
  return [...sections].sort((a, b) => {
    const ia = SECTION_ORDER.indexOf(a);
    const ib = SECTION_ORDER.indexOf(b);
    return (ia === -1 ? SECTION_ORDER.length : ia) - (ib === -1 ? SECTION_ORDER.length : ib);
  });
}

export interface VersionSwitcherEntry {
  label: string;
  href: string;
  active: boolean;
}

/**
 * Entries for the version switcher shown on every docs page.
 *
 * `viewing` is 'current' or a version label. For each version the target is the
 * best equivalent of the page being viewed: the same page when it exists in
 * that version, otherwise the section home, otherwise the version home. This
 * keeps switching lossless where possible and predictable where not.
 */
export function getVersionSwitcherEntries(
  viewing: string,
  section: string | null,
  file: string | null
): VersionSwitcherEntry[] {
  const currentArticlesDir = path.join(process.cwd(), 'articles');

  const currentTarget = (() => {
    if (!section) return '/docs';
    if (!fs.existsSync(path.join(currentArticlesDir, section))) return '/docs';
    if (!file || file === 'index') return `/docs/${section}`;
    if (fs.existsSync(path.join(currentArticlesDir, section, `${file}.md`))) {
      return `/docs/${section}/${file}`;
    }
    return `/docs/${section}`;
  })();

  // Name the release "current" actually describes, so a reader can tell at a
  // glance whether they are on the docs for the build they installed. This has
  // to come from the release the site documents - deriving it from the newest
  // snapshot label instead would print the archive's own version here, which is
  // by definition an older release, and would render the same number twice in a
  // switcher whose whole job is telling two versions apart.
  const versions = getDocVersions();
  const entries: VersionSwitcherEntry[] = [
    {
      label: `Current (${CURRENT_RELEASE_TAG}, latest)`,
      href: currentTarget,
      active: viewing === 'current',
    },
  ];

  for (const version of versions) {
    const target = (() => {
      if (!section) return `/docs/versions/${version}`;
      if (!fs.existsSync(path.join(versionArticlesDir(version), section))) {
        return `/docs/versions/${version}`;
      }
      if (!file || file === 'index') return `/docs/versions/${version}/${section}`;
      if (versionedArticleExists(version, section, file)) {
        return `/docs/versions/${version}/${section}/${file}`;
      }
      return `/docs/versions/${version}/${section}`;
    })();

    entries.push({ label: `${version} (archived)`, href: target, active: viewing === version });
  }

  return entries;
}

/** Load a versioned article: raw snapshot content plus parsed front matter. */
export function getVersionedArticleByPath(
  version: string,
  section: string,
  slug: string[] = []
): {
  content: string;
  frontmatter: { title?: string; [key: string]: any };
  navigation: Link[];
  version: string;
  section: string;
  file: string;
} | null {
  const file = slug.length > 0 ? slug[slug.length - 1] : 'index';
  const markdownPath = path.join(versionArticlesDir(version), section, `${file}.md`);

  if (!fs.existsSync(markdownPath)) {
    return null;
  }

  const { data: frontmatter, content } = matter(fs.readFileSync(markdownPath, 'utf8'));

  return {
    content,
    frontmatter,
    navigation: getVersionedNavigation(version, section),
    version,
    section,
    file,
  };
}
