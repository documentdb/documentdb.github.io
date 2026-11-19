import Link from "next/link";
import CommandSnippet from "./CommandSnippet";
import TelemetryNote from "./TelemetryNote";
import { buildAptInstallCommand, buildRpmInstallCommand, buildSetupCommand } from "../lib/packageInstall";

const linkClass = "text-blue-300 underline underline-offset-4";

export default function StaticInstallGuides() {
  return (
    <section aria-label="Static installation quickstarts" className="space-y-6 rounded-xl border border-neutral-700 bg-neutral-800/60 p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-white">Install without the selector</h2>
      <p className="text-sm leading-6 text-gray-300">
        These are standalone quickstarts, not commands customized from this URL.
        Choose the guide matching your environment. The interactive selector loads separately.
      </p>
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-white">Docker: local evaluation and development</h3>
        <p className="text-sm text-gray-300">Requires Docker and an available port 10260. Replace both credential placeholders before running.</p>
        <CommandSnippet label="Start local Docker container" command={`docker run -dt --pull always --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  -e USERNAME='<YOUR_USERNAME>' \\
  -e PASSWORD='<YOUR_PASSWORD>' \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest`} />
        <TelemetryNote />
        <p className="text-sm text-gray-300">
          Wait for <code>=== DocumentDB is ready ===</code> in <code>docker logs documentdb</code>, then follow the{" "}
          <Link href="/docs/getting-started/docker" className={linkClass}>Docker quickstart</Link> to connect and verify.
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-white">Linux packages: a new PostgreSQL 18 instance</h3>
        <p className="text-sm text-gray-300">
          Requires a supported Linux host, sudo and internet access. These commands use the moving <code>latest</code> channel and detect host architecture.
          For an existing installation, <Link href="/docs/linux-packages#upgrading" className={linkClass}>upgrade in place</Link> instead.
        </p>
        <details>
          <summary className="cursor-pointer text-blue-300">Ubuntu 24.04 (AMD64 or ARM64)</summary>
          <CommandSnippet label="Ubuntu 24.04 install" command={buildAptInstallCommand("ubuntu24", "auto", "18")} />
        </details>
        <details>
          <summary className="cursor-pointer text-blue-300">Registered RHEL 9 (AMD64 or ARM64)</summary>
          <CommandSnippet label="RHEL 9 install" command={buildRpmInstallCommand("rhel9", "auto", "18")} />
        </details>
        <details>
          <summary className="cursor-pointer text-blue-300">Rocky Linux 9 (AMD64 or ARM64)</summary>
          <CommandSnippet label="Rocky Linux 9 install" command={buildRpmInstallCommand("rocky9", "auto", "18")} />
        </details>
        <p className="text-sm text-gray-300">
          Firewall port 10260 before setup: the gateway listens on all interfaces.
          Setup asks for an admin password and starts a private PostgreSQL instance.
        </p>
        <CommandSnippet label="Set up PostgreSQL 18" command={buildSetupCommand("18")} />
        <p className="text-sm text-gray-300">
          Check <code>sudo documentdb-setup --status</code>, then follow the{" "}
          <Link href="/docs/getting-started/packages" className={linkClass}>Linux packages quickstart</Link> for connection, first-query verification, troubleshooting and cleanup.
        </p>
      </div>
    </section>
  );
}
