import Link from "next/link";
import { notFound, redirect } from 'next/navigation';
import { capitalCase } from 'change-case';
import { getAllArticlePaths, getArticleByPath } from "../../../services/articleService";
import { getMetadata } from "../../../services/metadataService";
import ComingSoon from "../../../components/ComingSoon";
import CommandSnippet from "../../../components/CommandSnippet";
import Markdown from "../../../components/Markdown";

const dockerQuickRunCommand = `docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>`;

const primerPrimaryLinkClass =
    "inline-flex w-full items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-400 sm:w-auto";

const primerSecondaryLinkClass =
    "font-semibold text-blue-300 transition-colors hover:text-blue-200";

export async function generateStaticParams() {
    const paths = getAllArticlePaths();

    return paths.map((path) => ({
        section: path.section,
        slug: path.slug,
    }));
}

interface PageProps {
    params: Promise<{
        section: string;
        slug?: string[];
    }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { section, slug = [] } = await params;
    const articleData = getArticleByPath(section, slug);

    if (!articleData) {
        return {
            title: 'Documentation - DocumentDB',
        };
    }

    const { frontmatter, navigation, file } = articleData;
    const selectedNavItem = navigation.find((item) => item.link.includes(file));
    const pageTitle = frontmatter.title || selectedNavItem?.title || section;

    return getMetadata({
        title: `${pageTitle} - DocumentDB Documentation`,
        description: frontmatter.description || '',
        path: slug.length > 0 ? `/docs/${section}/${slug.join('/')}/` : `/docs/${section}/`,
        type: 'article',
    });
}

export default async function ArticlePage({ params }: PageProps) {
    const { section, slug = [] } = await params;
    const currentSlug = slug[slug.length - 1];

    if (section === 'getting-started' && currentSlug === 'prebuilt-packages') {
        redirect('/docs/getting-started/packages');
    }

    if (section === 'getting-started' && currentSlug === 'vscode-extension-guide') {
        redirect('/docs/getting-started/vscode-quickstart');
    }

    const articleData = getArticleByPath(section, slug);

    if (!articleData) {
        return notFound();
    }

    const { content, frontmatter, navigation, file } = articleData;
    const selectedNavItem = navigation.find((item) =>
        item.link.includes(file)
    );

    // Use title from frontmatter if available, otherwise fall back to navigation title or section name
    const pageTitle = frontmatter.title || selectedNavItem?.title || section;
    const showInstallPrimer = section === "getting-started" && file === "index";

    return (
        <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-16 right-20 w-36 h-36 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
                <div
                    className="absolute bottom-20 left-16 w-28 h-28 bg-purple-500 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "1.5s" }}
                ></div>
            </div>

            <div className="relative flex min-h-screen">
                {/* Left Sidebar */}
                <div className="w-80 bg-neutral-800/50 backdrop-blur-sm border-r border-neutral-700/50 flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-neutral-700/50">
                        <Link
                            href="/docs"
                            className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center transition-colors"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Back to Documentation
                        </Link>
                        <h1 className="text-2xl font-bold text-white">
                            {
                                capitalCase(section)
                                    .replace(/documentdb/i, 'DocumentDB')
                                    .replace(/api/i, 'API')
                            }
                        </h1>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <nav className="space-y-1">
                            {navigation.map((item) => {
                                // Better matching logic for active state
                                // For index files, match both /section and /section/index
                                // For other files, match the specific file name
                                const itemPath = item.link.replace('/docs/', '');
                                const currentPath = file === 'index' ? section : `${section}/${file}`;
                                const isActive = itemPath === currentPath ||
                                    (file === 'index' && itemPath === `${section}/index`) ||
                                    (item.link.includes(file) && file !== 'index');

                                return (
                                    <Link
                                        key={item.link}
                                        href={item.link}
                                        className={`block w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 ${isActive
                                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                            : "text-gray-300 hover:text-white hover:bg-neutral-700/50"
                                            }`}
                                    >
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl">
                        {/* Coming Soon Component for coming-soon layout */}
                        {frontmatter.layout === 'coming-soon' && <ComingSoon />}

                        {showInstallPrimer && (
                            <section className="mb-8 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-neutral-900/90 to-neutral-900/90 p-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                                    Recommended flow
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">
                                    Install and verify DocumentDB
                                </h2>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
                                    Choose one install path first. After DocumentDB is running, verify the
                                    connection with mongosh before moving to a driver quick start.
                                </p>
                                <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                                    <div className="mb-4 flex items-start gap-3">
                                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-xs font-semibold text-blue-200">
                                            1
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                Choose an install path
                                            </p>
                                            <p className="mt-1 text-sm text-gray-400">
                                                Use Docker for the fastest local setup, or Linux packages for a
                                                persistent host installation.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
                                            <p className="text-sm font-semibold text-white">
                                                Run locally with Docker
                                            </p>
                                            <p className="mt-2 text-sm text-gray-400">
                                                Best for evaluation, local development, and quick testing.
                                            </p>
                                            <div className="mt-4">
                                                <CommandSnippet command={dockerQuickRunCommand} label="Docker" />
                                            </div>
                                            <div className="mt-4">
                                                <Link
                                                    href="/docs/getting-started/docker"
                                                    className={primerPrimaryLinkClass}
                                                >
                                                    Docker Quick Start
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
                                            <p className="text-sm font-semibold text-white">
                                                Install from Linux packages
                                            </p>
                                            <p className="mt-2 text-sm text-gray-400">
                                                Use the repository-backed package flow when you want a persistent
                                                server install. Generate the exact apt or rpm command with the{" "}
                                                <Link href="/packages" className={primerSecondaryLinkClass}>
                                                    Package Finder
                                                </Link>
                                                .
                                            </p>
                                            <div className="mt-4">
                                                <Link
                                                    href="/docs/getting-started/packages"
                                                    className={primerPrimaryLinkClass}
                                                >
                                                    Linux Packages Quick Start
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-xs font-semibold text-blue-200">
                                            2
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white">
                                                Recommended: verify with mongosh
                                            </p>
                                            <p className="mt-1 text-sm text-gray-400">
                                                This is the fastest shared validation path after either install
                                                option because it confirms authentication, TLS, and a working
                                                endpoint before you add editor or driver setup. If you already
                                                know your target workflow, you can skip this and continue directly
                                                with VS Code or a driver quick start.
                                            </p>
                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                                                <Link
                                                    href="/docs/getting-started/mongo-shell-quickstart"
                                                    className={primerPrimaryLinkClass}
                                                >
                                                    Mongo Shell Quick Start
                                                </Link>
                                                <p className="text-sm text-gray-400">
                                                    Or go directly to{" "}
                                                    <Link
                                                        href="/docs/getting-started/vscode-quickstart"
                                                        className={primerSecondaryLinkClass}
                                                    >
                                                        Visual Studio Code Quick Start
                                                    </Link>
                                                    ,{" "}
                                                    <Link
                                                        href="/docs/getting-started/nodejs-setup"
                                                        className={primerSecondaryLinkClass}
                                                    >
                                                        Node.js Quick Start
                                                    </Link>{" "}
                                                    or{" "}
                                                    <Link
                                                        href="/docs/getting-started/python-setup"
                                                        className={primerSecondaryLinkClass}
                                                    >
                                                        Python Quick Start
                                                    </Link>
                                                    .
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Markdown Content */}
                        <Markdown content={content} />
                    </div>
                </div>
            </div>
        </div>
    );
}
