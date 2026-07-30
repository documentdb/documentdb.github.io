import { Metadata } from 'next';
import Link from 'next/link';
import Index from '../../components/Index';
import { getReferencesGroupedByTypeAndCategory } from '../../services/referenceService';
import { getMetadata } from "../../services/metadataService";

export const metadata: Metadata = getMetadata({
  title: 'DocumentDB MQL Reference',
  description: 'MongoDB Query Language (MQL) reference for DocumentDB.',
  extraKeywords: ['reference']
});

export default function ReferenceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const groupedReferences = getReferencesGroupedByTypeAndCategory();

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden max-h-screen">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-16 right-20 w-36 h-36 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 left-16 w-28 h-28 bg-purple-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>
      </div>
      <div className="relative flex h-screen">
        {/* Sidebar (desktop only; mobile gets the disclosure below) */}
        <div className="hidden w-80 bg-neutral-800/50 backdrop-blur-sm border-r border-neutral-700/50 md:flex flex-col h-full">
          <div className="p-6 border-b border-neutral-700/50 flex-shrink-0">
            <Link href="/docs" className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center transition-colors">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Documentation
            </Link>
            <Link className="text-2xl font-bold text-white" href={'/docs/reference'}>MQL Documentation</Link>
          </div>
          <Index groupedReferences={groupedReferences} />
        </div>
        <article className="flex-1 p-4 sm:p-8 overflow-y-auto h-full">
          <div className="max-w-4xl">
            {/* Mobile reference navigation */}
            <details className="mb-6 rounded-lg border border-neutral-700/50 bg-neutral-800/50 md:hidden">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-200">
                MQL reference navigation
              </summary>
              <div className="max-h-[60vh] overflow-y-auto border-t border-neutral-700/50">
                <Index groupedReferences={groupedReferences} />
              </div>
            </details>
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
