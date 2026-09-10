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
  parseInstallSelection,
  releaseHasPackages,
  selectInstallTarget,
  type SelectionResult,
} from "../lib/installSelection";
import { useReleaseInfo } from "../lib/releaseInfo";

const dockerCommand = `docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username '<YOUR_USERNAME>' \\
  --password '<YOUR_PASSWORD>'`;

const firstQuery = `db.starter.insertOne({ message: "Hello, DocumentDB!" })
db.starter.findOne({ message: "Hello, DocumentDB!" })`;

const nextGuides = [
  { title: "Python", description: "Connect with PyMongo.", href: "/docs/getting-started/python-setup" },
  { title: "Node.js", description: "Use the MongoDB Node.js driver.", href: "/docs/getting-started/nodejs-setup" },
  { title: "Visual Studio Code", description: "Explore your data in the editor.", href: "/docs/getting-started/vscode-quickstart" },
] as const;

const packageRoles = [
  { name: "documentdb-N", role: "The complete stack for PostgreSQL major N. Owns that instance's service lifecycle." },
  { name: "postgresql-N-documentdb", role: "PostgreSQL extension files. RPM uses postgresqlN-documentdb." },
  { name: "documentdb-gateway", role: "The MongoDB-compatible wire-protocol runtime." },
  { name: "documentdb-postgresql-tools", role: "Tools for configuration, gateway registration, and user administration." },
  { name: "documentdb-common", role: "The shared setup wizard, service templates, helpers, and optional sample data." },
];

const linkClass = "text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200";
const selectClass = "mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";
const panelClass = "rounded-xl border border-neutral-700 bg-neutral-800/60 p-5 sm:p-7";

function InstallLocation({ onChange }: { onChange: (result: SelectionResult) => void }) {
  const search = useSearchParams().toString();
  useEffect(() => onChange(parseInstallSelection(search)), [onChange, search]);
  return null;
}

export default function PackagesPage() {
  const { release, status: releaseStatus, error: releaseError } = useReleaseInfo();
  const [state, setState] = useState<SelectionResult | null>(null);

  const selection = state?.selection ?? defaultInstallSelection;
  const { method, packages } = selection;
  const { family, target, pg, arch } = packages;
  const selectionReady = state !== null && state.error === null;
  const packagesAvailable = releaseStatus === "live" && releaseHasPackages(release, packages);
  const canInstall = selectionReady && packagesAvailable;
  const targetLabel = packages.family === "apt" ? aptTargetLabels[packages.target] : rpmTargetLabels[packages.target];
  const selectedPackageNames = `documentdb-${pg}`;
  const packagingGuideUrl = `https://github.com/documentdb/documentdb/blob/${release.tagName}/packaging/README.md`;
  const setupCommand = buildSetupCommand(pg);
  const installCommand = packages.family === "apt"
    ? buildAptInstallCommand(packages.target, packages.arch, packages.pg)
    : buildRpmInstallCommand(packages.target, packages.arch, packages.pg);
  const connectionCommand = `mongosh 'mongodb://127.0.0.1:10260/mydb?authSource=admin&tls=true&tlsAllowInvalidCertificates=true' \\
  --username ${method === "packages" ? "admin" : "'<YOUR_USERNAME>'"} --password`;

  function choose(result: SelectionResult) {
    setState(result);
    if (!result.selection) return;
    const url = new URL(window.location.href);
    for (const key of installQueryKeys) url.searchParams.delete(key);
    for (const [key, value] of new URLSearchParams(installSelectionQuery(result.selection))) {
      url.searchParams.set(key, value);
    }
    window.history.pushState(null, "", url);
  }

  function changeChoice(key: "method" | "pg" | "arch", value: string) {
    const params = new URLSearchParams(installSelectionQuery(selection));
    params.set(key, value);
    choose(parseInstallSelection(params.toString()));
  }

  return (
    <div className="min-h-screen bg-neutral-900 py-10 sm:py-14">
      <Suspense fallback={null}>
        <InstallLocation onChange={setState} />
      </Suspense>
      <div className="mx-auto max-w-5xl space-y-7 px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">Start simple. Keep control.</p>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Install DocumentDB</h1>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            Run directly on Linux with guided setup, or use Docker. Start with the complete
            database stack; choose individual components when you need more control.
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Native packages: Ubuntu 24.04 and EL9 · PostgreSQL 17/18 · AMD64 and ARM64
          </p>
          <a href="#downloads" className={`mt-3 inline-block text-sm ${linkClass}`}>Looking for individual package downloads?</a>
        </header>

        <section aria-label="Installation method" className="grid gap-3 sm:grid-cols-2">
          {([
            { value: "packages", title: "Native Linux", description: "Recommended on supported Linux hosts. No container or source build required." },
            { value: "docker", title: "Docker", description: "A container-based path for Linux, macOS, and Windows." },
          ] as const).map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={method === item.value}
              onClick={() => changeChoice("method", item.value)}
              className={`rounded-xl border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                method === item.value ? "border-blue-400 bg-blue-500/15" : "border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800"
              }`}
            >
              <span className="block text-xl font-semibold text-white">{item.title}</span>
              <span className="mt-2 block text-sm leading-6 text-gray-300">{item.description}</span>
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
              onClick={() => choose({ selection: defaultInstallSelection, error: null })}
              className="mt-3 rounded-md border border-amber-300 px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Use recommended Linux settings
            </button>
          </div>
        )}

        {method === "packages" ? (
          <>
            <section className={panelClass} aria-labelledby="linux-settings">
              <h2 id="linux-settings" className="text-xl font-bold text-white">One complete stack. No package decisions.</h2>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                The selected <code>{selectedPackageNames}</code> package brings PostgreSQL, the extension,
                gateway, setup tools, and services together. The number {pg} is the PostgreSQL major,
                not the DocumentDB release.
              </p>
              <label htmlFor="install-target" className="mt-5 block text-sm font-medium text-gray-200">
                Linux distribution
              </label>
              <select id="install-target" value={target} onChange={(event) => choose(selectInstallTarget(selection, event.target.value))} className={selectClass}>
                {Object.entries({ ...aptTargetLabels, ...rpmTargetLabels }).map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-blue-300">
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
              <p className="mt-4 text-sm text-gray-400">
                Architecture is resolved in your terminal, not from your browser. Use a supported AMD64 or ARM64 Linux host with sudo and systemd.
                Registered RHEL needs an active subscription.
              </p>
            </section>

            <aside className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">
              <p className="font-semibold">Pre-GA: fresh installations only</p>
              <p className="mt-1">
                Use a clean supported Linux host. In-place package upgrades from earlier releases are
                not supported. Removing packages preserves database files; reinstalling is not a data reset.
              </p>
            </aside>

            <div aria-live="polite">
              {releaseStatus === "loading" ? (
                <p className="text-sm text-gray-300">Checking the published package release...</p>
              ) : releaseStatus === "fallback" ? (
                <div role="alert" className="rounded-lg border border-amber-400/40 p-4 text-sm text-amber-100">
                  <p>Cannot confirm the current repository release. {releaseError}</p>
                  <p className="mt-2">
                    Reference release: {release.tagName}, not confirmed current. Installation commands are
                    withheld until availability can be confirmed.{" "}
                    <a href="https://github.com/documentdb/documentdb/releases" className={linkClass}>Browse release assets</a>{" "}
                    or <button type="button" onClick={() => window.location.reload()} className={linkClass}>retry the lookup</button>.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-300">
                  Published repository release:{" "}
                  <a href={release.releaseUrl} className={linkClass}>{release.tagName}</a>
                  {" · "}{targetLabel}{" · "}{arch === "auto" ? "AMD64 / ARM64" : arch}
                </p>
              )}
            </div>
            {selectionReady && releaseStatus === "live" && !packagesAvailable && (
              <p role="alert" className="rounded-lg border border-amber-400/40 p-4 text-sm text-amber-100">
                The complete package set for this selection is not present in the published release.
                Choose another target or a specific available architecture, or{" "}
                <a href={release.releaseUrl} className={linkClass}>inspect the release assets</a>.
              </p>
            )}

            <section id="install" className={panelClass}>
              <h2 className="text-2xl font-bold text-white">1. Install the packages</h2>
              <p className="mb-4 mt-3 text-sm leading-6 text-gray-300">
                Run this in your Linux terminal. It adds the PostgreSQL and DocumentDB repositories
                and signing keys, enables the required distribution repositories, and installs the complete
                stack. Review the command before running it. Installation does not start a usable DocumentDB endpoint.
              </p>
              {canInstall ? <CommandSnippet command={installCommand} label={`${family.toUpperCase()} installation`} /> : (
                <p className="text-sm text-gray-400">Commands will appear after your selection and the published package set are confirmed.</p>
              )}
            </section>

            <section id="setup" className={panelClass}>
              <h2 className="text-2xl font-bold text-white">2. Configure and start DocumentDB</h2>
              <p className="mb-4 mt-3 text-sm leading-6 text-gray-300">
                The wizard creates a new private PostgreSQL instance for major {pg}, configures the extensions,
                creates your admin login, and starts the gateway and services at boot. It asks for the admin
                password in your terminal. Keep that password for the connection step.
              </p>
              {canInstall && <CommandSnippet command={setupCommand} label="Setup" />}
              <p className="mt-4 text-sm leading-6 text-amber-100">
                The gateway listens on port 10260 on all interfaces by default. Restrict that port with your
                firewall before setup. Use trusted TLS certificates before exposing it beyond local development.
              </p>
              <p className="mt-3 text-sm text-gray-400">
                Need automation? Follow the complete{" "}
                <Link href="/docs/linux-packages#unattended-setup" className={linkClass}>unattended setup</Link>{" "}
                instructions. Already managing PostgreSQL? Use the{" "}
                <Link href="/docs/linux-packages#adopt-an-existing-postgre-sql-instance" className={linkClass}>operations guide</Link>{" "}
                instead of creating a new instance.
              </p>
            </section>
          </>
        ) : (
          <section id="install" className={panelClass}>
            <h2 className="text-2xl font-bold text-white">1. Start a Docker container</h2>
            <p className="mb-4 mt-3 text-sm leading-6 text-gray-300">
              Install and start Docker first. Replace both credential placeholders before running the
              command. This local example exposes port 10260 only on your machine&apos;s loopback interface.
            </p>
            {selectionReady && <CommandSnippet command={dockerCommand} label="Docker" />}
            <p className="mt-4 text-sm leading-6 text-gray-400">
              The container initializes the database; do not run the native setup wizard inside it.
              For persistent volumes and a versioned image, follow the{" "}
              <Link href="/docs/getting-started/docker" className={linkClass}>Docker quickstart</Link>.
            </p>
          </section>
        )}

        <section id="connect" className={panelClass}>
          <h2 className="text-2xl font-bold text-white">{method === "packages" ? "3" : "2"}. Connect and run your first query</h2>
          <p className="mb-4 mt-3 text-sm leading-6 text-gray-300">
            Install{" "}
            <a href="https://www.mongodb.com/docs/mongodb-shell/install/" className={linkClass}>mongosh</a>{" "}
            separately, then connect from the same host as DocumentDB.{" "}
            {method === "packages" ? "Use the admin password you chose during setup." : "Use the username and password you chose for Docker."}{" "}
            The shell prompts for the password; it is not included in the connection URI.
          </p>
          {selectionReady && (method === "docker" || canInstall) && (
            <>
              <CommandSnippet command={connectionCommand} label="Connect with mongosh" />
              <p className="mb-4 mt-4 text-sm text-gray-300">In mongosh, insert a document and read it back:</p>
              <CommandSnippet command={firstQuery} label="First insert and query" />
            </>
          )}
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Expect an acknowledged insert and a document containing &quot;Hello, DocumentDB!&quot;.
            The example uses the <code>mydb</code> database. The self-signed certificate bypass is
            for local development only; use trusted certificates and remove the bypass for other deployments.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {nextGuides.map((guide) => (
              <Link key={guide.href} href={guide.href} className="rounded-lg border border-neutral-700 bg-neutral-900/70 p-4 transition hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-400">
                <span className="block font-semibold text-white">{guide.title}</span>
                <span className="mt-2 block text-sm text-gray-400">{guide.description}</span>
              </Link>
            ))}
          </div>
        </section>

        {method === "packages" && (
          <section className={panelClass} aria-labelledby="keep-control">
            <h2 id="keep-control" className="text-2xl font-bold text-white">Keep control after the first query</h2>
            <p className="mb-4 mt-3 text-sm leading-6 text-gray-300">
              Your private database lives under <code>/var/lib/documentdb-local/{pg}/data</code>.
              The per-major package uses <code>documentdb-local@{pg}.target</code> for service management.
              A restart preserves your data.
            </p>
            {canInstall && <CommandSnippet command={`sudo systemctl status documentdb-local@${pg}.target\nsudo systemctl restart documentdb-local@${pg}.target`} label="Status and restart" />}
            <p className="mt-4 text-sm leading-6 text-gray-400">
              Sample data is optional. After installing mongosh, add{" "}
              <code>--load-sample-data</code> to seed the{" "}
              <code>StoreData</code> database when running setup. The default setup leaves your new instance empty.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/docs/linux-packages#adopt-an-existing-postgre-sql-instance" className="rounded-lg border border-neutral-700 p-4 hover:border-blue-400">
                <span className="block font-semibold text-white">Use your existing local PostgreSQL</span>
                <span className="mt-2 block text-sm leading-6 text-gray-400">Keep its lifecycle under your control. Review configuration changes and restart requirements first. Remote/cloud-managed PostgreSQL is not supported by this packaged flow.</span>
              </Link>
              <Link href="/docs/linux-packages#install-the-postgre-sql-extension-only" className="rounded-lg border border-neutral-700 p-4 hover:border-blue-400">
                <span className="block font-semibold text-white">Install only the PostgreSQL extension</span>
                <span className="mt-2 block text-sm leading-6 text-gray-400">Use the SQL-facing capabilities without installing a gateway. Extension-only installation does not create a MongoDB-compatible endpoint.</span>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              See the <Link href="/docs/linux-packages" className={linkClass}>operations guide</Link>{" "}
              for logs, TLS, user management, and cleanup. Removing packages or using{" "}
              <code>--restore</code> does not erase database data.
            </p>
          </section>
        )}

        <section id="downloads" className="space-y-4" aria-label="Advanced downloads and troubleshooting">
          <details className={panelClass}>
            <summary className="cursor-pointer text-lg font-semibold text-white">All downloads and package details</summary>
            <p className="mt-4 text-sm leading-6 text-gray-300">
              <a href="https://github.com/documentdb/documentdb/releases" className={linkClass}>Browse GitHub release assets</a>{" "}
              for individual DEB/RPM files, checksums, and the package inventory. Select the matching distribution,
              PostgreSQL major, and architecture; install the matching package set together.
            </p>
            <p className="mt-3 text-sm text-gray-400">
              The optional <code>documentdb</code> meta package selects PostgreSQL 18 and adds the public{" "}
              <code>documentdb-local.target</code> alias. The commands above install the explicit per-major
              package instead.
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              {packageRoles.map((entry) => (
                <div key={entry.name}>
                  <dt className="break-words font-mono text-blue-300">{entry.name}</dt>
                  <dd className="mt-1 text-gray-400">{entry.role}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-gray-400">
              Other OS/PostgreSQL combinations are build-on-demand targets, not current hosted packages.
              See the <a href={packagingGuideUrl} className={linkClass}>{releaseStatus === "live" ? "matching release packaging guide" : "reference release packaging guide"}</a>.
              PostgreSQL 15 is extension-only for native packaging.
            </p>
          </details>
          <details className={panelClass}>
            <summary className="cursor-pointer text-lg font-semibold text-white">Available versions and retired targets</summary>
            <p className="mt-4 text-sm leading-6 text-gray-300">
              For fresh installs, list available versions before pinning. APT and RPM use different version
              syntax, and individual subpackages can carry different release suffixes. Use the version
              reported for <code>{selectedPackageNames}</code>, not the extension&apos;s version.
            </p>
            {selectionReady && (
              <div className="mt-4">
                <CommandSnippet
                  command={family === "apt" ? `apt-cache madison ${selectedPackageNames}` : `dnf --showduplicates list ${selectedPackageNames}`}
                  label="List package versions"
                />
              </div>
            )}
            <p className="mt-4 text-sm leading-6 text-gray-400">
              The hosted matrix was reduced in v0.116. Ubuntu 22.04, Debian 11/12/13, EL8, and
              PostgreSQL 16 packages are no longer served here. Existing installations are not
              automatically migrated, and do not receive package updates from these retired targets.
              Empty signed repository metadata remains so unrelated package operations continue to work.
            </p>
            <p className="mt-3 text-sm text-gray-400">
              Use matching older release assets or build from that source tag if you must stay on a
              retired target. For a current installation, use a clean supported host. In-place upgrades
              from earlier releases are not supported.
            </p>
          </details>
          <details className={panelClass}>
            <summary className="cursor-pointer text-lg font-semibold text-white">Troubleshooting and manual instructions</summary>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-gray-300">
              <li>Dependency errors: run the complete repository setup command, including PGDG and the distribution prerequisites.</li>
              <li>Port already in use: select an explicit alternate port using the operations guide. Do not stop an unrelated service.</li>
              <li>Cannot connect: confirm setup finished, services are active, and you are using the right host, credentials, and TLS settings.</li>
              <li>Missing shell: mongosh is not included in the native package set; install it separately.</li>
              <li>Uninstalling is not a reset: data deletion is a separate, explicit operation.</li>
            </ul>
            <p className="mt-4 text-sm text-gray-400">
              <Link href="/docs/getting-started/packages" className={linkClass}>Complete Linux quickstart</Link>
              {" · "}<Link href="/docs/linux-packages" className={linkClass}>Advanced operations</Link>
              {" · "}<Link href="/docs/getting-started/docker" className={linkClass}>Docker quickstart</Link>
            </p>
          </details>
        </section>
      </div>
    </div>
  );
}
