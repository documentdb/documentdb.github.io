import Link from "next/link";
import CommandSnippet from "../components/CommandSnippet";
import TelemetryNote from "../components/TelemetryNote";
import {
  documentdbDiscordUrl,
  documentdbKubernetesOperatorQuickStartUrl,
  documentdbReleaseAnnouncementUrl,
  documentdbVsCodeLocalQuickStartDeepLink,
} from "../services/externalLinks";
import { getMetadata, siteUrl } from "../services/metadataService";
import { withBasePath } from "../services/sitePath";

const pageTitle = "DocumentDB 1.0 - Generally Available";
const pageDescription =
  "DocumentDB 1.0 is generally available: the MIT-licensed, MongoDB-compatible document database built on PostgreSQL. Install it with Docker, Linux packages, VS Code, or Kubernetes.";
const baseMetadata = getMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/v1/",
  extraKeywords: ["DocumentDB 1.0", "release", "GA", "generally available"],
});
// The promoted link gets its own card; every other page keeps the site-wide one.
const socialImage = {
  url: `${siteUrl}/images/social-card-1.0.png`,
  width: 1200,
  height: 630,
  alt: "DocumentDB 1.0, generally available",
};
export const metadata = {
  ...baseMetadata,
  openGraph: { ...baseMetadata.openGraph, url: `${siteUrl}/v1/`, images: [socialImage] },
  twitter: { ...baseMetadata.twitter, images: [socialImage] },
};

const releaseUrl = "https://github.com/documentdb/documentdb/releases/tag/v1.0-0";
const changelogUrl = "https://github.com/documentdb/documentdb/blob/v1.0-0/CHANGELOG.md";
const issuesUrl = "https://github.com/documentdb/documentdb/issues";
const releaseNotesUrl = "/docs/getting-started/release-notes-1.0";
const knownIssuesUrl = `${releaseNotesUrl}#known-issues`;

// Pinned rather than `latest` so this page keeps installing 1.0 after later releases.
const dockerCommand = `docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  -e USERNAME='<YOUR_USERNAME>' \\
  -e PASSWORD='<YOUR_PASSWORD>' \\
  ghcr.io/documentdb/documentdb/documentdb-local:pg17-1.0.0`;

const installerCommand = `curl -fsSLo documentdb-install.sh https://documentdb.io/install.sh &&
sudo sh documentdb-install.sh`;

const highlights = [
  {
    title: "Security fixes",
    description: "Tighter permission checks for reads and writes, plus SASLprep password validation.",
  },
  {
    title: "Stability",
    description:
      "Fixes for backend crashes, concurrent index-drop deadlocks and RUM index maintenance. Clearer gateway errors for connection and pool failures.",
  },
  {
    title: "Collation (opt-in)",
    description: "More operators honor collation when it is enabled. It is off by default, and some operations don't support it yet.",
    href: knownIssuesUrl,
    linkLabel: "Known issues",
  },
  {
    title: "Geospatial correctness",
    description: "Fixes proximity-query edge cases for nearly coincident points and longitude -180.",
  },
];

const readMore = [
  { label: "Announcement", title: "DocumentDB 1.0 is here", href: documentdbReleaseAnnouncementUrl },
  { label: "Tools", title: "DocumentDB extension for Visual Studio Code 1.0", href: "/blogs/posts/documentdb-for-vs-code-1-0/" },
  { label: "Kubernetes", title: "DocumentDB 1.0 on Kubernetes", href: "/blogs/posts/kubernetes-operator-versioning/" },
  { label: "Versioning", title: "Long-term support or development?", href: "/blogs/posts/versioning/" },
];

const cardClass = "flex min-w-0 flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 sm:p-6";
const eyebrowClass = "mb-3 text-xs font-semibold uppercase tracking-[0.24em]";
const linkClass = "font-semibold text-blue-300 transition-colors hover:text-blue-200";
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300";
// blue-600 keeps white button text above 4.5:1; blue-500 does not.
const primaryButtonClass = `inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 ${focusClass}`;
const secondaryButtonClass = `inline-flex items-center justify-center rounded-md border border-neutral-600 bg-neutral-800/40 px-6 py-3 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 ${focusClass}`;

export default function ReleasePage() {
  return (
    <main className="min-h-screen bg-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.2),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_45%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
          <p className={`${eyebrowClass} text-emerald-300`}>Generally available · October 19, 2026</p>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-white sm:text-7xl">DocumentDB 1.0</h1>
          <p className="mx-auto mb-4 max-w-3xl text-xl font-semibold tracking-tight text-white sm:text-2xl">
            The open-source, MongoDB-compatible document database built on PostgreSQL.
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
            Our first generally available release focuses on security, stability and correctness. MIT licensed,
            with native BSON storage on PostgreSQL.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/packages" className={primaryButtonClass}>
              Install DocumentDB 1.0
            </Link>
            <a href={withBasePath(documentdbReleaseAnnouncementUrl)} className={secondaryButtonClass}>
              Read the announcement
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-black/20 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={`${eyebrowClass} text-emerald-300`}>A stabilization release</p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">What&apos;s new in 1.0</h2>
            </div>
            <a href={changelogUrl} className={`text-sm ${linkClass}`}>
              Full changelog <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div key={item.title} className="flex flex-col rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-6 text-gray-400">{item.description}</p>
                {item.href && (
                  <Link href={item.href} className={`mt-auto pt-3 text-sm ${linkClass}`}>
                    {item.linkLabel} <span aria-hidden="true">&rarr;</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className={`${eyebrowClass} text-blue-300`}>Get started</p>
          <h2 className="mb-8 text-3xl font-bold text-white sm:text-4xl">Get started with DocumentDB 1.0</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={cardClass}>
              <h3 className="mb-2 text-xl font-semibold text-white">Docker</h3>
              <p className="mb-4 text-sm leading-6 text-gray-400">
                DocumentDB 1.0 on PostgreSQL 17; images for PostgreSQL 15 to 18 are published too. With Docker
                running, replace the username and password, then run the command. On Windows, run it in WSL.
              </p>
              <CommandSnippet command={dockerCommand} label="bash" />
              <TelemetryNote />
              <Link href="/docs/getting-started/docker" className={`mt-auto pt-4 text-sm ${linkClass}`}>
                Docker quick start <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <div className={cardClass}>
              <h3 className="mb-2 text-xl font-semibold text-white">Linux packages</h3>
              <p className="mb-4 text-sm leading-6 text-gray-400">
                Ubuntu 24.04 and EL9, PostgreSQL 17 or 18, amd64 or arm64, from the documentdb.io APT and YUM
                repositories. On a clean host:
              </p>
              <CommandSnippet command={installerCommand} label="Installer" />
              <Link href="/packages?method=packages" className={`mt-auto pt-4 text-sm ${linkClass}`}>
                apt and dnf commands <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <div className={cardClass}>
              <h3 className="mb-2 text-xl font-semibold text-white">VS Code</h3>
              <p className="mb-4 text-sm leading-6 text-gray-400">
                The DocumentDB extension for Visual Studio Code 1.0 sets up DocumentDB Local for you, then lets you browse, query and copy
                data between connections. Needs desktop VS Code and Docker running.
              </p>
              <a
                href={documentdbVsCodeLocalQuickStartDeepLink}
                aria-describedby="v1-vscode-caption"
                className={`${primaryButtonClass} w-full sm:w-auto sm:self-start`}
              >
                Open setup in VS Code
              </a>
              <p id="v1-vscode-caption" className="mt-3 text-sm text-gray-400">
                Don&apos;t have VS Code?{" "}
                <a href="https://code.visualstudio.com/" className={linkClass}>Download it</a> first.
              </p>
              <Link href="/docs/getting-started/vscode-quickstart" className={`mt-auto pt-4 text-sm ${linkClass}`}>
                VS Code quick start <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <div className={cardClass}>
              <h3 className="mb-2 text-xl font-semibold text-white">Kubernetes</h3>
              <p className="mb-4 text-sm leading-6 text-gray-400">
                The DocumentDB Kubernetes Operator 1.0.0 is generally available alongside the engine. The quick start prepares a
                cluster, installs cert-manager and the operator, and creates your first DocumentDB database.
              </p>
              <a href={documentdbKubernetesOperatorQuickStartUrl} className={`${primaryButtonClass} w-full sm:w-auto sm:self-start`}>
                Deploy on Kubernetes
              </a>
              <Link href="/kubernetes-operator" className={`mt-auto pt-4 text-sm ${linkClass}`}>
                About the operator <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className={`${eyebrowClass} text-blue-300`}>Upgrading</p>
            <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">Moving to 1.0</h2>
            <ul className="space-y-4 text-sm leading-6 text-gray-300">
              <li>
                <span className="font-semibold text-white">Linux packages from v0.116 or v0.117</span> upgrade in
                place. <Link href="/docs/linux-packages#upgrading" className={linkClass}>Upgrade steps</Link>
              </li>
              <li>
                <span className="font-semibold text-white">Containers:</span> start the 1.0 image on a new volume
                and reload your data; a newer image does not update an existing volume.{" "}
                <Link href="/docs/documentdb-local#upgrading-the-image" className={linkClass}>Upgrading the image</Link>
              </li>
              <li>
                <span className="font-semibold text-white">Release candidates</span> have no upgrade path. Start
                from a clean host or volume.
              </li>
            </ul>
            <p className="mt-6 text-sm text-gray-400">
              <Link href={knownIssuesUrl} className={linkClass}>Known issues</Link>
              {" · "}
              <Link href={releaseNotesUrl} className={linkClass}>Release notes</Link>
              {" · "}
              <a href={releaseUrl} className={linkClass}>v1.0-0 on GitHub</a>
            </p>
          </div>

          <div>
            <p className={`${eyebrowClass} text-blue-300`}>Read more</p>
            <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">From the blog</h2>
            <div className="grid gap-3">
              {readMore.map((item) => (
                <a
                  key={item.href}
                  href={withBasePath(item.href)}
                  className={`group flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/80 px-5 py-4 transition hover:border-blue-400/30 hover:bg-neutral-800/60 ${focusClass}`}
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {item.label}
                    </span>
                    <span className="block font-semibold text-white group-hover:text-blue-200">{item.title}</span>
                  </span>
                  <span aria-hidden="true" className="text-blue-300">&rarr;</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 text-center sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Built in the open</h2>
          <p className="mb-6 text-base leading-7 text-gray-400">
            Try 1.0 with a workload that matters to you, and tell us what you find.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <a href={issuesUrl} className={secondaryButtonClass}>
              Report an issue
            </a>
            <a href={documentdbDiscordUrl} className={secondaryButtonClass}>
              Join Discord
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
