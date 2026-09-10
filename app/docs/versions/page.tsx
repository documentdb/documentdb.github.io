import Link from "next/link";
import { getMetadata } from "../../services/metadataService";
import { getDocVersions } from "../../services/versionService";
import { CURRENT_RELEASE_TAG } from "../../lib/currentRelease";
import DocsBreadcrumb from "../../components/DocsBreadcrumb";

export async function generateMetadata() {
    return getMetadata({
        title: "Documentation Versions - DocumentDB",
        description:
            "Browse DocumentDB documentation for the current release or archived snapshots of previous versions.",
        path: "/docs/versions/",
    });
}

export default function VersionsPage() {
    const hostedVersions = getDocVersions();

    return (
        <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>

            <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-8">
                <DocsBreadcrumb
                    crumbs={[{ title: "Docs", href: "/docs" }, { title: "Versions" }]}
                />
                <h1 className="text-4xl font-bold text-white">Documentation Versions</h1>
                <p className="mt-3 max-w-2xl text-gray-400">
                    The documentation site always describes the latest DocumentDB release,
                    with in-page annotations (&quot;added in&quot;, &quot;default changed
                    in&quot;) covering recent changes. Frozen snapshots are hosted for
                    recent versions; older versions remain browsable as git tags.
                </p>

                <div className="mt-10 space-y-4">
                    {/* Current */}
                    <Link
                        href="/docs"
                        className="block rounded-xl border border-blue-500/40 bg-blue-500/10 p-5 transition-colors hover:bg-blue-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-white">
                                    Current &mdash; {CURRENT_RELEASE_TAG}{" "}
                                    <span className="ml-2 rounded-full bg-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-200">
                                        latest release
                                    </span>
                                </p>
                                <p className="mt-1 text-sm text-gray-400">
                                    Continuously updated documentation for the latest DocumentDB
                                    release.
                                </p>
                            </div>
                            <span className="text-blue-400">→</span>
                        </div>
                    </Link>

                    {/* Hosted snapshots */}
                    {hostedVersions.map((version) => (
                        <Link
                            key={version}
                            href={`/docs/versions/${version}`}
                            className="block rounded-xl border border-neutral-700/60 bg-neutral-800/50 p-5 transition-colors hover:border-neutral-500"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-white">
                                        {version}{" "}
                                        <span className="ml-2 rounded-full bg-neutral-700 px-2 py-0.5 text-xs font-medium text-gray-300">
                                            archived snapshot
                                        </span>
                                    </p>
                                    <p className="mt-1 text-sm text-gray-400">
                                        Frozen documentation as of the {version} release. Not
                                        updated.
                                    </p>
                                </div>
                                <span className="text-gray-500">→</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-10 rounded-xl border border-neutral-700/60 bg-neutral-800/30 p-5">
                    <p className="font-semibold text-white">Older versions</p>
                    <p className="mt-1 text-sm text-gray-400">
                        Documentation for versions that are no longer hosted here is
                        preserved as git tags on the docs repository — browse the Markdown
                        exactly as it was at that release.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <a
                            href="https://github.com/documentdb/docs/tags"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                        >
                            Docs repository tags →
                        </a>
                        <a
                            href="https://github.com/documentdb/documentdb/releases"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                        >
                            DocumentDB releases →
                        </a>
                        <Link href="/docs/release-notes" className="text-blue-400 hover:text-blue-300">
                            Release notes →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
