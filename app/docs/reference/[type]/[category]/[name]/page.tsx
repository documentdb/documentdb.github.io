import { notFound } from 'next/navigation';
import Breadcrumb from '../../../../../components/Breadcrumb';
import Markdown from '../../../../../components/Markdown';
import { getAllReferenceParams, getReferenceByPath } from '../../../../../services/referenceService';
import { getMetadata } from "../../../../../services/metadataService";

export async function generateMetadata({ params }: { params: Promise<{ type: string; category: string; name: string }> }) {
  const { type, category, name } = await params;
  const decodedName = decodeURIComponent(name);
  const data = getReferenceByPath(type, category, decodedName);
  
  if (!data) {
    return getMetadata({
      title: 'Reference - DocumentDB MQL Reference',
      description: '',
      extraKeywords: ['reference', type, category, name]
    });
  }
  
  return getMetadata({
    title: `${data.frontmatter.title || name} - DocumentDB MQL Reference`,
    description: data.frontmatter.description || '',
    extraKeywords: ['reference', type, category, name],
    pagePath: `docs/reference/${type}/${category}/${name}`
  });
}

export async function generateStaticParams(): Promise<{ type: string; category: string; name: string }[]> {
  return getAllReferenceParams();
}

export default async function ReferencePage({ params }: { params: Promise<{ type: string; category: string; name: string }> }) {
  const { type, category, name } = await params;
  const decodedName = decodeURIComponent(name);
  const data = getReferenceByPath(type, category, decodedName);

  if (!data) {
    notFound();
  }

  const pageTitle = data.frontmatter.title || name;
  const pageDescription = data.frontmatter.description;

  return (
    <article>
      <Breadcrumb type={type} category={category} name={pageTitle} />
      
      {/* Markdown Content */}
      <Markdown content={data.content} />
    </article>
  );
}