import Image from "next/image";
import Link from "next/link";
import CommandSnippet from "./components/CommandSnippet";
import { documentdbKubernetesOperatorDocsUrl } from "./services/externalLinks";
import { withBasePath } from "./services/sitePath";

type CapabilityIconName =
  | "foundation"
  | "index"
  | "vector"
  | "platform";

const quickRunCommand = `docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username <YOUR_USERNAME> \\
  --password <YOUR_PASSWORD>`;

const quickStartSteps = [
  {
    step: "01",
    description: "Run DocumentDB Local with Docker.",
  },
  {
    step: "02",
    description: "Connect on port 10260 with your app, shell, or client.",
  },
  {
    step: "03",
    description: "Continue with the docs or Linux packages for the setup you need.",
  },
];

const kubernetesOperatorEntryPoints = [
  {
    title: "Local clusters",
    description: "Start on kind or minikube for local Kubernetes development.",
  },
  {
    title: "Hybrid and multi-cloud",
    description: "Use documented AKS, EKS, GKE, and on-prem deployment guides.",
  },
  {
    title: "Replication and resilience",
    description: "Extend to cross-cluster replication, HA, backups, and TLS.",
  },
  {
    title: "Day-2 operations",
    description: "Use the kubectl plugin for status, events, and promotion.",
  },
];

const whyDocumentDB = [
  {
    title: "Native BSON",
    description:
      "Built for document flexibility on PostgreSQL.",
  },
  {
    title: "PostgreSQL foundation",
    description:
      "Use advanced SQL, proven operations, and rich indexing when you need them.",
  },
  {
    title: "Open and portable",
    description:
      "MIT licensed, runs locally with Docker, and fits your own infrastructure or cloud.",
  },
];

const capabilities = [
  {
    eyebrow: "Foundation",
    title: "Document + SQL",
    description:
      "Native BSON support with full PostgreSQL compatibility when you need advanced SQL.",
    highlights: ["Native BSON", "Advanced SQL"],
    icon: "foundation" as const,
  },
  {
    eyebrow: "Indexing",
    title: "Rich indexing",
    description:
      "Single-field, multi-key, compound, text, and geospatial indexes, including nested fields.",
    highlights: ["Nested fields", "Text + geo"],
    icon: "index" as const,
  },
  {
    eyebrow: "AI",
    title: "Vector search",
    description:
      "Embeddings and similarity search powered by pgvector.",
    highlights: ["Embeddings", "Similarity"],
    icon: "vector" as const,
  },
  {
    eyebrow: "Open source",
    title: "Open and secure",
    description:
      "MIT licensed with SCRAM authentication and a lightweight local runtime for development and testing.",
    highlights: ["MIT licensed", "SCRAM auth"],
    icon: "platform" as const,
  },
];

const trustBadges = [
  "Built on PostgreSQL",
  "Native BSON",
  "MIT licensed",
  "Runs locally with Docker",
];

const credibilityPoints = [
  {
    value: "3.2k+",
    label: "GitHub stars",
    detail: "on documentdb/documentdb",
  },
  {
    value: "200+",
    label: "Public forks",
    detail: "public on GitHub",
  },
  {
    value: "11",
    label: "TSC members",
    detail: "representing 5 organizations",
  },
];

const pressItems = [
  {
    name: "The Register",
    href: "https://www.theregister.com/2025/01/27/microsoft_builds_open_source_document/",
    headline: "Microsoft builds open source document database",
    color: "red" as const,
    logo: "/images/The Register Logo v2.png",
  },
  {
    name: "Hacker News",
    href: "https://news.ycombinator.com/item?id=42807210",
    headline: "DocumentDB Open-Source Discussion",
    color: "orange" as const,
    logo: null,
  },
  {
    name: "Phoronix",
    href: "https://www.phoronix.com/news/Microsoft-OpenSource-DocumentDB",
    headline: "Microsoft Announces Open-Source DocumentDB",
    color: "green" as const,
    logo: "/images/Phoronix Logo.jpg",
  },
  {
    name: "Business Wire",
    href: "https://www.businesswire.com/news/home/20250520124276/en/YugabyteDB-Extends-Support-for-Document-Databases-With-Postgres-Extension-DocumentDB",
    headline: "YugabyteDB Extends Support for DocumentDB",
    color: "indigo" as const,
    logo: "/images/BusinessWire.png",
  },
];

const pressColorMap = {
  red: "border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-400/50",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:border-orange-400/50",
  green: "border-green-500/30 bg-green-500/10 text-green-400 hover:border-green-400/50",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:border-indigo-400/50",
};

const contributorLogos = [
  {
    name: "Microsoft",
    src: "/images/AzureLogo.png",
  },
  {
    name: "Amazon",
    src: "/images/AWS%20Logo.png",
  },
  {
    name: "Rippling",
    src: "/images/Rippling%20Logo%20no%20background.png",
  },
  {
    name: "YugabyteDB",
    src: "/images/YugabyteLogo.png",
  },
  {
    name: "AB InBev",
    src: "/images/AB%20InBev%20transparent%20logo.png",
  },
];

function CapabilityIcon({ name }: { name: CapabilityIconName }) {
  switch (name) {
    case "foundation":
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 7.5C4 5.567 7.582 4 12 4s8 1.567 8 3.5S16.418 11 12 11 4 9.433 4 7.5Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 12c0 1.933 3.582 3.5 8 3.5s8-1.567 8-3.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 16.5C4 18.433 7.582 20 12 20s8-1.567 8-3.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 7.5v9M20 7.5v9"
          />
        </svg>
      );
    case "index":
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 7h10M4 12h7M4 17h7M17.5 17.5 20 20M15 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          />
        </svg>
      );
    case "vector":
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="6" cy="12" r="2.25" strokeWidth={1.8} />
          <circle cx="18" cy="6" r="2.25" strokeWidth={1.8} />
          <circle cx="18" cy="18" r="2.25" strokeWidth={1.8} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8 11l7.5-4M8 13l7.5 4"
          />
        </svg>
      );
    case "platform":
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3l7 3v5c0 4.2-2.6 8-7 10-4.4-2-7-5.8-7-10V6l7-3Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="m9.5 12 1.7 1.7 3.3-3.7"
          />
        </svg>
      );
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.2),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-8 lg:gap-10 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                Open source document database
              </p>
              <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                DocumentDB
              </h1>
              <p className="mb-4 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Built for document workloads. Powered by PostgreSQL.
              </p>
              <p className="mb-7 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
                Open source and MIT licensed, with native BSON, advanced
                indexing, and vector search on PostgreSQL.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/docs/getting-started"
                  className="inline-flex w-full items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 sm:w-auto"
                >
                  Get Started
                </Link>
                <Link
                  href="/packages"
                  className="inline-flex w-full items-center justify-center rounded-md border border-blue-400 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20 sm:w-auto"
                >
                  Download
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex w-full items-center justify-center rounded-md border border-neutral-600 bg-neutral-800/40 px-6 py-3 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 sm:w-auto"
                >
                  View Docs
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-neutral-700 bg-neutral-800/80 px-3.5 py-1.5 text-xs text-gray-200 sm:text-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div
              id="run-with-docker"
              className="min-w-0 scroll-mt-24 rounded-2xl border border-white/10 bg-neutral-900/90 p-5 shadow-[0_24px_80px_-40px_rgba(59,130,246,0.55)] sm:rounded-3xl sm:p-6"
            >
              <div className="mb-4">
                <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Quick start
                </span>
                <h2 className="mt-4 text-xl font-semibold text-white sm:text-2xl">
                  Run locally with Docker
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Start DocumentDB Local with Docker, then connect on port
                  10260.
                </p>
              </div>
              <CommandSnippet command={quickRunCommand} label="Docker" />
              <ol className="mt-5 overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/50">
                {quickStartSteps.map((item) => (
                  <li
                    key={item.step}
                    className="grid grid-cols-[auto_1fr] items-center gap-3 border-t border-neutral-800/80 px-4 py-3.5 first:border-t-0"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-[11px] font-semibold text-blue-200">
                      {item.step}
                    </span>
                    <p className="text-sm leading-6 text-gray-300">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  href="/docs/getting-started/docker"
                  className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
                >
                  Docker quick start
                </Link>
                <Link
                  href="/packages"
                  className="font-semibold text-gray-300 transition-colors hover:text-white"
                >
                  Download packages
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-neutral-800 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_34%)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
              Capabilities
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Core features for document workloads
            </h2>
            <p className="text-base leading-7 text-gray-400 sm:text-lg">
              From CRUD to vector search, all on PostgreSQL.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((item) => (
              <article
                key={item.title}
                className="group flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 transition hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-neutral-900 sm:p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 text-blue-200">
                  <CapabilityIcon name={item.icon} />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                  {item.eyebrow}
                </p>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-gray-400">
                  {item.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
                  {item.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-neutral-700 bg-neutral-800/90 px-3 py-1 text-[11px] font-medium text-gray-200"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900/60 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
              Why DocumentDB
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Document flexibility meets PostgreSQL confidence
            </h2>
            <p className="text-base leading-7 text-gray-400 sm:text-lg">
              Open-source control with the tools you already trust.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {whyDocumentDB.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 transition hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-neutral-900 sm:p-6"
              >
                <h3 className="mb-2 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-gray-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900/60 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Operator preview
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              DocumentDB Kubernetes Operator
            </h2>
            <p className="text-base leading-7 text-gray-400 sm:text-lg">
              Run DocumentDB on Kubernetes—from kind and minikube to{" "}
              <span className="inline-block">hybrid and multi-cloud deployments.</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kubernetesOperatorEntryPoints.map((item) => (
              <article
                key={item.title}
                className="group flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-neutral-900 sm:p-6"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  {item.title}
                </p>
                <p className="text-sm leading-6 text-gray-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-white">
                  Preview with local, hybrid, and multi-cluster paths
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
                  The operator is still in preview. Start with the overview, then
                  follow the quick start or multi-cluster guides.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/kubernetes-operator"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
                >
                  Read operator overview
                </Link>
                <a
                  href={documentdbKubernetesOperatorDocsUrl}
                  className="inline-flex items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
                >
                  Open quick start
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900/60 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
              Community
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Built in the open
            </h2>
            <p className="text-base leading-7 text-gray-400 sm:text-lg">
              MIT licensed, active on GitHub, and guided by a technical
              steering committee that spans five organizations.
            </p>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3">
            {credibilityPoints.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5"
              >
                <p className="text-3xl font-bold tracking-tight text-white">
                  {item.value}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-6">
            <p className="mb-4 text-sm text-gray-400">
              Current TSC representation includes Microsoft, Amazon, AB InBev,
              Rippling, and YugabyteDB.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {contributorLogos.map((organization, index) => (
                <div
                  key={organization.name}
                  title={organization.name}
                  className={`flex h-24 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/80 px-4 py-4 sm:h-28 ${
                    index === contributorLogos.length - 1
                      ? "col-span-2 sm:col-span-1"
                      : ""
                  }`}
                >
                  <div className="relative h-8 w-full max-w-[128px] sm:h-10 sm:max-w-[136px]">
                     <Image
                      src={withBasePath(organization.src)}
                      alt={organization.name}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900/40 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
              Press
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              In the press
            </h2>
            <p className="text-base leading-7 text-gray-400 sm:text-lg">
              What the industry is saying about DocumentDB.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pressItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col rounded-2xl border p-5 transition hover:-translate-y-0.5 ${pressColorMap[item.color]}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  {item.logo ? (
                    <div className="relative h-7 w-10 shrink-0">
                      <Image
                        src={withBasePath(item.logo)}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" fill="#FF6600" rx="2" />
                      <text
                        x="12"
                        y="16"
                        fontFamily="Verdana, sans-serif"
                        fontSize="12"
                        fontWeight="bold"
                        fill="white"
                        textAnchor="middle"
                      >
                        Y
                      </text>
                    </svg>
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {item.name}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white transition group-hover:text-current">
                  {item.headline}
                </h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 bg-black py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
            Ready to try DocumentDB?
          </h2>
          <p className="mb-6 text-sm text-gray-400 sm:text-base">
            Start locally with Docker, then explore the project on GitHub.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/docs/getting-started"
              className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-100 sm:w-auto"
            >
              Get Started
            </Link>
            <a
              href="https://github.com/documentdb/documentdb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-md border border-neutral-600 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 sm:w-auto"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
