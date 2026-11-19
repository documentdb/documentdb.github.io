import { notFound } from 'next/navigation';
import Breadcrumb from '../../../../../components/Breadcrumb';
import Markdown from '../../../../../components/Markdown';
import { getAllReferenceParams, getReferenceByPath } from '../../../../../services/referenceService';
import { getMetadata, getModifiedTime } from "../../../../../services/metadataService";
import StructuredData, { articleStructuredData } from "../../../../../components/StructuredData";

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
    path: `/docs/reference/${type}/${category}/${name}/`,
    type: 'article',
    modifiedTime: getModifiedTime(data.frontmatter.last_modified_at),
    extraKeywords: ['reference', type, category, name]
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
      <StructuredData data={articleStructuredData({
        title: pageTitle,
        description: pageDescription,
        path: `/docs/reference/${type}/${category}/${name}/`,
        dateModified: getModifiedTime(data.frontmatter.last_modified_at),
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: 'Documentation', path: '/docs/' },
          { name: 'MQL Reference', path: '/docs/reference/' },
          { name: type, path: `/docs/reference/${type}/` },
          { name: category, path: `/docs/reference/${type}/${category}/` },
          { name: pageTitle, path: `/docs/reference/${type}/${category}/${name}/` },
        ],
      })} />
      <Breadcrumb type={type} category={category} name={pageTitle} />
      
      {/* Markdown Content */}
      <Markdown
        content={data.content}
        sourcePath={`/docs/reference/${type}/${category}/${decodedName}.md`}
      />
    </article>
  );
}