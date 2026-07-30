import Link from "next/link";

const suggestions = [
  {
    title: "Documentation",
    description: "Guides, quick starts, and the MQL reference.",
    href: "/docs",
  },
  {
    title: "Download",
    description: "Docker, APT, and RPM install commands.",
    href: "/packages",
  },
  {
    title: "Samples",
    description: "Ready-to-run example applications.",
    href: "/samples",
  },
] as const;

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
        404 - Page not found
      </p>
      <h1 className="mb-4 text-center text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        This page doesn&apos;t exist
      </h1>
      <p className="mb-10 max-w-xl text-center text-base leading-7 text-gray-400">
        The page you&apos;re looking for may have moved. These are the most
        useful places to continue from.
      </p>

      <div className="mb-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {suggestions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 transition hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-neutral-800/60"
          >
            <h2 className="mb-2 text-lg font-semibold text-white transition group-hover:text-blue-200">
              {item.title}
            </h2>
            <p className="text-sm leading-6 text-gray-400">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400"
        >
          Back to home
        </Link>
        <a
          href="https://github.com/documentdb/documentdb.github.io/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-neutral-600 bg-neutral-800/40 px-6 py-3 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
        >
          Report a broken link
        </a>
      </div>
    </div>
  );
}
