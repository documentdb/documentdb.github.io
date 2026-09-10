import Link from "next/link";
import VersionSwitcher from "./VersionSwitcher";
import { VersionSwitcherEntry } from "../services/versionService";

export interface SidebarNavItem {
    title: string;
    href: string;
    active?: boolean;
}

export interface DocsSidebarProps {
    /** null when viewing current docs; the version label on archived pages. */
    version: string | null;
    /** Where the top back link goes: /docs for current, /docs/versions/<v> for a version. */
    backHref: string;
    backLabel: string;
    sectionTitle: string;
    /** Pages of the section being viewed. */
    nav: SidebarNavItem[];
    /** All sections in the SAME version context (never leaves the version). */
    sections: SidebarNavItem[];
    switcherEntries: VersionSwitcherEntry[];
}

function navLinkClass(active?: boolean): string {
    return `block w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${active
        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
        : "text-gray-300 hover:text-white hover:bg-neutral-700/50"
        }`;
}

/**
 * Shared sidebar for current and versioned documentation pages. Every link in
 * it stays inside the version being viewed, so readers never fall out of an
 * archived version by navigating.
 */
export function DocsSidebarContent({
    version,
    backHref,
    backLabel,
    sectionTitle,
    nav,
    sections,
    switcherEntries,
}: DocsSidebarProps) {
    return (
        <>
            {/* Header: back link + section title + version state */}
            <div className="p-6 border-b border-neutral-700/50">
                <Link
                    href={backHref}
                    className="text-blue-400 hover:text-blue-300 text-sm mb-3 flex items-center transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {backLabel}
                </Link>
                <p className="text-2xl font-bold text-white">{sectionTitle}</p>
                {version && (
                    <p className="mt-1 inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                        {version} · archived
                    </p>
                )}
                <div className="mt-4">
                    <VersionSwitcher entries={switcherEntries} />
                </div>
            </div>

            {/* Section pages */}
            <div className="flex-1 p-4 overflow-y-auto">
                <nav className="space-y-1">
                    {nav.map((item) => (
                        <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
                            {item.title}
                        </Link>
                    ))}
                </nav>

                {/* Other sections, same version context */}
                {sections.length > 0 && (
                    <div className="mt-6 border-t border-neutral-700/50 pt-4">
                        <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            All sections
                        </p>
                        <nav className="space-y-1">
                            {sections.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`block w-full px-4 py-2 rounded-lg text-sm transition-colors ${item.active
                                        ? "text-white font-medium"
                                        : "text-gray-400 hover:text-white hover:bg-neutral-700/40"
                                        }`}
                                >
                                    {item.title}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            {/* Footer meta links */}
            <div className="p-4 border-t border-neutral-700/50 space-y-1">
                <Link
                    href="/docs/release-notes"
                    className="block px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    Release notes
                </Link>
                <Link
                    href="/docs/versions"
                    className="block px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    All documentation versions
                </Link>
            </div>
        </>
    );
}

/** Desktop sidebar wrapper. */
export default function DocsSidebar(props: DocsSidebarProps) {
    return (
        <div className="hidden w-80 bg-neutral-800/50 backdrop-blur-sm border-r border-neutral-700/50 md:flex flex-col">
            <DocsSidebarContent {...props} />
        </div>
    );
}

/** Mobile disclosure variant of the same navigation. */
export function DocsSidebarMobile(props: DocsSidebarProps) {
    return (
        <details className="mb-6 rounded-lg border border-neutral-700/50 bg-neutral-800/50 md:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-200">
                {props.sectionTitle} navigation
                {props.version ? ` (${props.version})` : ""}
            </summary>
            <div className="border-t border-neutral-700/50 flex flex-col">
                <DocsSidebarContent {...props} />
            </div>
        </details>
    );
}
