import { Metadata } from "next";
import { remark } from "remark";
import strip from "strip-markdown";

/**
 * Sanitizes Markdown content to plain text for SEO purposes
 * Removes Markdown formatting, code blocks, and special characters
 */
export const sanitizeMarkdown = async (markdown: string | undefined): Promise<string> => {
  if (!markdown) return '';
  
  const processor = remark().use(strip).process(markdown);
  
  const output: string = String(await processor);
  
  return output.trim();
};

export const siteUrl = 'https://documentdb.io';

export const getMetadata = ({ title, description, path, type = 'website', extraKeywords = [] }: {
  title: string,
  description: string,
  /**
   * Site-relative path of the page (e.g. '/docs/reference/'), used as the
   * canonical URL. Pages without a known path get no canonical tag.
   */
  path?: string,
  /** Open Graph object type; use 'article' for docs/reference content pages. */
  type?: 'website' | 'article',
  extraKeywords?: string[],
}): Metadata => ({
  metadataBase: new URL(siteUrl),
  keywords: [...getBaseKeywords(), ...extraKeywords],
  title,
  description,
  ...(path ? { alternates: { canonical: path } } : {}),
  openGraph: {
    type,
    title,
    description,
    images: [
      {
        url: `${siteUrl}/images/social-card.png`,
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [
      {
        url: `${siteUrl}/images/social-card.png`,
      }
    ]
  },
  robots: {
    index: true,
    follow: true
  }
});

const getBaseKeywords = (): string[] => [
  'DocumentDB',
  'document database',
  'open source',
  'NoSQL',
  'database',
  'PostgreSQL',
  'document data API',
  'JSON documents',
  'scalable database',
  'distributed database',
];
