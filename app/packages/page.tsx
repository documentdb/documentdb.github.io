"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CommandSnippet from "../components/CommandSnippet";
import {
  aptTargetPgVersions,
  aptTargetLabels,
  aptServesFullStack,
  buildAptInstallCommand,
  buildRpmInstallCommand,
  buildSetupCommand,
  rpmServesFullStack,
  type AptArch,
  type AptDistro,
  type AptPgVersion,
  type RpmArch,
  type RpmDistro,
  type RpmPgVersion,
  rpmTargetLabels,
} from "../lib/packageInstall";
import { useReleaseInfo } from "../lib/releaseInfo";

type InstallMethod = "docker" | "packages";
type PackageFamily = "apt" | "rpm";

const dockerCommand = `docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>`;

const nextGuides = [
  {
    title: "Getting started",
    description: "See the full setup flow and choose the guide that fits your environment.",
    href: "/docs/getting-started",
  },
  {
    title: "Python Quick Start",
    description: "Install PyMongo and connect to your local DocumentDB instance.",
    href: "/docs/getting-started/python-setup",
  },
  {
    title: "Node.js Quick Start",
    description: "Use the Node.js driver and run your first queries locally.",
    href: "/docs/getting-started/nodejs-setup",
  },
  {
    title: "Visual Studio Code Quick Start",
    description: "Connect through the VS Code extension for a guided local workflow.",
    href: "/docs/getting-started/vscode-quickstart",
  },
] as const;

const allReleasesUrl = "https://github.com/documentdb/documentdb/releases";

// The v0.116-0 packaging redesign replaced the single extension package with
// this set. Listed here so the page explains what an install actually brings
// in, instead of naming one package and silently pulling four more.
const packageRoles = [
  {
    name: "documentdb / documentdb-N",
    role: "Meta and per-major stand-alone package. Pins PostgreSQL and owns the systemd lifecycle.",
  },
  {
    name: "postgresql-N-documentdb",
    role: "The PostgreSQL extension itself (files only).",
  },
  {
    name: "documentdb-gateway",
    role: "Wire-protocol runtime that serves the MongoDB-compatible endpoint.",
  },
  {
    name: "documentdb-postgresql-tools",
    role: "Administrator helpers: documentdb-tune, documentdb-createcluster, documentdb-register-gateway, documentdb-gateway-admin.",
  },
  {
    name: "documentdb-common",
    role: "Shared payload: documentdb-setup, the systemd units, helper scripts and sample data.",
  },
] as const;

export default function PackagesPage() {
  const release = useReleaseInfo();
  const [method, setMethod] = useState<InstallMethod>("docker");
  const [packageFamily, setPackageFamily] = useState<PackageFamily>("apt");
  // Default to the paved road (Ubuntu 24.04 + PostgreSQL 18). The package
  // finder exposes only combinations built and tested in the mirrored release.
  const [aptTarget, setAptTarget] = useState<AptDistro>("ubuntu24");
  const [rpmTarget, setRpmTarget] = useState<RpmDistro>("rocky9");
  const [aptArch, setAptArch] = useState<AptArch>("amd64");
  const [rpmArch, setRpmArch] = useState<RpmArch>("x86_64");
  const [aptPgVersion, setAptPgVersion] = useState<AptPgVersion>("18");
  const [rpmPgVersion, setRpmPgVersion] = useState<RpmPgVersion>("18");
  const availableAptPgVersions = aptTargetPgVersions[aptTarget];

  useEffect(() => {
    if (!availableAptPgVersions.includes(aptPgVersion)) {
      setAptPgVersion(availableAptPgVersions[availableAptPgVersions.length - 1]);
    }
  }, [aptPgVersion, availableAptPgVersions]);

  const latestReleaseAptVersion = release.aptVersion;
  const latestReleaseRpmVersion = release.rpmVersion;
  const packagingGuideUrl = `https://github.com/documentdb/documentdb/blob/${release.tagName}/packaging/README.md`;
  const currentReleaseExamples = [
    `ubuntu24.04-documentdb_${release.metaVersion}_all.deb`,
    `ubuntu24.04-postgresql-18-documentdb_${latestReleaseAptVersion}_amd64.deb`,
    `rhel9-postgresql18-documentdb-${latestReleaseRpmVersion}.x86_64.rpm`,
  ] as const;

  const aptCommand = buildAptInstallCommand(aptTarget, aptArch, aptPgVersion);
  const rpmCommand = buildRpmInstallCommand(rpmTarget, rpmArch, rpmPgVersion);
  // Tier-1 targets resolve the full v0.116-0 stack, so the selected package is
  // the per-major stand-alone rather than the bare extension.
  const isFullStack =
    packageFamily === "apt"
      ? aptServesFullStack(aptTarget, aptPgVersion)
      : rpmServesFullStack(rpmTarget, rpmPgVersion);
  const selectedPackageNames = isFullStack
    ? `documentdb-${packageFamily === "apt" ? aptPgVersion : rpmPgVersion}`
    : packageFamily === "apt"
      ? `postgresql-${aptPgVersion}-documentdb`
      : `postgresql${rpmPgVersion}-documentdb`;
  const selectedTargetText =
    packageFamily === "apt" ? aptTargetLabels[aptTarget] : rpmTargetLabels[rpmTarget];
  const selectedArchText = packageFamily === "apt" ? aptArch : rpmArch;

  return (
    <div className="min-h-screen bg-neutral-900 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-extrabold text-white sm:text-5xl">
            Download DocumentDB
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-300">
            Choose Docker for the fastest local setup, or Linux packages for a persistent
            install. On Ubuntu 24.04 and EL9 (Rocky Linux, AlmaLinux, CentOS Stream, or
            registered Red Hat Enterprise Linux), the packages install the full DocumentDB
            stack — the PostgreSQL extension, the wire-protocol gateway, the administrator
            tools and systemd units. Starting with v0.116, the hosted package matrix is
            intentionally smaller and mirrors only combinations attached to the current
            official release.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            <span className="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-green-300">
              GPG-signed Repositories
            </span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-blue-300">
              Docker + Linux Packages
            </span>
            <span className="rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1 text-purple-300">
              AMD64 + ARM64
            </span>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800/70 p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">1. Choose your install method</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMethod("docker")}
              className={`rounded-lg border px-4 py-4 text-left transition-colors ${
                method === "docker"
                  ? "border-blue-400 bg-blue-500/15"
                  : "border-neutral-700 bg-neutral-800 hover:bg-neutral-700/70"
              }`}
            >
              <p className="text-lg font-semibold text-white">Docker</p>
              <p className="text-sm text-gray-300">Best for: quick local setup and evaluation. No PostgreSQL installation required.</p>
            </button>
            <button
              type="button"
              onClick={() => setMethod("packages")}
              className={`rounded-lg border px-4 py-4 text-left transition-colors ${
                method === "packages"
                  ? "border-blue-400 bg-blue-500/15"
                  : "border-neutral-700 bg-neutral-800 hover:bg-neutral-700/70"
              }`}
            >
              <p className="text-lg font-semibold text-white">Linux Packages</p>
              <p className="text-sm text-gray-300">
                Best for: persistent Ubuntu 24.04 or EL9 VM and server environments.
              </p>
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-neutral-700 bg-neutral-800/70 p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">
            2. Copy and run this command
          </h2>

          {method === "docker" ? (
            <>
              <CommandSnippet command={dockerCommand} label="Docker" />
              <p className="mt-3 text-sm text-gray-400">
                Starts DocumentDB locally on port 10260 for quick evaluation and development.
              </p>
              <div className="mt-4">
                <Link
                  href="/docs/getting-started/docker"
                  className="inline-flex items-center justify-center rounded-md border border-blue-400 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
                >
                  Open Docker Quick Start →
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mb-5 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-200">
                  The prebuilt package matrix was reduced in v0.116
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-100/80">
                  documentdb.io now publishes only the combinations built and tested for the
                  current release: Ubuntu 24.04 and EL9, PostgreSQL 17 or 18, on both supported
                  architectures. EL9 covers Rocky Linux, AlmaLinux, CentOS Stream, and registered
                  Red Hat Enterprise Linux with different prerequisite commands. Packages from
                  earlier releases are not carried forward to make unsupported targets appear
                  current. This also withdraws the older PostgreSQL 16 extension packages
                  previously served for Ubuntu 24.04 and EL9.
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-100/80">
                  Need another distribution or PostgreSQL major? We welcome community builds.
                  Check out the matching source tag and use our version-parameterized{" "}
                  <a
                    href={packagingGuideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-amber-100 underline hover:text-white"
                  >
                    packaging scripts
                  </a>
                  . The extension, gateway, and remaining stand-alone packages use separate
                  scripts. PostgreSQL 15 is extension-only. These builds are on demand and are
                  not official release assets hosted by documentdb.io.
                </p>
              </div>
              <div className="mb-5 rounded-lg border border-neutral-700 bg-neutral-900/60 p-4">
                <p className="mb-3 text-sm font-semibold text-white">Package Finder</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-medium text-gray-300">
                    Package format
                    <select
                      value={packageFamily}
                      onChange={(event) => setPackageFamily(event.target.value as PackageFamily)}
                      className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-gray-100"
                    >
                      <option value="apt">APT (Ubuntu 24.04)</option>
                      <option value="rpm">RPM (EL9)</option>
                    </select>
                  </label>

                  {packageFamily === "apt" ? (
                    <label className="text-xs font-medium text-gray-300">
                      Distribution
                      <select
                        value={aptTarget}
                        onChange={(event) => setAptTarget(event.target.value as AptDistro)}
                        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-gray-100"
                      >
                        {Object.entries(aptTargetLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="text-xs font-medium text-gray-300">
                      Distribution
                      <select
                        value={rpmTarget}
                        onChange={(event) => setRpmTarget(event.target.value as RpmDistro)}
                        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-gray-100"
                      >
                        {Object.entries(rpmTargetLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {packageFamily === "apt" ? (
                    <label className="text-xs font-medium text-gray-300">
                      Architecture
                      <select
                        value={aptArch}
                        onChange={(event) => setAptArch(event.target.value as AptArch)}
                        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-gray-100"
                      >
                        <option value="amd64">amd64</option>
                        <option value="arm64">arm64</option>
                      </select>
                    </label>
                  ) : (
                    <label className="text-xs font-medium text-gray-300">
                      Architecture
                      <select
                        value={rpmArch}
                        onChange={(event) => setRpmArch(event.target.value as RpmArch)}
                        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-gray-100"
                      >
                        <option value="x86_64">x86_64</option>
                        <option value="aarch64">aarch64</option>
                      </select>
                    </label>
                  )}

                  {packageFamily === "apt" ? (
                    <label className="text-xs font-medium text-gray-300">
                      PostgreSQL version
                      <select
                        value={aptPgVersion}
                        onChange={(event) => setAptPgVersion(event.target.value as AptPgVersion)}
                        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-gray-100"
                      >
                        {availableAptPgVersions.map((pgVersion) => (
                          <option key={pgVersion} value={pgVersion}>
                            {pgVersion}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="text-xs font-medium text-gray-300">
                      PostgreSQL version
                      <select
                        value={rpmPgVersion}
                        onChange={(event) => setRpmPgVersion(event.target.value as RpmPgVersion)}
                        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-gray-100"
                      >
                        <option value="17">17</option>
                        <option value="18">18</option>
                      </select>
                    </label>
                  )}
                </div>
              </div>

              <CommandSnippet
                command={packageFamily === "apt" ? aptCommand : rpmCommand}
                label={packageFamily === "apt" ? "APT" : "RPM"}
              />
              <p className="mt-3 text-sm text-gray-400">
                Target: {selectedTargetText} · Architecture: {selectedArchText} · package names{" "}
                <code className="text-gray-300">{selectedPackageNames}</code>
              </p>
              <p className="mt-2 text-sm text-gray-400">
                The generated command adds the PostgreSQL upstream repositories that provide
                PostgreSQL, <code className="text-gray-300">pg_cron</code>,{" "}
                <code className="text-gray-300">pgvector</code>, PostGIS, and{" "}
                <code className="text-gray-300">rum</code> for PostgreSQL 17.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                It installs the full DocumentDB stack for this target: the extension, the gateway
                runtime, the administrator tools and the systemd units.
              </p>
              {isFullStack ? (
                <>
                  <p className="mt-4 text-sm text-gray-400">
                    Then run the setup wizard. The generated command pins the PostgreSQL major
                    you selected and creates a new private instance, so another installed major
                    or an existing system cluster cannot be selected by accident. It installs
                    the extensions, bootstraps the admin user and starts the gateway — the
                    package install above on its own does not leave a reachable endpoint. It
                    prompts for the admin password. For automation, use the complete{" "}
                    <Link
                      className="text-blue-400 hover:text-blue-300"
                      href="/docs/linux-packages#unattended-setup"
                    >
                      unattended setup
                    </Link>{" "}
                    instructions.
                  </p>
                  <CommandSnippet
                    command={buildSetupCommand(
                      packageFamily === "apt" ? aptPgVersion : rpmPgVersion,
                    )}
                    label="Setup"
                  />
                  <p className="mt-3 text-sm text-gray-400">
                    The gateway then listens on port{" "}
                    <code className="text-gray-300">10260</code>. It binds all interfaces by
                    default, so firewall the port before exposing it to a network. For existing
                    PostgreSQL clusters, real certificates, upgrades, reset, and other day-2
                    tasks, use the{" "}
                    <Link
                      className="text-blue-400 hover:text-blue-300"
                      href="/docs/linux-packages"
                    >
                      operations guide
                    </Link>
                    .
                  </p>
                </>
              ) : null}
              {packageFamily === "apt" ? (
                <p className="mt-2 text-sm text-gray-400">
                  Running in a clean Ubuntu container as <code className="text-gray-300">root</code>?
                  Run <code className="text-gray-300">export DEBIAN_FRONTEND=noninteractive</code> in the shell first
                  (and omit <code className="text-gray-300">sudo</code> from the command above).
                  Without it, <code className="text-gray-300">tzdata</code> prompts for input partway through
                  and the install hangs with no visible error.
                </p>
              ) : null}
              <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900/60 p-4">
                <p className="mb-3 text-sm font-semibold text-white">
                  {isFullStack
                    ? "What gets installed"
                    : "Need the MongoDB-compatible gateway?"}
                </p>
                {isFullStack ? (
                  <>
                    <p className="mb-3 text-sm text-gray-400">
                      A per-major DocumentDB install resolves five package names. Installing{" "}
                      <code className="text-gray-300">{selectedPackageNames}</code> pulls in
                      everything below; the optional <code className="text-gray-300">documentdb</code>{" "}
                      meta package selects PostgreSQL 18.
                    </p>
                    <dl className="space-y-2 text-sm">
                      {packageRoles.map((entry) => (
                        <div key={entry.name} className="sm:flex sm:gap-3">
                          <dt className="shrink-0 font-mono text-xs text-blue-300 sm:w-64 sm:text-sm">
                            {entry.name}
                          </dt>
                          <dd className="text-gray-400">{entry.role}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-gray-400">
                    Use the Docker image for the fastest gateway-backed local setup. If you want a
                    package-backed host install that still works with <code className="text-gray-300">mongosh</code>,
                    the Linux package guide includes the exact non-root gateway follow-up commands
                    and host build prerequisites.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href="/docs/getting-started/packages"
                  className="inline-flex items-center justify-center rounded-md border border-blue-400 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
                >
                  Full package install guide →
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="space-y-4">
          <details className="rounded-lg border border-neutral-700 bg-neutral-800/60 p-5">
            <summary className="cursor-pointer text-lg font-semibold text-white">
              Current release package catalog
            </summary>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-700 text-gray-300">
                    <th className="px-3 py-2 font-semibold">Format</th>
                    <th className="px-3 py-2 font-semibold">Distributions</th>
                    <th className="px-3 py-2 font-semibold">Architectures</th>
                    <th className="px-3 py-2 font-semibold">PostgreSQL versions</th>
                    <th className="px-3 py-2 font-semibold">Package naming</th>
                    <th className="px-3 py-2 font-semibold">Version served</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-neutral-800">
                    <td className="px-3 py-3 font-semibold text-blue-300">APT</td>
                    <td className="px-3 py-3">Ubuntu 24.04 · <code className="text-gray-200">ubuntu24</code></td>
                    <td className="px-3 py-3">amd64, arm64</td>
                    <td className="px-3 py-3">17, 18</td>
                    <td className="px-3 py-3">
                      <code className="text-gray-200">documentdb-&lt;pg&gt;</code>
                    </td>
                    <td className="px-3 py-3">{release.metaVersion}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 font-semibold text-red-300">RPM</td>
                    <td className="px-3 py-3">
                      Rocky/Alma/CentOS Stream 9 or registered RHEL 9 ·{" "}
                      <code className="text-gray-200">rpm/rhel9</code>
                    </td>
                    <td className="px-3 py-3">x86_64, aarch64</td>
                    <td className="px-3 py-3">17, 18</td>
                    <td className="px-3 py-3">
                      <code className="text-gray-200">documentdb-&lt;pg&gt;</code>
                    </td>
                    <td className="px-3 py-3">{release.metaRpmVersion}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs text-amber-300">
                Compared with earlier releases, v0.116 reduces the hosted package matrix. The
                repository contains only package combinations attached to{" "}
                <a href={release.releaseUrl} className="text-blue-300 hover:text-blue-200">
                  {release.tagName}
                </a>
                . Other combinations remain build-on-demand targets in the source repository;
                see the{" "}
                <a
                  href={packagingGuideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200"
                >
                  packaging guide
                </a>{" "}
                to build the package you need from the matching tag.
              </p>
              <p className="mt-3 text-xs text-gray-400">
                Use Package Finder above to generate the exact command for your selected
                target, or see the{" "}
                <Link href="/docs/getting-started/packages" className="text-blue-400 hover:text-blue-300">
                  Linux Packages Quick Start
                </Link>{" "}
                for the supported repository components and install commands written out in full.
              </p>
            </div>
          </details>

          <details className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-5">
            <summary className="cursor-pointer text-lg font-semibold text-amber-100">
              Migrating from repository targets retired in v0.116
            </summary>
            <div className="mt-4 space-y-3 text-sm leading-6 text-amber-100/80">
              <p>
                documentdb.io no longer publishes packages for Ubuntu 22.04, Debian 11/12/13,
                RHEL-compatible 8, or PostgreSQL 16. Existing installations keep running, but
                they receive no package updates and cannot reinstall those packages from the
                documentdb.io repository.
              </p>
              <p>
                Empty signed metadata remains at the retired repository URLs so{" "}
                <code className="text-amber-100">apt update</code> and{" "}
                <code className="text-amber-100">dnf makecache</code> do not break unrelated
                package operations. Remove the DocumentDB source if that host will not move to
                the current matrix:
              </p>
              <div className="rounded-md border border-amber-300/20 bg-black p-3 text-xs text-green-400 sm:text-sm">
                <div>sudo rm -f /etc/apt/sources.list.d/documentdb.list &amp;&amp; sudo apt update</div>
                <div className="mt-1">
                  sudo rm -f /etc/yum.repos.d/documentdb.repo &amp;&amp; sudo dnf clean all
                </div>
              </div>
              <p>
                To remain on an older target, use the matching GitHub release assets or build
                from that release tag. Those paths are not part of the current hosted support
                matrix.
              </p>
            </div>
          </details>

          <details className="rounded-lg border border-neutral-700 bg-neutral-800/60 p-5">
            <summary className="cursor-pointer text-lg font-semibold text-white">
              Version pinning and listing available versions
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-400">
                Use the commands below to discover available versions before pinning, and pin{" "}
                <code className="text-gray-300">{selectedPackageNames}</code> — the package your
                selected target actually installs.
              </p>
              <p className="text-sm text-amber-300">
                APT and RPM use different version syntax, and individual subpackages can carry
                different release suffixes. Always copy the exact version returned below for{" "}
                <code className="text-gray-300">{selectedPackageNames}</code>; do not infer it
                from the extension or another package.
              </p>
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400">APT — list then pin</p>
                <div className="rounded-md border border-neutral-700 bg-black p-3">
                  <code className="text-xs text-green-400 sm:text-sm">
                    apt-cache madison {selectedPackageNames}
                  </code>
                </div>
                <div className="mt-2 rounded-md border border-neutral-700 bg-black p-3">
                  <code className="text-xs text-green-400 sm:text-sm">
                    sudo apt install {selectedPackageNames}=&lt;VERSION&gt;
                  </code>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400">RPM — list then pin</p>
                <div className="rounded-md border border-neutral-700 bg-black p-3">
                  <code className="text-xs text-green-400 sm:text-sm">
                    dnf --showduplicates list {selectedPackageNames}
                  </code>
                </div>
                <div className="mt-2 rounded-md border border-neutral-700 bg-black p-3">
                  <code className="text-xs text-green-400 sm:text-sm">
                    sudo dnf install {selectedPackageNames}-&lt;VERSION&gt;
                  </code>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                See all releases and release notes on{" "}
                <a
                  href={allReleasesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  GitHub Releases
                </a>
                .
              </p>
            </div>
          </details>

          <details className="rounded-lg border border-neutral-700 bg-neutral-800/60 p-5">
            <summary className="cursor-pointer text-lg font-semibold text-white">
              Direct package downloads
            </summary>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-400">
                Individual <code className="text-gray-300">.deb</code> and{" "}
                <code className="text-gray-300">.rpm</code> files are attached to each release on
                GitHub. Recent release examples:
              </p>
              <div className="rounded-md border border-neutral-700 bg-black p-3 text-xs text-green-400 sm:text-sm">
                <div>{currentReleaseExamples[0]}</div>
                <div className="mt-1">{currentReleaseExamples[1]}</div>
                <div className="mt-1">{currentReleaseExamples[2]}</div>
              </div>
              <p className="text-xs text-gray-500">
                Choose an asset whose PostgreSQL version and architecture match your host.
              </p>
              <a
                href={allReleasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-blue-400 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
              >
                Browse releases on GitHub →
              </a>
            </div>
          </details>

          <details className="rounded-lg border border-neutral-700 bg-neutral-800/60 p-5">
            <summary className="cursor-pointer text-lg font-semibold text-white">
              Troubleshooting quick checks
            </summary>
            <div className="mt-4 space-y-3">
              <div className="rounded-md border border-neutral-700 bg-black p-3">
                <code className="text-xs text-green-400 sm:text-sm">
                  sudo apt update && apt search documentdb && apt-cache policy
                  postgresql-18-documentdb
                </code>
              </div>
              <div className="rounded-md border border-neutral-700 bg-black p-3">
                <code className="text-xs text-green-400 sm:text-sm">
                  sudo dnf clean all && dnf search documentdb && rpm -qi
                  postgresql18-documentdb
                </code>
              </div>
            </div>
          </details>
        </section>

        <section className="mt-8 rounded-xl border border-neutral-700 bg-neutral-800/70 p-5 sm:p-6">
          <div className="mb-5 max-w-2xl">
            <h2 className="mb-4 text-2xl font-bold text-white">
              3. Connect and try it
            </h2>
            <p className="text-sm leading-6 text-gray-400">
              Docker starts a gateway-backed local endpoint on port 10260. On Ubuntu 24.04 and
              EL9 the packages give you the same thing: install, then run{" "}
              <code className="text-gray-300">
                {buildSetupCommand(packageFamily === "apt" ? aptPgVersion : rpmPgVersion)}
              </code>
              {", "}which creates a private database instance for the selected PostgreSQL major and
              starts the gateway.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {nextGuides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-xl border border-neutral-700 bg-neutral-900/70 p-4 transition hover:border-blue-400/40 hover:bg-neutral-900"
              >
                <h3 className="text-lg font-semibold text-white transition group-hover:text-blue-200">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{guide.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/docs/getting-started/packages"
              className="inline-flex items-center justify-center rounded-md border border-neutral-600 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
            >
              Linux package guide
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-md border border-neutral-600 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
            >
              All docs
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
