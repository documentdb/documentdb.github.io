import Image from "next/image";
import Link from "next/link";
import CommandSnippet from "../components/CommandSnippet";
import { getMetadata } from "../services/metadataService";
import { withBasePath } from "../services/sitePath";

export const metadata = getMetadata({
  title: "DocumentDB for AI - Vector Search, RAG, and Embeddings",
  description:
    "Build AI applications with DocumentDB: a Mongo API-compatible document model, native vector search, PostgreSQL reliability, and self-hosted deployment.",
  path: "/ai/",
  extraKeywords: [
    "AI database",
    "vector search",
    "RAG",
    "embeddings",
    "open source vector database",
    "Mongo API compatible",
    "pgvector",
  ],
});

const quickRunCommand = `docker run -dt --name documentdb \\
  -p 10260:10260 \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest \\
  --username admin --password password`;

const connectCommand = `mongosh "mongodb://admin:password@localhost:10260/?tls=true&tlsAllowInvalidCertificates=true"`;

const createIndexCommand = `db.runCommand({
  createIndexes: "documents",
  indexes: [{
    key: { embedding: "cosmosSearch" },
    name: "vector_idx",
    cosmosSearchOptions: {
      kind: "vector-hnsw",
      similarity: "COS",
      dimensions: 1536
    }
  }]
});`;

const vectorSearchCommand = `db.documents.aggregate([
  {
    $vectorSearch: {
      queryVector: [0.12, -0.04, 0.31, /* ... 1536 dims */],
      path: "embedding",
      limit: 10,
      numCandidates: 100,
      filter: { category: "technical" }
    }
  }
]);`;

const heroBadges = [
  "Start locally in minutes",
  "Mongo API-compatible",
  "Native vector search",
  "MIT licensed",
];

const beforeAfter = [
  {
    title: "Before",
    accent:
      "border-red-500/20 bg-red-500/5 text-red-200 shadow-[0_24px_80px_-50px_rgba(239,68,68,0.45)]",
    heading: "Typical AI stack",
    points: [
      "App database for documents and metadata",
      "Separate vector database for embeddings",
      "Extra data sync and failure modes between systems",
      "More moving parts, more cost, more things to break",
    ],
  },
  {
    title: "After",
    accent:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-200 shadow-[0_24px_80px_-50px_rgba(16,185,129,0.45)]",
    heading: "DocumentDB stack",
    points: [
      "BSON documents and embeddings stored together",
      "Native vector search with filtering in one database",
      "Geospatial, graph, and 40+ aggregation stages in one system",
      "Simpler architecture with PostgreSQL-backed operations",
    ],
  },
];

const quickStartSteps = [
  {
    step: "01",
    title: "Run locally with Docker",
    description:
      "One command to start DocumentDB on port 10260 with local credentials.",
    label: "Docker",
    code: quickRunCommand,
  },
  {
    step: "02",
    title: "Connect with mongosh",
    description:
      "Connect with mongosh, pymongo, the Node.js driver, or another standard Mongo client.",
    label: "Shell",
    code: connectCommand,
  },
  {
    step: "03",
    title: "Create a vector index",
    description:
      "Create a native HNSW vector index with cosine similarity for embedding retrieval.",
    label: "Index",
    code: createIndexCommand,
  },
  {
    step: "04",
    title: "Query by meaning",
    description:
      "Retrieve semantically similar results with vector search and optional metadata filters.",
    label: "Vector search",
    code: vectorSearchCommand,
  },
];

const useCases = [
  {
    badge: "RAG",
    title: "RAG and grounded chat",
    description:
      "Store chunks, metadata, and embeddings together so retrieval stays close to the source document.",
    points: [
      "Pre-filter by category, source, or recency before retrieval",
      "Return source text alongside similarity scores",
    ],
  },
  {
    badge: "Search",
    title: "Semantic search",
    description:
      "Search products, knowledge bases, or support histories by meaning instead of exact keyword match.",
    points: [
      "Choose cosine, L2, or inner product for your domain",
      "Mix vector results with metadata filters in one query",
    ],
  },
  {
    badge: "Agents",
    title: "Agent memory",
    description:
      "Store conversation state as BSON documents and retrieve past context with vector similarity.",
    points: [
      "Persist tool outputs, plans, and dialogue turns naturally",
      "Recall relevant history without scanning entire threads",
    ],
  },
  {
    badge: "Graph + AI",
    title: "Knowledge navigation",
    description:
      "Find the best vector matches, then traverse related entities with `$graphLookup` in one query pipeline.",
    points: [
      "Recursive traversal with depth control",
      "Useful when retrieval also needs relationship traversal",
    ],
  },
];

const credibilityPoints = [
  {
    value: "3.2k+",
    label: "GitHub stars",
  },
  {
    value: "200+",
    label: "Forks",
  },
  {
    value: "11",
    label: "TSC members",
    detail: "across 5 organizations",
  },
];

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

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-3xl sm:mb-10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
        {eyebrow}
      </p>
      <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-gray-400 sm:text-lg">{description}</p>
    </div>
  );
}

export default function AIPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-violet-950/60 via-neutral-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.22),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_42%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="min-w-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
              Easy start for AI teams
            </p>
            <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Stop juggling databases for AI
            </h1>
            <p className="mb-4 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Documents, vectors, and search in one Mongo API-compatible system.
            </p>
            <p className="max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
              Run locally with Docker, use familiar Mongo drivers and tools, and
              keep documents plus embeddings together — no extra sync layer needed.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/docs/getting-started/docker"
                className="inline-flex w-full items-center justify-center rounded-md bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-400 sm:w-auto"
              >
                Start with Docker
              </Link>
              <Link
                href="/samples"
                className="inline-flex w-full items-center justify-center rounded-md border border-violet-400/40 bg-violet-500/10 px-6 py-3 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20 sm:w-auto"
              >
                Explore AI/ML Samples
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {heroBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-neutral-700 bg-neutral-800/80 px-3.5 py-1.5 text-xs text-gray-200 sm:text-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-3xl border border-white/10 bg-neutral-900/90 p-5 shadow-[0_24px_80px_-40px_rgba(139,92,246,0.45)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                Quick start
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                Vector search in minutes
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Start locally with one Docker command
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Spin up DocumentDB with Docker, then follow the four-step quick
              start below to connect with mongosh, create a vector index, and
              run your first vector search.
            </p>
            <div className="mt-5">
              <CommandSnippet command={quickRunCommand} label="Docker" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                  API
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Mongo API-compatible</p>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Use familiar Mongo drivers and tools.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                  Indexing
                </p>
                <p className="mt-2 text-sm font-semibold text-white">HNSW + IVFFlat</p>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Choose the right vector algorithm for recall, scale, and cost.
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                  Retrieval
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Vector search</p>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Filter by metadata and return similarity scores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900/60 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Why teams choose it"
            title="A simpler stack for AI"
            description="Compare a typical AI setup against what DocumentDB consolidates into one system."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {beforeAfter.map((item) => (
              <article
                key={item.title}
                className={`rounded-3xl border p-6 ${item.accent}`}
              >
                <span className="inline-flex rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                  {item.title}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-white">{item.heading}</h3>
                <ul className="mt-5 space-y-3">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-6 text-gray-300">
                      <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-current/80" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-neutral-800 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_34%)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Easy start"
            title="Go from zero to vector search in four steps"
            description="Copy, paste, and run. Each step works with mongosh, pymongo, or any standard Mongo client."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {quickStartSteps.map((item) => (
              <article
                key={item.step}
                className="flex h-full flex-col rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-[0_24px_80px_-50px_rgba(139,92,246,0.45)] sm:p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-xs font-semibold text-violet-200">
                    {item.step}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                    {item.label}
                  </p>
                </div>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{item.description}</p>
                <div className="mt-5">
                  <CommandSnippet command={item.code} label={item.label} />
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/docs/getting-started/docker"
              className="font-semibold text-violet-300 transition-colors hover:text-violet-200"
            >
              Follow the full Docker quick start
            </Link>
            <Link
              href="/docs/getting-started/python-setup"
              className="font-semibold text-gray-300 transition-colors hover:text-white"
            >
              See the Python setup
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900/60 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Use cases"
            title="Built for the AI workloads that matter"
            description="Vector retrieval, document storage, and query power in one system — ready for the patterns teams are actually shipping."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {useCases.map((item) => (
              <article
                key={item.title}
                className="group flex h-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-neutral-900 sm:p-6"
              >
                <span className="inline-flex w-fit rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                  {item.badge}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{item.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-6 text-gray-300">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-violet-300" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-950 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Open community"
            title="Built in the open, backed by a real ecosystem"
            description="MIT-licensed, publicly governed, with TSC members from five organizations."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {credibilityPoints.map((item) => (
              <article
                key={item.label}
                className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 text-center sm:p-6"
              >
                <p className="text-3xl font-bold text-white sm:text-4xl">{item.value}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
                  {item.label}
                </p>
                {"detail" in item && item.detail && (
                  <p className="mt-2 text-sm leading-6 text-gray-400">{item.detail}</p>
                )}
              </article>
            ))}
          </div>
          <div className="mt-10 grid gap-4 rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:grid-cols-2 lg:grid-cols-5">
            {contributorLogos.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 py-6"
              >
                <Image
                  src={withBasePath(logo.src)}
                  alt={logo.name}
                  width={180}
                  height={60}
                  unoptimized
                  className="h-10 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-neutral-900 to-black py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to try it?
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-base leading-7 text-gray-400 sm:text-lg">
            Go from zero to vector search in four commands. Open source, self-hosted, MIT-licensed.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/docs/getting-started/docker"
              className="inline-flex items-center justify-center rounded-md bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
            >
              Start with Docker
            </Link>
            <a
              href="https://github.com/documentdb/documentdb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-neutral-600 bg-neutral-800/40 px-6 py-3 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
