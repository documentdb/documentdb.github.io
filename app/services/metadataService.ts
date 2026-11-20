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

export function getModifiedTime(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : undefined;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  const day = value.slice(0, 10);
  if (new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) return undefined;
  return date.toISOString();
}

export const getMetadata = ({ title, description, path, type = 'website', extraKeywords = [], modifiedTime, noindex = false }: {
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
  modifiedTime?: string,
  noindex?: boolean,
}): Metadata => ({
  metadataBase: new URL(siteUrl),
  keywords: [...getBaseKeywords(), ...extraKeywords],
  title,
  description,
  ...(path ? { alternates: { canonical: path } } : {}),
  openGraph: {
    type,
    ...(path ? { url: path } : {}),
    ...(type === 'article' && getModifiedTime(modifiedTime) ? { modifiedTime: getModifiedTime(modifiedTime) } : {}),
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
    index: !noindex,
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
