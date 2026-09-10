"use client";

import { useState } from "react";
import Link from "next/link";
import CommandSnippet from "./CommandSnippet";
import {
  aptTargetLabels,
  buildSetupCommand,
  rpmFullStackDistros,
  rpmTargetLabels,
} from "../lib/packageInstall";

const nativeInstallHref = "/packages?method=packages&family=apt&target=ubuntu24&pg=18&arch=auto";
const setupCommand = buildSetupCommand("18");
const dockerCommand = `docker run -dt --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username '<YOUR_USERNAME>' \\
  --password '<YOUR_PASSWORD>'`;

const linkClass = "font-semibold text-blue-300 underline underline-offset-4 hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400";

export default function HomeQuickstart() {
  const [method, setMethod] = useState<"packages" | "docker">("packages");

  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-neutral-900/90 p-5 shadow-[0_24px_80px_-40px_rgba(59,130,246,0.55)] sm:rounded-3xl sm:p-6">
      <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
        Quick start
      </span>
      <div role="group" aria-label="Installation method" className="mt-4 grid grid-cols-2 gap-2">
        {([
          { value: "packages", label: "Native Linux", id: "native-linux-quickstart" },
          { value: "docker", label: "Docker", id: "run-with-docker" },
        ] as const).map((item) => (
          <button
            key={item.value}
            id={item.id}
            type="button"
            aria-pressed={method === item.value}
            aria-controls="home-quickstart-preview"
            onClick={() => setMethod(item.value)}
            className={`min-h-11 scroll-mt-24 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
              method === item.value
                ? "border-blue-400 bg-blue-500/15 text-blue-200"
                : "border-neutral-700 bg-neutral-800/60 text-gray-300 hover:border-neutral-500 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs leading-5 text-gray-400">
        For macOS and Windows, choose Docker.
      </p>

      <section
        id="home-quickstart-preview"
        aria-labelledby={method === "packages" ? "native-linux-quickstart" : "run-with-docker"}
        className="mt-4"
      >
        {method === "packages" ? (
          <>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Run directly on Linux
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Recommended: {aptTargetLabels.ubuntu24} with PostgreSQL 18.
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-400">
              Also available for {rpmFullStackDistros.map((target) => rpmTargetLabels[target]).join("; ")}.
            </p>
            <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-amber-200">
              Pre-GA: fresh installs only. In-place upgrades from earlier releases are not supported.
            </p>
            <ol className="mt-4 space-y-4">
              <li>
                <h3 className="text-sm font-semibold text-white">1. Install the complete stack</h3>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  First configure the PostgreSQL (PGDG) and DocumentDB repositories
                  and signing keys, then install the packages.
                </p>
                <Link href={nativeInstallHref} className={`mt-2 inline-block text-sm ${linkClass}`}>
                  Open complete installation instructions
                </Link>
              </li>
              <li>
                <h3 className="text-sm font-semibold text-white">2. Set up after installation</h3>
                <p className="mb-3 mt-1 text-sm leading-6 text-gray-400">
                  Create a private PostgreSQL instance and start the gateway.
                  The wizard prompts for your admin password in the terminal.
                </p>
                <CommandSnippet command={setupCommand} label="Set up after installing packages" />
              </li>
            </ol>
            <p className="mt-3 text-xs leading-5 text-gray-400">
              The complete instructions continue through connecting and your first query.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Run locally with Docker
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Install and start Docker, then run DocumentDB Local in a container.
            </p>
            <p className="mb-4 mt-3 text-sm leading-6 text-gray-400">
              Replace the placeholders with your own local-development credentials.
              Command-line passwords can remain in shell history; do not reuse production credentials.
              Port 10260 is exposed only on loopback.
            </p>
            <CommandSnippet command={dockerCommand} label="Docker" />
            <p className="mt-4 text-sm leading-6 text-gray-400">
              Wait for DocumentDB to be ready, then connect with your app or shell.
              Follow the full instructions for TLS, connection examples, and data persistence.
            </p>
            <Link href="/packages?method=docker" className={`mt-3 inline-block text-sm ${linkClass}`}>
              Open Docker installation instructions
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
