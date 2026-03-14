import { MetadataRoute } from 'next';
import { getAllContent } from './services/contentService';
import { getBaseUrl } from './services/siteService';
import { execSync } from 'child_process';
import path from 'path';

// Required to evaluate at build time
export const dynamic = 'force-static';

// Get the last git commit date for a specific file
const getGitLastModified = (filePath: string): Date => {
  try {
    // Convert absolute path to relative path from repo root
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const output = execSync(
      `git log -1 --format=%cI -- "${relativePath}"`,
      { encoding: 'utf-8', cwd: process.cwd() }
    ).trim();

    return output ? new Date(output) : new Date();
  } catch (error) {
    console.warn(`Could not get git date for ${filePath}`);
    return new Date();
  }
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const entities = getAllContent();

  return entities
    .filter(entity => !entity.isExternal) // Exclude external blog posts
    .map(entity => {
      // Determine priority and change frequency based on page type and depth
      let priority = 0.00;
      let changeFrequency: 'yearly' | 'monthly' | 'weekly' = 'yearly';

      if (entity.type === 'home') {
        priority = 1.0;
        changeFrequency = 'yearly';
      } else if (entity.type === 'docs') {
        priority = 0.85;
        changeFrequency = 'weekly';
      } else if (entity.type === 'packages') {
        priority = 0.70;
        changeFrequency = 'weekly';
      } else if (entity.type === 'reference') {
        priority = 0.55;
        changeFrequency = 'monthly';
      } else if (entity.type === 'blog') {
        priority = 0.40;
        changeFrequency = 'monthly';
      } else if (entity.type === 'landing') {
        priority = 0.25;
        changeFrequency = 'monthly';
      }

      // Get last modified date from git
      const lastModified = entity.filePath 
        ? getGitLastModified(entity.filePath)
        : new Date();

      return {
        url: `${baseUrl}${entity.url}`,
        lastModified,
        changeFrequency,
        priority,
      };
    });
}
