import type { ReactNode } from "react";
import Link from "next/link";
import CommandSnippet from "../components/CommandSnippet";
import { SampleCard } from "../components/SampleCard";
import TelemetryNote from "../components/TelemetryNote";
import { samples } from "../data/samples";
import { getMetadata } from "../services/metadataService";

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

const agentKitUrl = "https://github.com/Azure/documentdb-agent-kit";
const vectorSearchReference = "/docs/reference/operators/aggregation/$vectorsearch/";

const quickRunCommand = `docker run -dt --pull always --name documentdb \\
  -p 127.0.0.1:10260:10260 \\
  -e USERNAME=admin \\
  -e PASSWORD=password \\
  ghcr.io/documentdb/documentdb/documentdb-local:latest`;

const modelCommand = `ollama pull nomic-embed-text
pip install pymongo ollama`;

const storeCode = `import ollama
from pymongo import MongoClient

client = MongoClient("mongodb://admin:password@localhost:10260/?tls=true&tlsAllowInvalidCertificates=true")
db = client.demo

def embed(text):
    return ollama.embed(model="nomic-embed-text", input=text)["embeddings"][0]

notes = [
    "DocumentDB is an open-source document database built on PostgreSQL.",
    "Our office is closed on public holidays.",
    "Keep each text chunk next to its embedding so retrieval returns the source.",
]
db.notes.insert_many([{"text": t, "embedding": embed(t)} for t in notes])

db.command({
    "createIndexes": "notes",
    "indexes": [{
        "key": {"embedding": "cosmosSearch"},
        "name": "vector_idx",
        "cosmosSearchOptions": {
            "kind": "vector-hnsw",
            "similarity": "COS",
            "dimensions": 768,  # nomic-embed-text output size
        },
    }],
})`;

const searchCode = `question = "Which database runs on Postgres?"
results = db.notes.aggregate([
    {"$vectorSearch": {"queryVector": embed(question), "path": "embedding", "limit": 2}},
    {"$project": {"_id": 0, "text": 1, "score": {"$meta": "searchScore"}}},
])
for note in results:
    print(f"{note['score']:.2f}  {note['text']}")`;

const documentExample = `{
  _id: "handbook-chunk-42",
  text: "Keep each chunk next to its embedding...",
  source: "handbook.pdf",
  embedding: [0.0213, -0.0871, 0.0456, /* ...768 numbers */]
}`;

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
    title: "Run DocumentDB",
    description: "One command starts DocumentDB on port 10260 with local credentials.",
    label: "Docker",
    code: quickRunCommand,
  },
  {
    step: "02",
    title: "Get an embedding model",
    description:
      "Ollama runs an open embedding model on your machine, so your text never leaves it. Any model works; size the index to its output.",
    label: "Shell",
    code: modelCommand,
    link: { label: "Download Ollama", href: "https://ollama.com/download" },
  },
  {
    step: "03",
    title: "Store text with its embedding",
    description:
      "Embed each note, store it next to its text, and add an HNSW vector index with cosine similarity.",
    label: "Python: store",
    code: storeCode,
    link: { label: "createIndexes reference", href: "/docs/reference/commands/indexing/createIndexes/" },
  },
  {
    step: "04",
    title: "Ask a question",
    description:
      "Add this to the same script. It embeds the question and returns the closest notes with their similarity scores.",
    label: "Python: search",
    code: searchCode,
    link: { label: "$vectorSearch reference", href: vectorSearchReference },
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
    sampleId: "hotel-agent-ts",
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
    sampleId: "content-semantic-search-py",
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
    sampleId: "personal-memory-mcp-ts",
  },
  {
    badge: "Graph + AI",
    title: "Knowledge navigation",
    description:
      "Find the best vector matches, then traverse related entities with $graphLookup in one query pipeline.",
    points: [
      "Recursive traversal with depth control",
      "Useful when retrieval also needs relationship traversal",
    ],
    reference: { label: "$graphLookup reference", href: "/docs/reference/operators/aggregation/$graphlookup/" },
  },
];

// The gallery is compiled from its registry at build time, so new vector search samples show up here on their own
const aiSamples = samples.filter((sample) => sample.tags.includes("Vector Search"));
const aiFrameworks = ["LlamaIndex", "Ollama", "OpenAI", "MCP"].filter((tag) =>
  aiSamples.some((sample) => sample.tags.includes(tag)),
);

function useCaseLink(useCase: (typeof useCases)[number]) {
  if (useCase.reference) return useCase.reference;
  const sample = samples.find((candidate) => candidate.id === useCase.sampleId);
  return sample ? { label: `Sample: ${sample.title.split(":")[0]}`, href: sample.githubUrl } : null;
}

// Site paths go through Link so preview deployments keep their base path
function TextLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

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

const textLinkClass = "font-semibold text-violet-300 transition-colors hover:text-violet-200";

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
              <a
                href="#quick-start"
                className="inline-flex w-full items-center justify-center rounded-md bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-400 sm:w-auto"
              >
                Try it in four steps
              </a>
              <a
                href="#samples"
                className="inline-flex w-full items-center justify-center rounded-md border border-violet-400/40 bg-violet-500/10 px-6 py-3 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20 sm:w-auto"
              >
                See AI samples
              </a>
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                One document
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                No second database
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Your text, its metadata, and its embedding live together
            </h2>
            <div className="mt-5 overflow-x-auto rounded-lg border border-neutral-700 bg-black px-4 py-3">
              <pre className="m-0 whitespace-pre text-xs leading-relaxed text-green-400">
                <code>{documentExample}</code>
              </pre>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              A single <code className="text-violet-200">$vectorSearch</code> stage finds the
              nearest embeddings and returns the documents they belong to.
            </p>
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

      <section
        id="quick-start"
        className="relative scroll-mt-20 overflow-hidden border-b border-neutral-800 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_34%)] py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Easy start"
            title="Go from zero to vector search in four steps"
            description="Everything runs on your machine: DocumentDB in Docker, an open embedding model in Ollama, and a short Python script."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {quickStartSteps.map((item) => (
              <article
                key={item.step}
                className="flex h-full min-w-0 flex-col rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-[0_24px_80px_-50px_rgba(139,92,246,0.45)] sm:p-6"
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
                  {item.code === quickRunCommand && <TelemetryNote />}
                </div>
                {item.link ? (
                  <TextLink href={item.link.href} className={`mt-4 text-sm ${textLinkClass}`}>
                    {item.link.label} <span aria-hidden="true">&rarr;</span>
                  </TextLink>
                ) : null}
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/docs/getting-started/docker" className={textLinkClass}>
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
            {useCases.map((item) => {
              const link = useCaseLink(item);
              return (
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
                  {link ? (
                    <TextLink href={link.href} className={`mt-auto pt-5 text-sm ${textLinkClass}`}>
                      {link.label} <span aria-hidden="true">&rarr;</span>
                    </TextLink>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="samples" className="scroll-mt-20 border-b border-neutral-800 bg-neutral-950 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Samples"
            title="AI apps you can clone and run"
            description="Each sample is a complete app that stores its embeddings in DocumentDB and queries them with a standard Mongo driver."
          />
          {aiFrameworks.length > 0 ? (
            <div className="-mt-2 mb-8 flex flex-wrap items-center gap-2.5">
              <span className="text-sm text-gray-400">Built with</span>
              {aiFrameworks.map((framework) => (
                <span
                  key={framework}
                  className="rounded-full border border-neutral-700 bg-neutral-800/80 px-3 py-1 text-sm text-gray-200"
                >
                  {framework}
                </span>
              ))}
            </div>
          ) : null}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {aiSamples.map((sample) => (
              <SampleCard key={sample.id} sample={sample} />
            ))}
          </div>
          <Link href="/samples" className={`mt-8 inline-block text-sm ${textLinkClass}`}>
            Browse all samples <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900/60 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-3xl border border-violet-400/20 bg-violet-500/5 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
                  For coding agents
                </p>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
                  Public preview
                </span>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                Teach your coding agent DocumentDB
              </h2>
              <p className="text-base leading-7 text-gray-400">
                Agent-Kit gives Claude Code, Cursor, Codex, Gemini CLI, and GitHub Copilot skills
                for data modeling, indexing, and vector search, an MCP server, and read-only
                diagnostics for a local DocumentDB container.
              </p>
            </div>
            <a
              href={agentKitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-violet-400/40 bg-violet-500/10 px-6 py-3 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20"
            >
              Get Agent-Kit on GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-neutral-900 to-black py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to try it?
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-base leading-7 text-gray-400 sm:text-lg">
            Go from zero to vector search in four steps. Open source, self-hosted, MIT-licensed.
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
