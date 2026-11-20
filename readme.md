# DocumentDB Website

A modern website for DocumentDB built with [Next.js](https://nextjs.org/) for the main site and [Jekyll](https://jekyllrb.com/) for the Announcements (`/announcements/`) and Blogs (`/blogs/`) sections. The site features project news, community blog posts, and technical documentation, with documentation content automatically pulled from the [documentdb/docs](https://github.com/documentdb/docs) repository during the build process.

## LLM Access and Discovery

[public/llms.txt](public/llms.txt) is published at `/llms.txt` by the Next.js static export. It welcomes LLMs and AI assistants to access all public site content and provides links to documentation, Announcements, Blogs, the sitemap, and source repositories. Keep these links current when site sections change.

This is a discovery guide, not an access-control mechanism or a replacement for existing content licenses and website terms. [public/robots.txt](public/robots.txt) already allows all crawlers.

### Content metadata

Use `last_modified_at` only for an actual content update, not a deployment. Optional `applies_to` text states the guide's release/deployment scope. Next.js and Jekyll publish explicit update dates in article metadata and structured data; the sitemap uses those dates and omits `lastmod` when provenance is unavailable. Imported pages with `layout: coming-soon` remain reachable but are not indexed or included in the sitemap.

### Measuring discovery and task completion

Use the following fixed prompt set for manual evaluations. Record platform/model, date, exact prompt, cited URLs, factual errors and execution results. Repeat each prompt at least three times and keep **correct product identification**, **official-source citation**, and **successful task completion** as separate outcomes. For task prompts, use disposable databases and record the engine/gateway release, driver versions and environment; a plausible answer is not a successful execution.

| Category | Fixed prompts |
| --- | --- |
| Identity | What is the open-source DocumentDB project? / Is documentdb.io Amazon DocumentDB? / How does DocumentDB differ from Azure DocumentDB? / Is Azure Cosmos DB the same engine as open-source DocumentDB? |
| Evaluation | Can I replace MongoDB with open-source DocumentDB? / Which MongoDB commands and options are supported? / Does open-source DocumentDB support change streams? / What are DocumentDB's transaction limitations? |
| Installation | Install DocumentDB locally without JavaScript. / Install DocumentDB on Ubuntu 24.04 with PostgreSQL 18. / Install DocumentDB on Rocky Linux 9. / Verify that a DocumentDB instance can insert and read a document. |
| Architecture | How do DocumentDB's gateway and PostgreSQL extensions fit together? / Does installing only the extension expose a MongoDB endpoint? / Should I use DocumentDB or PostgreSQL JSONB? / How do I find the actual DocumentDB engine version? |
| AI and agents | Create a vector index and retrieve stored context. / What are DocumentDB's filtered vector search limitations? / How can a coding agent use DocumentDB locally? / How do I add persistent MCP memory with DocumentDB? |

Save evaluation results outside the published site, compare a small changed-page cohort with unchanged pages, and repeat before expanding content. Private search-console data, referral analytics and verified crawler logs can supplement these observations; the static site does not collect model citation or task-success measurements automatically.

## Prerequisites for Development

- **[Node.js](https://nodejs.org/)** (*20 or higher*)

- **[Ruby](https://www.ruby-lang.org/)** with **Bundler** (*for the Jekyll-powered content sections*)

- **[Git](https://git-scm.com/)** (*for cloning documentation content*)

You can develop locally on any machine with these prerequisites installed, or use [GitHub Codespaces](#develop-in-github-codespaces) for a pre-configured environment.

## Getting Started

Get started by cloning and running this repository locally.

1. Clone this repository

1. Install dependencies:

    ```bash
    npm install
    ```

1. Install Ruby dependencies:

    ```bash
    bundle install
    ```

1. Start the Next.js development server:

    ```bash
    npm run dev
    ```

1. For a full static preview, including Announcements and Blogs:

    ```bash
    npm run build
    npm run start
    ```

1. Observe that the preview site will be available at http://localhost:3000

The first time you run `npm run dev` or `npm run build`, documentation content will be automatically compiled from the [documentdb/docs](https://github.com/documentdb/docs) repository.

## Contributing

We welcome contributions to improve the DocumentDB website, whether it's blog posts, bug fixes, or enhancements to the site itself.

### Running checks

```bash
npm run lint
npm test
```

CI runs tests before compiling upstream documentation. Use self-contained fixtures for imported-content tests rather than depending on the generated `articles/` or `reference/` trees, which are absent on a fresh checkout.

### Contributing Announcements and Blog Posts

Announcements and blog posts are managed locally in this repository. Contribute directly through a pull request to this repository.

Choose a `section` by topic, regardless of where the article is hosted:

- `announcements`: project news, launches, releases, and community milestones.
- `blogs`: explainers, tutorials, technical deep dives, and community perspectives.

Release announcement posts should specify `section: announcements`; the `featured` and `release_post` flags continue to control card emphasis.

The two navigation tabs link to separate static HTML pages, so readers and crawlers can follow their links without JavaScript. Existing local article URLs remain under `/blogs/posts/`, and `/blogs/feed.xml` continues to include all local posts from both sections for existing subscribers.

The listing pages live in the top-level [announcements/](announcements/) and [blogs/](blogs/) directories. Both share the templates, post metadata, and articles under `blogs/`. `npm run build:blogs` builds both directories in a temporary Jekyll site and publishes only `out/announcements/` and `out/blogs/`, preserving the rest of the Next.js export. Set `NEXT_BASE_PATH=/preview` for a prefixed deployment; the existing `JEKYLL_BASE_PATH=/preview/blogs` setting is also supported when `NEXT_BASE_PATH` is unset.

You can publish content in two ways:

1. **Markdown posts hosted in this repo**

   Add a new file under `blogs/_posts/` using the Jekyll naming format:

   ```text
   blogs/_posts/YYYY-MM-DD-my-post-title.md
   ```

   Start it with front matter like:

   ```yaml
   ---
   title: My Blog Post
   description: One-line summary used in the blog card.
   date: 2026-03-19
   featured: false
   author: Your Name
   category: documentdb-blog
   section: blogs
   cover_image: /blogs/assets/images/posts/my-post-title/hero.png
   cover_image_alt: Short description of the image
   tags:
     - Example
     - Markdown
   ---
   ```

   Store post images under:

   ```text
   blogs/assets/images/posts/my-post-title/
   ```

   Then write the post body in Markdown. Jekyll renders the post page and includes it only in the selected section, using the same card layout for both sections. Local posts default to `section: blogs` when it is omitted; set `section: announcements` for news. `category` identifies the publication and controls the card styling, not the section. Images can be referenced directly from Markdown, for example:

   ```md
   ![Architecture diagram]({{ '/blogs/assets/images/posts/my-post-title/diagram.png' | relative_url }})
   ```

1. **Curated external articles**

   Open [blogs/_data/posts.yml](blogs/_data/posts.yml) and add a new entry following the existing YAML format when you want the card to link to an article hosted elsewhere. Every external entry must specify `section: announcements` or `section: blogs`.

1. Submit a pull request for review

### Contributing Documentation & Reference Content

Documentation articles and API reference content are managed in a separate repository. For more information, see [documentdb/docs](https://github.com/documentdb/docs).

> [!IMPORTANT]
> Please refer to that repository for instructions on contributing:
>
> - Documentation articles (`getting-started/`, `postgres-api/`, `architecture/`, etc.)
> - API reference content (`api-reference/`)
>

### Testing the Deployment Workflow in a Fork

The [deployment workflow](.github/workflows/continuous-deployment.yml) builds the static site, mirrors the DocumentDB release packages into APT and YUM repositories, signs those repositories, and publishes everything to GitHub Pages.

Only the static site build is mandatory. Packaging and signing are resolved automatically at the start of the run, so a fork with no repository secrets can exercise the whole workflow:

1. Enable GitHub Pages in your fork (**Settings** > **Pages** > **Source**: *GitHub Actions*)

1. Push to `main` in your fork, or run the workflow manually from the **Actions** tab

1. Check the run summary, which reports which optional features were enabled and why

The two optional halves are controlled independently:

| Setting | Type | Default | Effect when enabled |
| --- | --- | --- | --- |
| `BUILD_PACKAGES` | Variable | On in `documentdb/documentdb.github.io`, off in forks | Downloads the release `.deb` and `.rpm` assets and builds the APT and YUM repositories |
| `GPG_PRIVATE_KEY` | Secret | *unset* | Signs the APT `Release` file and the RPM metadata, and publishes `documentdb-archive-keyring.gpg` |
| `DOCUMENTDB_VERSION` | Variable | `latest` | Release tag the `stable` channel mirrors |
| `DOCUMENTDB_LATEST_VERSION` | Variable | `latest` | Release tag the `latest` channel mirrors |

Set `BUILD_PACKAGES` to `true` in your fork if you specifically want to test the packaging path; signing is then skipped unless you also add your own `GPG_PRIVATE_KEY`.

> [!IMPORTANT]
> Signing is optional, but it never fails quietly. When `GPG_PRIVATE_KEY` is set, the run fails if the key cannot be imported or the signatures are not produced. Publishing an unsigned repository over a signed one breaks `apt-get update` for every client that already trusts the keyring.

## Content Configuration

Documentation content is automatically compiled during builds from external repositories. The mapping is configured in [content.config.json](content.config.json).

```json
{
  "sources": [
    {
      "repository": "https://github.com/documentdb/docs",
      "branch": "main",
      "mappings": [
        {
          "source": "api-reference",
          "target": "reference"
        },
        {
          "source": "getting-started",
          "target": "articles/getting-started"
        }
      ]
    }
  ],
  "include": ["**/*.md", "**/*.yml"],
  "exclude": ["**/{readme,README}.md"]
}
```

### Configuration options

The `content.config.json` file controls how documentation is compiled from external sources into this site.

- **sources** - Array of repositories to clone content from. Each source includes:
  - **repository** - Git repository URL
  - **branch** - Git branch to clone from
  - **mappings** - Array of source folder to target folder mappings
- **include** - Array of glob patterns for files to include (opt-in filtering)
- **exclude** - Array of glob patterns for files to exclude

### Manual content operations

While content is automatically compiled during builds, you can manually trigger these operations during development:

```bash
# Build the full static site artifact
npm run build
```

```bash
# Start the static preview server
npm run start
```

## Develop in GitHub Codespaces

Launch a pre-configured development environment with all dependencies installed:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/documentdb/documentdb.github.io)

The Codespaces environment includes:
- Node.js 20
- Git
- Visual Studio Code extensions for Markdown and YAML editing
- All npm dependencies

Simply run `npm run dev` after the container starts.
