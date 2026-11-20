import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Markdown from "../components/Markdown";
import StructuredData, { articleStructuredData } from "../components/StructuredData";
import { headingAnchor } from "../lib/docsAnchors";
import { getMetadata } from "../services/metadataService";

const pagePath = "/why-document-databases/";
const description =
  "Understand when document databases fit, how open-source DocumentDB builds on PostgreSQL, and how APIs, licensing, and hosting shape your choices.";

export const metadata = getMetadata({
  title: "Why Document Databases? - DocumentDB",
  description,
  path: pagePath,
  type: "article",
});

export default function WhyDocumentDatabasesPage() {
  const sourcePath = "content/why-document-databases.md";
  const content = fs.readFileSync(path.join(process.cwd(), sourcePath), "utf8");
  const title = content.match(/^# (.+)$/m)![1];
  const sections = [...content.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-black">
      <StructuredData data={articleStructuredData({
        title,
        description,
        path: pagePath,
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Why document databases?", path: pagePath },
        ],
      })} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-blue-300">
          Document database fundamentals
        </p>
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
          <article className="min-w-0">
            <Markdown content={content} sourcePath={sourcePath} />
            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-neutral-700 pt-8">
              <Link
                href="/docs/getting-started"
                className="rounded-md bg-blue-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-400"
              >
                Get started with DocumentDB
              </Link>
              <Link href="/packages" className="font-semibold text-blue-300 hover:text-blue-200">
                Install &amp; download
              </Link>
            </div>
          </article>
          <aside className="order-first lg:order-last">
            <nav aria-label="On this page" className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-5 lg:sticky lg:top-24">
              <p className="mb-4 font-semibold text-white">On this page</p>
              <ul className="space-y-3">
                {sections.map((section) => (
                  <li key={section}>
                    <a
                      href={`#${headingAnchor(section)}`}
                      className="text-sm leading-relaxed text-gray-300 transition-colors hover:text-blue-300"
                    >
                      {section}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </main>
  );
}
