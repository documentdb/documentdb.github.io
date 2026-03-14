import { getAllArticlePaths, getArticleByPath } from './articleService';
import { getAllPosts } from './blogService';
import { getReferencesGroupedByTypeAndCategory, getAllReferenceParams, getReferenceByPath } from './referenceService';
import path from 'path';
import { Entity } from '../types/Entity';

export function getAllContent(): Entity[] {
  const pages: Entity[] = [];
    
  // 1. Home page
  pages.push({
    url: '/',
    slug: 'home.png',
    title: 'DocumentDB',
    description: 'A powerful, scalable open-source document database solution',
    type: 'home',
  });
  
  // 2. Docs landing
  pages.push({
    url: '/docs',
    slug: 'docs.png',
    title: 'Documentation',
    description: 'Complete DocumentDB documentation and guides',
    section: 'docs',
    type: 'landing',
  });
  
  // 3. All article/documentation pages
  const articlePaths = getAllArticlePaths();
  for (const articlePath of articlePaths) {
    const article = getArticleByPath(articlePath.section, articlePath.slug);
    if (article) {
      const selectedNavItem = article.navigation.find((item: any) => 
        item.link.includes(articlePath.slug[articlePath.slug.length - 1] || 'index')
      );
      const title = article.frontmatter.title || selectedNavItem?.title || articlePath.section;
      
      let url = `/docs/${articlePath.section}`;
      if (articlePath.slug.length > 0) {
        url += `/${articlePath.slug.join('/')}`;
      }
      
      const mdFilePath = path.join(
        process.cwd(), 
        'articles', 
        articlePath.section, 
        ...articlePath.slug, 
        'index.md'
      );

      // Convert URL to slug filename
      const slug = url === '/' 
        ? 'home.png'
        : url.slice(1).replace(/\//g, '-') + '.png';
      
      pages.push({
        url,
        slug,
        title,
        description: article.frontmatter.description || `${title} - DocumentDB Documentation`,
        section: articlePath.section,
        type: 'docs',
        filePath: mdFilePath,
      });
    }
  }
  
  // 4. Blogs landing
  pages.push({
    url: '/blogs',
    slug: 'blogs.png',
    title: 'Blog',
    description: 'Latest insights and updates from DocumentDB',
    section: 'blog',
    type: 'landing',
  });
  
  // 5. Individual blog posts (external URIs)
  const posts = getAllPosts();
  for (const post of posts) {
    // Generate slug from title (for external blog posts without slugs)
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const url = `/blogs/${slug}`;
    const filename = url.slice(1).replace(/\//g, '-') + '.png';
    
    pages.push({
      url,
      slug: filename,
      title: post.title,
      description: post.description,
      section: 'blog',
      type: 'blog',
      isExternal: true, // Mark as external since these redirect to external URIs
    });
  }
  
  // 6. Reference landing page
  pages.push({
    url: '/docs/reference',
    slug: 'docs-reference.png',
    title: 'API Reference',
    description: 'Complete DocumentDB API reference documentation',
    section: 'reference',
    type: 'landing',
  });
  
  // 7. Reference type pages (e.g., /docs/reference/commands)
  const referenceContent = getReferencesGroupedByTypeAndCategory();
  for (const [type] of Object.entries(referenceContent)) {
    const url = `/docs/reference/${type}`;
    const slug = url.slice(1).replace(/\//g, '-') + '.png';
    
    pages.push({
      url,
      slug,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Reference`,
      description: `DocumentDB ${type} reference documentation`,
      section: 'reference',
      type: 'landing',
    });
  }
  
  // 8. Reference category pages (e.g., /docs/reference/operators/aggregation)
  for (const [type, categories] of Object.entries(referenceContent)) {
    for (const [category] of Object.entries(categories)) {
      const url = `/docs/reference/${type}/${category}`;
      const slug = url.slice(1).replace(/\//g, '-') + '.png';
      
      pages.push({
        url,
        slug,
        title: `${category} - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `${category} ${type} reference documentation`,
        section: 'reference',
        type: 'landing',
      });
    }
  }
  
  // 9. Individual reference items
  const referenceParams = getAllReferenceParams();
  for (const param of referenceParams) {
    const reference = getReferenceByPath(param.type, param.category, param.name);
    if (reference) {
      const url = `/docs/reference/${param.type}/${param.category}/${param.name}`;
      const slug = url.slice(1).replace(/\//g, '-') + '.png';
      
      const mdFilePath = path.join(
        process.cwd(), 
        'reference', 
        param.type, 
        param.category, 
        `${param.name}.yml`
      );
      
      pages.push({
        url,
        slug,
        title: reference.name || param.name,
        description: reference.frontmatter.description || `${param.name} - DocumentDB Reference`,
        section: 'reference',
        type: 'reference',
        filePath: mdFilePath,
      });
    }
  }
  
  // 10. Packages page
  pages.push({
    url: '/packages',
    slug: 'packages.png',
    title: 'Packages',
    description: 'Download and install DocumentDB packages',
    type: 'packages',
  });

  return pages;
}
