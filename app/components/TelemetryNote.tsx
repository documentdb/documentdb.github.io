import Link from "next/link";
import { documentdbLocalPrivacyUrl } from "../services/externalLinks";

const linkClass = "text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200";

// The documentdb-local image reports usage by default from 1.0, so every Docker start command shows the opt-out.
export default function TelemetryNote() {
  return (
    <p className="mt-2 text-xs leading-5 text-gray-400">
      The image sends usage telemetry by default. Add{" "}
      <code className="text-gray-300">-e DOCUMENTDB_USAGE_TELEMETRY=false</code> before the image name to
      turn it off.{" "}
      <Link href="/docs/documentdb-local#usage-telemetry" className={linkClass}>What is sent</Link>
      {" · "}
      <a href={documentdbLocalPrivacyUrl} className={linkClass}>Privacy statement</a>
    </p>
  );
}
