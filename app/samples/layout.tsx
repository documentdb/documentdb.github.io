import { getMetadata } from "../services/metadataService";

// The samples page is a client component, so its metadata lives here.
export const metadata = getMetadata({
  title: "DocumentDB Samples Gallery",
  description:
    "Ready-to-run DocumentDB code samples: vector search, RAG, semantic search, and full-stack applications in Python, Node.js, and TypeScript.",
  path: "/samples/",
  extraKeywords: ["samples", "examples", "vector search", "RAG", "Python", "Node.js", "TypeScript"],
});

export default function SamplesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
