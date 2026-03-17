import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { Article } from '../types/Article';
import { Link } from '../types/Link';
import { buildAptInstallCommand, buildRpmInstallCommand } from '../lib/packageInstall';

const articlesDirectory = path.join(process.cwd(), 'articles');
const dockerGuideContent = `# Docker

Run DocumentDB locally in minutes using Docker.

## Start DocumentDB

\`\`\`bash
docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>
\`\`\`

> Replace \`<YOUR_USERNAME>\` and \`<YOUR_PASSWORD>\` with your own credentials.
>
> DocumentDB Local loads built-in sample data into \`sampledb\` by default. See
> [DocumentDB Local](/docs/documentdb-local) for \`--skip-init-data\`,
> \`--init-data-path\`, and certificate options.

## Verify the container

\`\`\`bash
docker ps --filter "name=documentdb"
\`\`\`

## Next steps

- [Node.js Setup Guide](/docs/getting-started/nodejs-setup)
- [Python Setup Guide](/docs/getting-started/python-setup)
- [Linux Packages Guide](/docs/getting-started/packages)
- [Package Finder](/packages)
`;

const linuxPackagesGuideContent = `# Linux Packages

Install DocumentDB on Linux hosts with apt/rpm packages.

## Fastest path

Use the [Package Finder](/packages) to generate the exact install command for your distro, architecture, and PostgreSQL version.

> The repository-backed install commands currently cover Ubuntu 22.04/24.04, Debian 11/12, and RHEL-family 8/9 systems. Debian 13 packages are available as direct downloads from GitHub Releases while the APT repository component is being published. Debian 11 currently resolves PostgreSQL 16 and 17 in the repository-backed flow.

## APT example

\`\`\`bash
${buildAptInstallCommand('ubuntu24', 'amd64', '16')}
\`\`\`

## RPM example

\`\`\`bash
${buildRpmInstallCommand('rhel9', 'x86_64', '16')}
\`\`\`

## Next steps

- [Docker Quick Start](/docs/getting-started/docker)
- [Node.js Setup Guide](/docs/getting-started/nodejs-setup)
- [Python Setup Guide](/docs/getting-started/python-setup)
`;

const documentdbLocalDataInitializationContent = `## Data initialization

DocumentDB Local starts with built-in sample data by default. The container creates a
\`sampledb\` database with the \`users\`, \`products\`, \`orders\`, and \`analytics\`
collections so you can explore queries right away.

### Control initialization behavior

| Requirement | Arg | Env | Default | Description |
|---|---|---|---|---|
| Skip built-in sample data | \`--skip-init-data\` | \`SKIP_INIT_DATA\` | \`false\` | Start without loading the default sample collections. |
| Run custom initialization scripts | \`--init-data-path [PATH]\` | \`INIT_DATA_PATH\` | \`/init_doc_db.d\` | Execute every \`.js\` file in the mounted directory with \`mongosh\`. |

The built-in sample dataset currently includes 5 users, 5 products, 4 orders, and 2
analytics records.

### Use custom initialization scripts

\`\`\`bash
docker run -dt --name documentdb \\
  -p 10260:10260 \\
  -v /path/to/init/scripts:/init_doc_db.d \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD> \\
  --init-data-path /init_doc_db.d
\`\`\`

When \`--init-data-path\` is provided, DocumentDB Local skips the built-in sample data
and runs only the scripts you mounted.
`;

function splitPrebuiltNavigation(section: string, links: Link[]): Link[] {
  if (section !== 'getting-started') {
    return links;
  }

  const isPrebuiltPackages = (link: Link) =>
    link.link.includes('prebuilt-packages') || /pre-built packages/i.test(link.title);
  const gettingStartedQuickLinks: Link[] = [
    {
      title: 'Docker',
      link: '/docs/getting-started/docker',
    },
    {
      title: 'Linux Packages',
      link: '/docs/getting-started/packages',
    },
  ];
  const filteredLinks = links.filter((link) => !isPrebuiltPackages(link));
  const gettingStartedIndex = filteredLinks.find((link) => link.link === 'index.md');

  if (!gettingStartedIndex) {
    return [...gettingStartedQuickLinks, ...filteredLinks];
  }

  const remainingLinks = filteredLinks.filter((link) => link !== gettingStartedIndex);
  return [gettingStartedIndex, ...gettingStartedQuickLinks, ...remainingLinks];
}

function updateGettingStartedIndexContent(content: string): string {
  return content.replace(
    /- \[Pre-built Packages\]\([^)]+\) - [^\n]+/i,
    '- [Docker](/docs/getting-started/docker) - Start DocumentDB locally with Docker\n- [Linux Packages](/docs/getting-started/packages) - Install via apt/rpm repositories'
  );
}

function updateDocumentDbLocalContent(content: string): string {
  if (/## Data initialization/i.test(content)) {
    return content;
  }

  if (/## Feature support/i.test(content)) {
    return content.replace(
      /## Feature support/i,
      `${documentdbLocalDataInitializationContent}\n\n## Feature support`
    );
  }

  return `${content}\n\n${documentdbLocalDataInitializationContent}`;
}

export function getArticleContent(): Article {
  const contentPath = path.join(articlesDirectory, 'content.yml');
  const fileContents = fs.readFileSync(contentPath, 'utf8');
  return yaml.load(fileContents) as Article;
}

export function getArticleNavigation(section: string): Link[] {
  const navPath = path.join(articlesDirectory, section, 'navigation.yml');

  if (!fs.existsSync(navPath)) {
    return [];
  }

  const fileContents = fs.readFileSync(navPath, 'utf8');
  const rawLinks = yaml.load(fileContents) as Link[];
  const normalizedLinks = splitPrebuiltNavigation(section, rawLinks);
  
  // Transform Markdown file links to published relative URIs
  return normalizedLinks.map(link => {
    // Convert .md file references to proper URIs
    // e.g., "index.md" -> "/docs/section"
    // e.g., "nodejs-setup.md" -> "/docs/section/nodejs-setup"
    let transformedLink = link.link;
    
    if (transformedLink.endsWith('.md')) {
      const filename = transformedLink.replace('.md', '');
      if (filename === 'index') {
        transformedLink = `/docs/${section}`;
      } else {
        transformedLink = `/docs/${section}/${filename}`;
      }
    }
    
    return {
      ...link,
      link: transformedLink,
      // Recursively transform children if they exist
      children: link.children?.map(child => ({
        ...child,
        link: child.link.endsWith('.md') 
          ? `/docs/${section}/${child.link.replace('.md', '')}`
          : child.link
      }))
    };
  });
}

export function getMarkdownContent(section: string, file: string = 'index'): string {
  const markdownPath = path.join(articlesDirectory, section, `${file}.md`);

  if (!fs.existsSync(markdownPath)) {
    return '';
  }

  return fs.readFileSync(markdownPath, 'utf8');
}

export function getAllSections(): string[] {
  const sections = fs.readdirSync(articlesDirectory, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  return sections;
}

export function getAllArticlePaths(): { section: string; slug: string[] }[] {
  const sections = getAllSections();
  const paths: { section: string; slug: string[] }[] = [];

  sections.forEach(section => {
    const sectionPath = path.join(articlesDirectory, section);
    const files = fs.readdirSync(sectionPath, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
      .map(dirent => dirent.name.replace('.md', ''));

    files.forEach(file => {
      if (file === 'index') {
        // For index files, create both /section and /section/index routes
        paths.push({ section, slug: [] });
      } else {
        paths.push({ section, slug: [file] });
      }
    });

    if (section === 'getting-started') {
      paths.push({ section, slug: ['docker'] });
      paths.push({ section, slug: ['packages'] });
    }
  });

  const uniquePaths = new Map<string, { section: string; slug: string[] }>();
  paths.forEach((entry) => {
    const key = `${entry.section}/${entry.slug.join('/')}`;
    uniquePaths.set(key, entry);
  });

  return Array.from(uniquePaths.values());
}

export function getArticleByPath(section: string, slug: string[] = []): {
  content: string;
  frontmatter: {
    title?: string;
    [key: string]: any;
  };
  navigation: Link[];
  section: string;
  file: string;
} | null {
  const file = slug.length > 0 ? slug[slug.length - 1] : 'index';
  const navigation = getArticleNavigation(section);

  if (section === 'getting-started' && file === 'docker') {
    return {
      content: dockerGuideContent,
      frontmatter: {
        title: 'Docker',
        description: 'Run DocumentDB locally using Docker.',
      },
      navigation,
      section,
      file,
    };
  }

  if (section === 'getting-started' && file === 'packages') {
    return {
      content: linuxPackagesGuideContent,
      frontmatter: {
        title: 'Linux Packages',
        description: 'Install DocumentDB via apt and rpm packages.',
      },
      navigation,
      section,
      file,
    };
  }

  const rawContent = getMarkdownContent(section, file);
  
  if (!rawContent) {
    return null;
  }

  // Parse front matter
  const { data: frontmatter, content } = matter(rawContent);
  let normalizedContent = content;

  if (section === 'getting-started' && file === 'index') {
    normalizedContent = updateGettingStartedIndexContent(normalizedContent);
  }

  if (section === 'documentdb-local' && file === 'index') {
    normalizedContent = updateDocumentDbLocalContent(normalizedContent);
  }

  return {
    content: normalizedContent,
    frontmatter,
    navigation,
    section,
    file
  };
}
