import Link from "next/link";
import { documentdbReleasePageUrl } from "../services/externalLinks";

export default function AnnouncementBar() {
  return (
    <Link
      href={documentdbReleasePageUrl}
      className="block bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-emerald-500/20 px-4 py-2 text-center text-sm text-white transition-colors hover:from-emerald-500/30 hover:via-blue-500/30 hover:to-emerald-500/30"
    >
      <span className="mr-2 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
        New
      </span>
      <span className="font-semibold">DocumentDB 1.0 is here.</span>{" "}
      <span className="whitespace-nowrap text-emerald-200 underline-offset-4 hover:underline">
        See what&apos;s new <span aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  );
}
