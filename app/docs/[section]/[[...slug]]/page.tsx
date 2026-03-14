import Link from "next/link";
import { notFound } from 'next/navigation';
import { capitalCase } from 'change-case';
import { getAllArticlePaths, getArticleByPath } from "../../../services/articleService";
import ComingSoon from "../../../components/ComingSoon";
import Markdown from "../../../components/Markdown";

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

    return {
        title: `${pageTitle} - DocumentDB Documentation`,
        description: frontmatter.description || undefined,
    };
}

export default async function ArticlePage({ params }: PageProps) {
    const { section, slug = [] } = await params;
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

    // Build the current path for the markdown component to resolve relative links
    const currentPath = file === 'index' ? `${section}/index` : `${section}/${slug.join('/')}`;

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

                        {/* Markdown Content */}
                        <Markdown content={content} currentPath={currentPath} />
                    </div>
                </div>
            </div>
        </div>
    );
}
