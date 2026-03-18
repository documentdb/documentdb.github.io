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

export const getMetadata = ({ title, description, extraKeywords = [] }: { title: string, description: string, extraKeywords?: string[] }): Metadata => ({
  keywords: [...getBaseKeywords(), ...extraKeywords],
  title,
  description,
  openGraph: {
    type: 'article',
    title,
    description,
    images: [
      {
        url: 'https://documentdb.io/images/social-card.png',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [
      {
        url: 'https://documentdb.io/images/social-card.png',
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
