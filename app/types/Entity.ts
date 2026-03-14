export interface Entity {
  url: string;           // Relative URL path (e.g., '/docs/quickstart')
  slug: string;          // Where to save assets (relative path)
  title: string;         // Page title
  description: string;   // Page description
  section?: string;      // Section category (e.g., 'docs', 'blog', 'reference')
  filePath?: string;     // Source file path (for git lastModified)
  isExternal?: boolean;  // Indicates if the content is external
  type: 'home' | 'landing' | 'docs' | 'blog' | 'reference' | 'packages';
}