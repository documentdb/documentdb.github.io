import Link from "next/link";
import { notFound } from "next/navigation";
import {
    formatSectionTitle,
    getAllVersionedArticlePaths,
    getVersionedArticleByPath,
    getVersionedSections,
    getVersionSwitcherEntries,
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

    // Every navigation element on this page stays inside the version: the back
    // link goes to the version home, section links stay under /docs/versions/<v>/,
    // and only the banner/switcher deliberately exit to current.
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

    return (
        <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>

            <div className="relative flex min-h-screen">
                <DocsSidebar {...sidebarProps} />

                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    <div className="max-w-4xl">
                        <DocsSidebarMobile {...sidebarProps} />

                        <DocsBreadcrumb crumbs={breadcrumbs} />

                        {/* Old-version banner */}
                        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-amber-200">
                                You are viewing the frozen documentation for{" "}
                                <span className="font-semibold">{version}</span>. It is not
                                updated and may not reflect the latest release.
                            </p>
                            <Link
                                href={currentEquivalent}
                                className="inline-flex shrink-0 items-center rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30 transition-colors"
                            >
                                View current version →
                            </Link>
                        </div>

                        <Markdown
                            content={content}
                            sourcePath={`/docs/versions/${version}/${section}/${file}.md`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
