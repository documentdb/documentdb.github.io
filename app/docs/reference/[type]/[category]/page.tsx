import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReferenceTable from '../../../../components/Grid';
import Breadcrumb from '../../../../components/Breadcrumb';
import Markdown from '../../../../components/Markdown';
import { getReferencesByTypeGroupedByCategory, getAllTypeCategoryCombinations, isValidTypeCategoryCombination, getCategoryDescription } from '../../../../services/referenceService';
import { getMetadata, sanitizeMarkdown } from "../../../../services/metadataService";
import pluralize from 'pluralize';
import { capitalCase } from 'change-case';

export const generateStaticParams = async (): Promise<{ type: string, category: string }[]> => {
  return getAllTypeCategoryCombinations();
};

export async function generateMetadata({ params }: { params: Promise<{ type: string; category: string }> }) {
  const { type, category } = await params;
  const title = `${capitalCase(category)} ${capitalCase(pluralize(type))}`;
  const description = getCategoryDescription(type, category);
  return getMetadata({
    title: `${title} - DocumentDB MQL Reference`, 
    description: await sanitizeMarkdown(description),
    extraKeywords: ['reference', type, category],
    pagePath: `docs/reference/${type}/${category}`
  });
}

export default async function CommandReferencePage({ params }: { params: Promise<{ type: string, category: string }> }) {
  const { type, category } = await params;
  if (!isValidTypeCategoryCombination(type, category)) {
    notFound();
  }
  const grouped = getReferencesByTypeGroupedByCategory(type);
  const items = grouped[category] || [];
  if (items.length === 0) {
    notFound();
  }
  const description = getCategoryDescription(type, category);
  return (
    <article>
      <Breadcrumb type={type} category={category} />
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white mb-4 capitalize">
          MongoDB Query Language (MQL) {capitalCase(category)} {capitalCase(pluralize(type))}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full mb-6"></div>
        {description && (
          <div className="text-gray-400 text-lg mb-6">
            <Markdown content={description} />
          </div>
        )}
      </div>
      <section className="mb-6">
        <div className="bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-700/50 p-6">
          <div className="mt-4">
            <ReferenceTable items={items} />
          </div>
        </div>
      </section>
    </article>
  );
}
