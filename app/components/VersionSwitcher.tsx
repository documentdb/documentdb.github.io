import Link from "next/link";
import { VersionSwitcherEntry } from "../services/versionService";

/**
 * Static version dropdown shown on every documentation page. Server-rendered
 * (a <details> disclosure, no client JS) so it works in the static export.
 * The active entry is marked; every other entry links to the best equivalent
 * of the page being viewed in that version.
 */
export default function VersionSwitcher({ entries }: { entries: VersionSwitcherEntry[] }) {
    const active = entries.find((entry) => entry.active);

    return (
        <details className="relative block text-left">
            <summary className="cursor-pointer list-none flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-700/60 bg-neutral-900/60 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:border-neutral-500 transition-colors">
                <span className="inline-flex items-center gap-2 truncate">
                    <svg className="h-3.5 w-3.5 shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 7h10M7 12h10M7 17h6" />
                    </svg>
                    {active?.label ?? "Select version"}
                </span>
                <svg className="h-3 w-3 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </summary>
            <div className="absolute z-20 mt-2 w-full min-w-56 rounded-lg border border-neutral-700/60 bg-neutral-800 p-1 shadow-xl">
                {entries.map((entry) =>
                    entry.active ? (
                        <span
                            key={entry.label}
                            className="block rounded-md px-3 py-2 text-xs font-semibold text-white bg-neutral-700/40"
                        >
                            {entry.label} ✓
                        </span>
                    ) : (
                        <Link
                            key={entry.label}
                            href={entry.href}
                            className="block rounded-md px-3 py-2 text-xs text-gray-300 hover:bg-neutral-700/60 hover:text-white transition-colors"
                        >
                            {entry.label}
                        </Link>
                    )
                )}
                <Link
                    href="/docs/versions"
                    className="block rounded-md px-3 py-2 text-xs text-blue-400 hover:bg-neutral-700/60 hover:text-blue-300 transition-colors border-t border-neutral-700/60 mt-1 pt-2"
                >
                    All versions →
                </Link>
            </div>
        </details>
    );
}
