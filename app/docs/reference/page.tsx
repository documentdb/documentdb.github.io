import Link from 'next/link';
import ReferenceTable from '../../components/Grid';
import Breadcrumb from '../../components/Breadcrumb';
import Markdown from '../../components/Markdown';
import { getReferencesGroupedByTypeAndCategory, getReferenceDescription } from '../../services/referenceService';
import { getMetadata, sanitizeMarkdown } from '../../services/metadataService';
import pluralize from 'pluralize';
import { capitalCase } from 'change-case';

export async function generateMetadata() {
  const description = getReferenceDescription();
  return getMetadata({
    title: 'DocumentDB MQL Reference',
    description: await sanitizeMarkdown(description),
    path: '/docs/reference/',
    extraKeywords: ['reference']
  });
}

export default function Home() {
  const grouped = getReferencesGroupedByTypeAndCategory();
  const description = getReferenceDescription();
  return (
    <article>
      <Breadcrumb />
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white mb-4">
          MongoDB Query Language (MQL)
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full mb-6"></div>
        {description && (
          <div className="text-gray-400 text-lg mb-6">
            <Markdown content={description} />
          </div>
        )}
      </div>
      {Object.entries(grouped).map(([type, categories]) => {
        return (
          <section key={type} className="mb-10">
            <div className="flex items-center mb-4">
              <Link href={`/docs/reference/${type}`} className="text-3xl font-bold text-white mb-2 mt-4 capitalize">
                {capitalCase(pluralize(type))}
              </Link>
            </div>
            {Object.entries(categories).map(([category, items]) => (
              <section key={category} className="mb-6">
                <div className="bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-700/50 p-6">
                  <Link href={`/docs/reference/${type}/${category}`} className="text-xl font-semibold text-white capitalize">
                    {capitalCase(category)} {capitalCase(pluralize(type))}
                  </Link>
                  <div className="mt-4">
                    <ReferenceTable items={items} />
                  </div>
                </div>
              </section>
            ))}
          </section>
        );
      })}
    </article>
  );
}