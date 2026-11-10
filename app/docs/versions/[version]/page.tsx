import Link from "next/link";
import { notFound } from "next/navigation";
import {
    formatSectionTitle,
    getDocVersions,
    getVersionedSections,
    getVersionSwitcherEntries,
    orderSections,
} from "../../../services/versionService";
import DocsBreadcrumb from "../../../components/DocsBreadcrumb";
import VersionSwitcher from "../../../components/VersionSwitcher";

export async function generateStaticParams() {
    return getDocVersions().map((version) => ({ version }));
}

interface PageProps {
    params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { version } = await params;
    return {
        title: `${version} Documentation - DocumentDB`,
        description: `Archived DocumentDB documentation for ${version}.`,
        robots: { index: false, follow: false },
    };
}

export default async function VersionLandingPage({ params }: PageProps) {
    const { version } = await params;
    const sections = orderSections(getVersionedSections(version));

    if (sections.length === 0) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>

            <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-8">
                <DocsBreadcrumb
                    crumbs={[{ title: "Docs", href: "/docs" }, { title: version }]}
                />

                <div className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-200">
                        This is the frozen documentation snapshot for{" "}
                        <span className="font-semibold">{version}</span>. It is not updated
                        and may not reflect the latest release.{" "}
                        <Link href="/docs" className="font-semibold text-amber-100 underline hover:text-white">
                            Switch to the current documentation →
                        </Link>
                    </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white">
                            DocumentDB {version} Documentation
                        </h1>
                        <p className="mt-3 text-gray-400">
                            Documentation sections exactly as they were at the {version}{" "}
                            release.
                        </p>
                    </div>
                    <div className="w-full sm:w-64">
                        <VersionSwitcher entries={getVersionSwitcherEntries(version, null, null)} />
                    </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {sections.map((section) => (
                        <Link
                            key={section}
                            href={`/docs/versions/${version}/${section}`}
                            className="rounded-xl border border-neutral-700/60 bg-neutral-800/50 p-5 transition-colors hover:border-blue-500/50 hover:bg-neutral-800"
                        >
                            <p className="font-semibold text-white">{formatSectionTitle(section)}</p>
                            <p className="mt-1 text-sm text-gray-400">
                                Browse this section as of {version}
                            </p>
                        </Link>
                    ))}
                </div>

                <p className="mt-10 text-sm text-gray-500">
                    The API Reference is maintained on the current documentation only —{" "}
                    <Link href="/docs/reference" className="text-blue-400 hover:text-blue-300">
                        open the current API Reference
                    </Link>
                    . Looking for a different version? See{" "}
                    <Link href="/docs/versions" className="text-blue-400 hover:text-blue-300">
                        all documentation versions
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
