import { Metadata } from "next";
import { remark } from "remark";
import strip from "strip-markdown";

/**
 * Sanitizes Markdown content to plain text for SEO purposes
 * Removes Markdown formatting, code blocks, and special characters
 */
export const sanitizeMarkdown = async (markdown: string | undefined): Promise<string> => {
  if (!markdown) return '';
  
  let processor = remark().use(strip).process(markdown);
  
  let output: string = String(await processor);
  
  return output.trim();
};
import { getBaseUrl, getOpenGraphImageRelativePath } from './siteService';

interface MetadataParams {
  title: string;
  description: string;
  extraKeywords?: string[];
  pagePath?: string;
}

export const getMetadata = ({ 
  title, 
  description, 
  extraKeywords = [],
  pagePath
}: MetadataParams): Metadata => {
  const baseUrl = getBaseUrl();
  
  // Always generate the custom OG image URL
  const customOGImage = `${baseUrl}${getImagePath(pagePath)}`;
  
  return {
    keywords: [...getBaseKeywords(), ...extraKeywords],
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      // Array provides implicit fallback - first available image is used
      images: [
        { url: customOGImage },
        { url: `${baseUrl}/images/social-card.png` }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        { url: customOGImage },
        { url: `${baseUrl}/images/social-card.png` }
      ]
    },
    robots: {
      index: true,
      follow: true
    }
  };
};

function getImagePath(pagePath?: string): string {
  const relativePath = getOpenGraphImageRelativePath();
  
  if (!pagePath) {
    return `${relativePath}/home.png`;
  }
  
  const sanitizedPath = pagePath.replace(/^\//, '').replace(/\//g, '-');
  return `${relativePath}/${sanitizedPath}.png`;
}

const getBaseKeywords = (): string[] => [
  'DocumentDB',
  'document database',
  'open source',
  'NoSQL',
  'database',
  'MongoDB compatible',
  'PostgreSQL',
  'MQL',
  'MongoDB Query Language',
  'JSON documents',
  'scalable database',
  'distributed database',
];