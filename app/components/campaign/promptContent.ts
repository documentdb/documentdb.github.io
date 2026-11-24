export const galleryRevision = "d69f00ff9e86a7b0b9791c5eb32d47bd20e481d0";
export const agentKitUrl = "https://github.com/documentdb/agent-kit";
export const agentKitRevision = "d10f02a9fcd1694b390658d9098a6945948eff97";
export const SAMPLES_GALLERY_URL = "https://github.com/documentdb/documentdb-samples-gallery";
export const documentDbImage = "ghcr.io/documentdb/documentdb/documentdb-local@sha256:1d40546ccf53a0229f98a0848b7c3d6d74dc35a9fa535a1d1c8f70e3bed10d23";

const setup = `Clone ${agentKitUrl} into a new, separate directory and check out commit ${agentKitRevision}, using separate shell commands for clone and checkout. Read its AGENTS.md and use the build-app, data-integrity, and verify-app skills under skills/ as each stage becomes relevant. No plugin or global installation is needed; do not change global agent settings.

Follow the gallery sample's own setup below, not the Agent-Kit task starter or its full quickstart. Apply the skills to the sample's existing user flows, schema, and query shapes; do not replace the sample or add unrelated features to satisfy a generic CRUD checklist. Keep integrity checks read-only, scope verification writes to your new sample-only database, and report unsupported or unverified checks honestly.

Clone ${SAMPLES_GALLERY_URL} into a new workspace and check out commit ${galleryRevision}, using separate shell commands for clone and checkout. Inspect the sample README, dependency manifests, and scripts before running them. If cloning, a prerequisite, or a permission is blocked, stop and ask; do not reconstruct or replace sample files.

Use only a new, isolated local DocumentDB OSS container from ${documentDbImage} and synthetic data. Do not reuse, reseed, stop, or delete an existing database/container. Check for port conflicts and use free, loopback-only ports. Both samples listen on all interfaces by default: make a minimal local-only change to the HTTP app.listen call to bind 127.0.0.1 before starting, and explain that change. Generate random local credentials and keep them in an ignored private environment file with owner-only permissions; never print them. Use authSource=admin, tls=true, directConnection=true, and retryWrites=false. Self-signed certificate exceptions are for this local container only. Keep package-registry TLS verification enabled and use the user's approved registry. Ask before any cloud deployment, paid API, global installation, or browser/model download.`;

export const samplePrompts = [
  {
    id: "retail",
    label: "Retail storefront",
    eyebrow: "FULL-STACK APPLICATION",
    title: "From product data to a working storefront.",
    description: "Seed a catalog, browse the shop, and test the APIs behind it. No model or cloud key needed.",
    stack: "Node.js 22+ · Docker · Express",
    folder: "retail-product-store-js",
    expected: "8 products · search + filters · product details",
    prompt: `${setup}

Run retail-product-store-js end to end. Prerequisites: Git, Node.js 22+, and Docker.
1. In that sample directory, use npm ci with its lockfile. Set DOCUMENTDB_URI to the isolated container, DB_NAME to a new sample-only database, and PORT to a free port in a private .env.
2. Run npm run seed ONLY against that new database, then npm start. Wait for the database connection and HTTP readiness; do not declare success merely because the process started.
3. Verify GET /api/products returns 8 products. Verify category=Electronics returns 3 products; price_asc sorts correctly; search=headphones returns one product; /api/products/<id> returns its details; and /api/categories includes All.
4. Open the storefront in a browser, check that products render, and try search, category filtering, and a product detail. If no browser is available, ask before installing one and report browser verification as blocked, not passed.
5. Give me the working local URL, the actual verification results, and exact commands to stop only the resources you created without deleting data. Leave the app running for me. If anything fails, report it explicitly rather than substituting MongoDB or mocked data.`,
  },
  {
    id: "memory",
    label: "AI memory",
    eyebrow: "MCP + DOCUMENTDB",
    title: "Give your AI a memory that lasts.",
    description: "Run an authenticated MCP server. Save, retrieve, and remove synthetic memories backed by real documents.",
    stack: "Node.js 22+ · Docker · optional Ollama",
    folder: "personal-memory-mcp-ts",
    expected: "Authenticated MCP · save + retrieve · soft delete",
    prompt: `${setup}

Run personal-memory-mcp-ts end to end. Prerequisites: Git, Node.js 22+, and Docker.
1. Work in personal-memory-mcp-ts/mcp-server. Run npm ci and npm run build. This directory has no .env.example; read the parent template and create an ignored private .env with DOCUMENTDB_URI, a new DB_NAME, a free MCP_SERVER_PORT, and a random AUTH_TOKEN.
2. Start with node --env-file=.env dist/index.js. Do not assume npm start loads .env: this sample does not import dotenv. Leave authentication enabled and keep the token out of logs/config snippets you show me.
3. GET /health must report db=connected. An unauthenticated /mcp request must return 401.
4. Use the installed MCP SDK Client and StreamableHTTPClientTransport, with the bearer header, to initialize, list tools, save a synthetic memory such as "The demo robot catalogs blue bicycles", retrieve it, get_profile, and delete_memory. Verify the record is persisted and deletion sets active=false. Do not store real personal information.
5. Optional semantic mode: if Ollama is installed or I approve a separate local model container/download, pull nomic-embed-text, set OLLAMA_BASE_URL and EMBEDDING_DIMENSIONS=768, restart only this sample, and verify stored embeddings have 768 values and semantic retrieval works. Without Ollama, explicitly report text/tag/regex mode, not semantic success.
6. Give me the local health URL, actual MCP results, and client configuration with a token placeholder plus the exact private file where I can obtain my token. Leave the app running and give stop commands limited to your own resources. Report failures explicitly; do not substitute a mocked service or MongoDB.`,
  },
] as const;
