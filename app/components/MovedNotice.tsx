"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type MovedNoticeProps = {
  /** Where this page's content now lives. */
  href: string;
  /** Human-readable name of the destination page. */
  title: string;
};

/**
 * Stands in for a page whose content has been superseded by another page.
 *
 * The obvious implementation is `redirect()` in the server component, and this
 * replaces exactly that. It cannot work here: the site is exported as static
 * HTML (`output: "export"`), so there is no server to issue a 3xx, and Next
 * renders the thrown redirect as an error document instead. The result was a
 * page that returned HTTP 200 with an empty `__next_error__` body while still
 * being listed in sitemap.xml and linked from two live pages, so both readers
 * and crawlers hit a dead end.
 *
 * Rendering real markup serves both: a crawler sees a working link to the
 * replacement, and a reader who followed a bookmark is forwarded once the
 * bundle hydrates.
 */
export default function MovedNotice({ href, title }: MovedNoticeProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <div className="min-h-screen bg-neutral-900 py-16">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h1 className="mb-4 text-3xl font-bold text-white">This page has moved</h1>
        <p className="mb-8 text-gray-300">
          Its content now lives in{" "}
          <Link href={href} className="text-blue-400 underline hover:text-blue-300">
            {title}
          </Link>
          . You should be redirected automatically.
        </p>
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-md border border-blue-400 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
        >
          Continue to {title}
        </Link>
      </div>
    </div>
  );
}
