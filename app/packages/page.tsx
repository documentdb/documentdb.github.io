"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import CommandSnippet from "../components/CommandSnippet";
import {
  aptTargetLabels,
  aptTargetPgVersions,
  buildAptInstallCommand,
  buildRpmInstallCommand,
  buildSetupCommand,
  rpmTargetLabels,
} from "../lib/packageInstall";
import {
  defaultInstallSelection,
  installQueryKeys,
  installSelectionQuery,
  installSelectionUrlQuery,
  parseInstallSelection,
  releaseHasPackages,
  selectInstallTarget,
  type SelectionResult,
} from "../lib/installSelection";
import { useReleaseInfo } from "../lib/releaseInfo";
import {
  documentdbVsCodeLocalQuickStartDeepLink,
} from "../services/externalLinks";

const dockerCommand = `docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username '<YOUR_USERNAME>' \\
  --password '<YOUR_PASSWORD>'`;

const nextGuides = [
  { title: "VS Code", href: "/docs/getting-started/vscode-quickstart" },
  { title: "Python", href: "/docs/getting-started/python-setup" },
  { title: "Node.js", href: "/docs/getting-started/nodejs-setup" },
] as const;

const packageRoles = [
  { name: "documentdb-N", role: "The complete stack for PostgreSQL major N. Owns that instance's service lifecycle." },
  { name: "postgresql-N-documentdb", role: "PostgreSQL extension files. RPM uses postgresqlN-documentdb." },
  { name: "documentdb-gateway", role: "The wire-protocol gateway your apps and tools connect to." },
  { name: "documentdb-postgresql-tools", role: "Tools for configuration, gateway registration, and user administration." },
  { name: "documentdb-common", role: "The shared setup wizard, service templates, helpers, and optional sample data." },
];

const linkClass = "text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200";
// Touch screens get 16px selects in any orientation, since iOS zooms into smaller form fields
const selectClass = "mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-3 text-sm pointer-coarse:text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";
const panelClass = "rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 sm:p-6";
const stepClass = "mt-8 text-xl font-bold text-white";
const stepTextClass = "mb-3 mt-2 text-sm leading-6 text-gray-300";
const vscodeGuideUrl = "/docs/getting-started/vscode-quickstart";

// Same two Docker workflows, with the same names, as the homepage quick start.
const dockerSetups = [
  { value: "command", title: "Docker command", description: "Run it yourself" },
  { value: "guided", title: "Guided setup", description: "VS Code extension" },
] as const;
type DockerSetup = (typeof dockerSetups)[number]["value"];

function InstallLocation({ onChange }: { onChange: (result: SelectionResult) => void }) {
  const search = useSearchParams().toString();
  useEffect(() => onChange(parseInstallSelection(search)), [onChange, search]);
  return null;
}

export default function PackagesPage() {
  const { release, status: releaseStatus, error: releaseError } = useReleaseInfo();
  const [state, setState] = useState<SelectionResult | null>(null);
  const [dockerSetup, setDockerSetup] = useState<DockerSetup>("command");

  // A broken link still shows the method it asked for, with commands withheld.
  const selection = state?.selection ?? (state?.error ? state.recovery : defaultInstallSelection);
  const { method, packages } = selection;
  const { family, target, pg, arch } = packages;
  const selectionReady = state !== null && state.error === null;
  // The commands install from the package repository, so only a confirmed gap in the release withholds them.
  const packagesMissing = releaseStatus === "live" && !releaseHasPackages(release, packages);
  const canInstall = selectionReady && !packagesMissing;
  const targetLabel = packages.family === "apt" ? aptTargetLabels[packages.target] : rpmTargetLabels[packages.target];
  const selectedPackageNames = `documentdb-${pg}`;
  const packagingGuideUrl = `https://github.com/documentdb/documentdb/blob/${release.tagName}/packaging/README.md`;
  const setupCommand = buildSetupCommand(pg);
  const installCommand = packages.family === "apt"
    ? buildAptInstallCommand(packages.target, packages.arch, packages.pg)
    : buildRpmInstallCommand(packages.target, packages.arch, packages.pg);

  function choose(result: SelectionResult) {
    setState(result);
    if (!result.selection) return;
    const url = new URL(window.location.href);
    for (const key of installQueryKeys) url.searchParams.delete(key);
    for (const [key, value] of new URLSearchParams(installSelectionUrlQuery(result.selection))) {
      url.searchParams.set(key, value);
    }
    window.history.replaceState(null, "", url);
  }

  function changeChoice(key: "method" | "pg" | "arch", value: string) {
    const params = new URLSearchParams(installSelectionQuery(selection));
    params.set(key, value);
    choose(parseInstallSelection(params.toString()));
  }

  const firstQuerySteps = (
    <>
      <p className={stepTextClass}>
        Pick a client. Each guide connects to the instance you just started
        {method === "packages" ? " as admin" : ""}, inserts a document, and reads it back.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {nextGuides.map((guide) => (
          <Link key={guide.href} href={guide.href} className="rounded-lg border border-neutral-700 bg-neutral-900/70 px-4 py-3 font-semibold text-white transition hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-400">
            {guide.title}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-900 py-10 sm:py-14">
      <Suspense fallback={null}>
        <InstallLocation onChange={setState} />
      </Suspense>
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Install DocumentDB</h1>
          <p className="mt-4 text-lg text-gray-300">Start a local database and run your first query in a few minutes.</p>
        </header>

        <section aria-label="Installation method" className="grid gap-3 sm:grid-cols-2">
          {([
            { value: "docker", title: "Docker container", description: "Recommended for evaluation and development." },
            { value: "packages", title: "Linux packages", description: "For environments without Docker or when you need control over PostgreSQL, topology, services, and configuration." },
          ] as const).map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={state !== null && method === item.value}
              onClick={() => changeChoice("method", item.value)}
              className={`rounded-xl border px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                state !== null && method === item.value ? "border-blue-400 bg-blue-500/15" : "border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800"
              }`}
            >
              <span className="block text-lg font-semibold text-white">{item.title}</span>
              <span className="mt-1 block text-sm text-gray-300">{item.description}</span>
            </button>
          ))}
        </section>

        <noscript>
          <p className="text-gray-200">
            Enable JavaScript to select installation commands, or follow the{" "}
            <Link href="/docs/getting-started/packages" className={linkClass}>Linux quickstart</Link>{" "}
            or <Link href="/docs/getting-started/docker" className={linkClass}>Docker quickstart</Link>.
          </p>
        </noscript>

        {state?.error && (
          <div role="alert" className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-5 text-amber-100">
            <p>{state.error} No installation commands are shown for this link.</p>
            <button
              type="button"
              onClick={() => choose({ selection: state.recovery, error: null })}
              className="mt-3 rounded-md border border-amber-300 px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {state.recovery.method === "packages" ? "Use supported Linux package settings" : "Use default settings"}
            </button>
          </div>
        )}

        {/* The static page can't see the query string, so show no flow until it is read. */}
        {state === null ? (
          <p className="text-center text-sm text-gray-400">Loading installation steps...</p>
        ) : method === "packages" ? (
          <section className={panelClass} aria-label="Linux packages installation">
            <label htmlFor="install-target" className="block text-sm font-medium text-gray-200">Linux distribution</label>
            <select id="install-target" value={target} onChange={(event) => choose(selectInstallTarget(selection, event.target.value))} className={selectClass}>
              {Object.entries({ ...aptTargetLabels, ...rpmTargetLabels }).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue-300">
                Advanced options: PostgreSQL {pg}, {arch === "auto" ? "automatic architecture" : arch}
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label htmlFor="install-pg" className="text-sm text-gray-200">
                  PostgreSQL major
                  <select id="install-pg" value={pg} onChange={(event) => changeChoice("pg", event.target.value)} className={selectClass}>
                    {aptTargetPgVersions.ubuntu24.map((value) => <option key={value} value={value}>{value}{value === "18" ? " (recommended)" : ""}</option>)}
                  </select>
                </label>
                <label htmlFor="install-arch" className="text-sm text-gray-200">
                  Host architecture
                  <select id="install-arch" value={arch} onChange={(event) => changeChoice("arch", event.target.value)} className={selectClass}>
                    <option value="auto">Detect on the Linux host (recommended)</option>
                    {(family === "apt" ? ["amd64", "arm64"] : ["x86_64", "aarch64"]).map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              </div>
            </details>

            <p className="mt-4 text-sm text-amber-100">
              Pre-GA: fresh installs only. In-place upgrades from earlier releases are not supported.
            </p>
            {releaseStatus === "loading" ? (
              <p role="status" className="mt-2 text-sm text-gray-400">Checking the published package release...</p>
            ) : releaseStatus === "fallback" ? (
              <div role="alert" className="mt-3 rounded-lg border border-amber-400/40 p-4 text-sm text-amber-100">
                <p>Cannot confirm the current repository release. {releaseError}</p>
                <p className="mt-2">
                  The commands below install the latest packages from the repository. Last known
                  release: {release.tagName}.{" "}
                  <a href="https://github.com/documentdb/documentdb/releases" className={linkClass}>Browse release assets</a>{" "}
                  or <button type="button" onClick={() => window.location.reload()} className={linkClass}>retry the lookup</button>.
                </p>
              </div>
            ) : (
              <p role="status" className="mt-2 text-sm text-gray-400">
                Release <a href={release.releaseUrl} className={linkClass}>{release.tagName}</a>
                {" · "}{targetLabel}{" · "}{arch === "auto" ? "AMD64 / ARM64" : arch}
              </p>
            )}
            {selectionReady && packagesMissing && (
              <p role="alert" className="mt-3 rounded-lg border border-amber-400/40 p-4 text-sm text-amber-100">
                The complete package set for this selection is not present in the published release.
                Choose another target or a specific available architecture, or{" "}
                <a href={release.releaseUrl} className={linkClass}>inspect the release assets</a>.
              </p>
            )}

            <h2 className={stepClass}>1. Install</h2>
            <p className={stepTextClass}>Adds the PostgreSQL and DocumentDB repositories (plus EPEL and CRB on EL9), then installs PostgreSQL, the extension, and the gateway.</p>
            {canInstall ? <CommandSnippet command={installCommand} label={`${family.toUpperCase()} installation`} /> : (
              <p className="text-sm text-gray-400">No command is shown for this selection.</p>
            )}
            {family === "apt" && (
              <p className="mt-2 text-sm text-gray-400">
                In a clean Ubuntu container as <code className="text-gray-300">root</code>, run{" "}
                <code className="text-gray-300">export DEBIAN_FRONTEND=<wbr />noninteractive</code> first and drop{" "}
                <code className="text-gray-300">sudo</code>, or <code className="text-gray-300">tzdata</code> hangs the install.
              </p>
            )}

            <h2 className={stepClass}>2. Set up</h2>
            <p className={stepTextClass}>
              Creates a private PostgreSQL instance, asks for an admin password, and starts DocumentDB on port 10260.
              Firewall that port first; it listens on all interfaces.
            </p>
            {canInstall && <CommandSnippet command={setupCommand} label="Setup" />}
            <p className="mt-2 text-sm text-gray-400">
              Want sample data? Add <code>--load-sample-data</code> to seed the{" "}
              <code>StoreData</code> database; it needs one extra tool, covered in the{" "}
              <Link href="/docs/getting-started/packages#set-up-and-connect" className={linkClass}>Linux quickstart</Link>.
              Automating? Use{" "}
              <Link href="/docs/linux-packages#unattended-setup" className={linkClass}>unattended setup</Link>.
            </p>

            <h2 className={stepClass}>3. Run your first query</h2>
            {firstQuerySteps}
            <p className="mt-6 text-sm text-gray-300">
              Existing PostgreSQL, extension-only installs, services, and cleanup:{" "}
              <Link href="/docs/linux-packages" className={linkClass}>full Linux guide</Link>.
            </p>
          </section>
        ) : (
          <section className={panelClass} aria-label="Docker installation">
            <div role="group" aria-label="Docker setup" className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-700 bg-neutral-900/80 p-1">
              {dockerSetups.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={dockerSetup === item.value}
                  onClick={() => setDockerSetup(item.value)}
                  className={`min-h-14 rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                    dockerSetup === item.value ? "bg-neutral-700 text-white" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.title}
                  <span className="mt-1 block text-xs font-normal text-gray-400">{item.description}</span>
                </button>
              ))}
            </div>

            {dockerSetup === "guided" ? (
              <>
                <h2 className={stepClass}>1. Set up in VS Code</h2>
                <p className={stepTextClass}>With Docker running, the DocumentDB extension creates your database and saves a connection.</p>
                <a
                  href={documentdbVsCodeLocalQuickStartDeepLink}
                  aria-describedby="install-vscode-caption"
                  className="inline-flex items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                >
                  Set up in VS Code
                </a>
                <p id="install-vscode-caption" className="mt-3 text-sm text-gray-400">
                  Don&apos;t have VS Code?{" "}
                  <a href="https://code.visualstudio.com/" className={linkClass}>Download it</a> first.
                </p>
                <h2 className={stepClass}>2. Run your first query</h2>
                <p className={stepTextClass}>
                  When setup finishes, select Open Connection, then follow the{" "}
                  <Link href={vscodeGuideUrl} className={linkClass}>VS Code quickstart</Link>.
                </p>
              </>
            ) : (
              <>
                <h2 className={stepClass}>1. Start DocumentDB</h2>
                <p className={stepTextClass}>With Docker running, replace the username and password, then run:</p>
                {selectionReady && <CommandSnippet command={dockerCommand} label="Docker" />}
                <p className="mt-2 text-sm text-gray-400">
                  It takes a few seconds to accept connections. Volumes, image versions, and readiness checks are in the{" "}
                  <Link href="/docs/getting-started/docker" className={linkClass}>Docker quickstart</Link>.
                </p>
                <h2 className={stepClass}>2. Run your first query</h2>
                {firstQuerySteps}
              </>
            )}
          </section>
        )}

        <details id="downloads" className={panelClass}>
          <summary className="cursor-pointer font-semibold text-white">Downloads, versions, and troubleshooting</summary>
          <p className="mt-4 text-sm leading-6 text-gray-300">
            <a href="https://github.com/documentdb/documentdb/releases" className={linkClass}>GitHub release assets</a>{" "}
            have individual DEB/RPM files and checksums. Install the matching package set together:
          </p>
          <dl className="mt-3 space-y-3 text-sm">
            {packageRoles.map((entry) => (
              <div key={entry.name}>
                <dt className="break-words font-mono text-blue-300">{entry.name}</dt>
                <dd className="mt-1 text-gray-400">{entry.role}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-6 text-gray-300">
            To pin a version, list what is available first. APT and RPM use different version syntax, and
            individual subpackages can carry different version strings. Use the version reported for{" "}
            <code>{selectedPackageNames}</code>.
          </p>
          {selectionReady && (
            <div className="mt-3">
              <CommandSnippet
                command={family === "apt" ? `apt-cache madison ${selectedPackageNames}` : `dnf --showduplicates list ${selectedPackageNames}`}
                label="List package versions"
              />
            </div>
          )}
          <p className="mt-4 text-sm text-gray-400">
            Other OS and PostgreSQL combinations are build-on-demand; see the{" "}
            <a href={packagingGuideUrl} className={linkClass}>packaging guide</a>. Ubuntu 22.04, Debian, EL8, and
            PostgreSQL 16 were retired in v0.116.
          </p>
          <p className="mt-4 text-sm text-gray-300">
            Stuck? <Link href="/docs/getting-started/docker" className={linkClass}>Docker quickstart</Link>
            {" · "}<Link href="/docs/getting-started/packages" className={linkClass}>Linux quickstart</Link>
            {" · "}<Link href="/docs/linux-packages" className={linkClass}>Linux operations and troubleshooting</Link>
          </p>
        </details>
      </div>
    </div>
  );
}
