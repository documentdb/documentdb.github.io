import Link from "next/link";
import { notFound } from "next/navigation";
import {
    formatSectionTitle,
    getAllVersionedArticlePaths,
    getVersionedArticleByPath,
    getVersionedSections,
    getVersionSwitcherEntries,
    keepDocsLinksInVersion,
    orderSections,
} from "../../../../../services/versionService";
import Markdown from "../../../../../components/Markdown";
import DocsSidebar, { DocsSidebarMobile } from "../../../../../components/DocsSidebar";
import DocsBreadcrumb from "../../../../../components/DocsBreadcrumb";

export async function generateStaticParams() {
    return getAllVersionedArticlePaths().map((path) => ({
        version: path.version,
        section: path.section,
        slug: path.slug,
    }));
}

interface PageProps {
    params: Promise<{
        version: string;
        section: string;
        slug?: string[];
    }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { version, section, slug = [] } = await params;
    const articleData = getVersionedArticleByPath(version, section, slug);
    const pageTitle = articleData?.frontmatter.title || section;

    return {
        title: `${pageTitle} (${version}) - DocumentDB Documentation`,
        description: articleData?.frontmatter.description || "",
        // Archived versions must never outrank the current documentation in
        // search results.
        robots: { index: false, follow: false },
    };
}

export default async function VersionedArticlePage({ params }: PageProps) {
    const { version, section, slug = [] } = await params;
    const articleData = getVersionedArticleByPath(version, section, slug);

    if (!articleData) {
        return notFound();
    }

    const { content, frontmatter, navigation, file } = articleData;
    const pageTitle = frontmatter.title || section;
    const sectionTitle = formatSectionTitle(section);
    const switcherEntries = getVersionSwitcherEntries(version, section, file);
    const currentEquivalent =
        switcherEntries.find((entry) => entry.label.startsWith("Current"))?.href ?? "/docs";

    // Sidebar and breadcrumb stay inside the version; the banner and switcher
    // deliberately exit. Absolute documentdb.io links in the snapshot's own
    // Markdown still reach current docs, because snapshots are never rewritten.
    const navItems = navigation.map((item) => {
        const isActive =
            file === "index"
                ? item.link === `/docs/versions/${version}/${section}`
                : item.link.endsWith(`/${file}`);
        return { title: item.title, href: item.link, active: isActive };
    });

    const sectionItems = [
        ...orderSections(getVersionedSections(version)).map((s) => ({
            title: formatSectionTitle(s),
            href: `/docs/versions/${version}/${s}`,
            active: s === section,
        })),
        // The API Reference only exists on current docs; keep it visible from
        // archived context but labeled as an exit from the version.
        { title: "API Reference (current docs ↗)", href: "/docs/reference", active: false },
    ];

    const sidebarProps = {
        version,
        backHref: `/docs/versions/${version}`,
        backLabel: `${version} documentation home`,
        sectionTitle,
        nav: navItems,
        sections: sectionItems,
        switcherEntries,
    };

    const breadcrumbs = [
        { title: "Docs", href: "/docs" },
        { title: version, href: `/docs/versions/${version}` },
        ...(file === "index"
            ? [{ title: sectionTitle }]
            : [
                { title: sectionTitle, href: `/docs/versions/${version}/${section}` },
                { title: pageTitle },
            ]),
    ];

    // overflow-clip, not hidden: a scroll container here would stop the archive bar from sticking.
    return (
        <div className="min-h-screen bg-neutral-900 relative overflow-clip">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>

            <div className="relative flex min-h-screen">
                <DocsSidebar {...sidebarProps} />

                {/* Main Content */}
                <div className="min-w-0 flex-1 p-4 sm:p-8 overflow-x-clip">
                    <div className="max-w-4xl">
                        <DocsSidebarMobile {...sidebarProps} />

                        <DocsBreadcrumb crumbs={breadcrumbs} />

                        {/* Sticks under the navbar, so readers who scroll or land on a section link keep seeing the version. */}
                        <div className="sticky top-16 z-30 mb-2 flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-950/95 px-4 py-2 backdrop-blur sm:top-[72px] md:top-16">
                            <p className="min-w-0 text-sm text-amber-200">
                                <span className="font-semibold">Archived {version} docs</span>
                                <span className="hidden sm:inline"> · not updated</span>
                            </p>
                            <Link
                                href={currentEquivalent}
                                className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/30"
                            >
                                View current →
                            </Link>
                        </div>
                        <p className="mb-6 text-sm text-gray-400">
                            Frozen as of the {version} release. Downloads and other site pages
                            link to the current release.
                        </p>

                        {/* Headings reached by a link must clear both the navbar and the archive bar. */}
                        <div className="[&_a[id]]:scroll-mt-32">
                            <Markdown
                                content={keepDocsLinksInVersion(content, version, { section, file })}
                                sourcePath={`/docs/versions/${version}/${section}/${file}.md`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
