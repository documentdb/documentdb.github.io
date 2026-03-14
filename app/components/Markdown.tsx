'use client';

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo } from 'react';
import type { ReactElement } from 'react';
import Code from './Code';
import { kebabCase } from 'change-case';

interface MarkdownProps {
  content: string;
  currentPath?: string; // e.g., "architecture/index" or "quickstart/extension"
}

export default function Markdown({ content, currentPath }: MarkdownProps) {
  const processedContent = useMemo(() => {
    // Split content by H2 headings to group sections
    const sections = content.split(/^## /gm);
    const elements: ReactElement[] = [];

    sections.forEach((section, index) => {
      if (!section.trim()) return;

      // First section (before any H2) is intro text
      if (index === 0) {
        elements.push(
          <div key={`intro-${index}`} className="mb-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={getMarkdownComponents(currentPath)}
            >
              {section}
            </ReactMarkdown>
          </div>
        );
      } else {
        // Extract H2 title (first line) and content (rest)
        const lines = section.split('\n');
        const title = lines[0];
        const sectionContent = lines.slice(1).join('\n');

        elements.push(
          <div key={`section-${index}`} className="bg-neutral-800/50 backdrop-blur-sm rounded-lg border border-neutral-700/50 p-6">
            <a className="invisible scroll-mt-24" id={kebabCase(title)} />
            <h2 className="text-2xl font-semibold text-white mb-4">
              {title}
            </h2>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={getMarkdownComponents(currentPath)}
            >
              {sectionContent}
            </ReactMarkdown>
          </div>
        );
      }
    });

    return elements;
  }, [content]);

  return <div className="space-y-8">{processedContent}</div>;
}

/**
 * Convert a relative markdown link to the correct Next.js route
 * @param href - The href from the markdown (e.g., "../quickstart/extension.md")
 * @param currentPath - The current article path (e.g., "architecture/index")
 * @returns The converted route (e.g., "/docs/quickstart/extension")
 */
function convertMarkdownLink(href: string, currentPath?: string): string {
  // Only process relative links that end with .md
  if (!href.endsWith('.md') || href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }

  // Remove the .md extension
  let linkPath = href.replace(/\.md$/, '');

  // If it's a relative path, resolve it
  if (linkPath.startsWith('../') || linkPath.startsWith('./')) {
    if (!currentPath) {
      // Fallback: just remove ./ and ../ and hope for the best
      linkPath = linkPath.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
    } else {
      // Get the directory of the current file
      const currentDir = currentPath.includes('/') 
        ? currentPath.substring(0, currentPath.lastIndexOf('/'))
        : '';
      
      // Split the link into parts
      const linkParts = linkPath.split('/');
      const currentParts = currentDir.split('/').filter(p => p);

      // Process each part of the link
      for (const part of linkParts) {
        if (part === '..') {
          // Go up one directory
          currentParts.pop();
        } else if (part !== '.') {
          // Add to the path
          currentParts.push(part);
        }
      }

      linkPath = currentParts.join('/');
    }
  }

  // Remove trailing /index if present
  linkPath = linkPath.replace(/\/index$/, '');

  // Add /docs prefix if not already present
  return linkPath.startsWith('/') ? linkPath : `/docs/${linkPath}`;
}

function getMarkdownComponents(currentPath?: string) {
  return {
    // H1 headings (main page title from Markdown content)
    h1: ({ children, ...props }: any) => (
      <>
        <h1 className="text-4xl font-bold text-white mb-4" {...props}>
          {children}
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full mb-6"></div>
      </>
    ),

    // Paragraphs
    p: ({ children, ...props }: any) => (
      <p className="text-gray-300 text-md leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),

    // H3 sections (subsections within H2 cards)
    h3: ({ children, ...props }: any) => (
      <h3 className="text-lg font-medium text-white mb-3 mt-6">
        {children}
      </h3>
    ),

    // H4 subsections
    h4: ({ children, ...props }: any) => (
      <h4 className="text-base font-medium text-white mb-2 mt-4">
        {children}
      </h4>
    ),

    // Unordered lists with blue round bullets
    ul: ({ depth, ...props }: any) => (
      <ul
        className={depth > 0 ? "ml-6 space-y-2 text-gray-300 mb-4 list-disc list-inside" : "space-y-2 text-gray-300 mb-4 list-disc list-inside"}
        {...props}
      />
    ),

    // Ordered lists with blue numbers
    ol: ({ ...props }) => (
      <ol
        className="space-y-2 text-gray-300 mb-4 list-decimal list-inside"
        {...props}
      />
    ),

    // List items
    li: ({ ...props }) => (
      <li className="marker:text-blue-400 marker:mr-3 marker:flex-shrink-0 [&>p]:m-0 [&>p]:inline" {...props} />
    ),

    // Inline code
    code: ({ inline, children, ...props }: any) => {
      return (
        <code className="bg-neutral-900/50 px-2 py-1 rounded text-green-400 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },

    // Code blocks
    pre: ({ children, ...props }: any) => {
      // children is usually a single <code> element
      const codeElement = Array.isArray(children) ? children[0] : children;
      const codeString = codeElement?.props?.children
        ? String(codeElement.props.children).replace(/\n$/, '')
        : '';
      const lang =
        codeElement?.props?.className?.replace('language-', '') || 'javascript';

      return (
        <div
          {...props}
        >
          <Code code={codeString} language={lang} />
        </div>
      );
    },

    // Blockquotes (notes with GitHub-style alerts)
    blockquote: ({ children, ...props }: any) => {
      // Try to extract text content to check for alert type
      let alertType: string | null = null;
      let modifiedChildren = children;

      // Get the text content from the first child
      const getTextContent = (node: any): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(getTextContent).join('');
        if (node?.props?.children) return getTextContent(node.props.children);
        return '';
      };

      const textContent = getTextContent(children);

      // Check for alert markers
      if (textContent.trim().startsWith('[!NOTE]')) {
        alertType = 'note';
      } else if (textContent.trim().startsWith('[!WARNING]')) {
        alertType = 'warning';
      } else if (textContent.trim().startsWith('[!IMPORTANT]')) {
        alertType = 'important';
      } else if (textContent.trim().startsWith('[!TIP]')) {
        alertType = 'tip';
      } else if (textContent.trim().startsWith('[!CAUTION]')) {
        alertType = 'caution';
      }

      // If we found an alert type, remove the marker from the content
      if (alertType) {
        const removeMarker = (node: any): any => {
          if (typeof node === 'string') {
            // Remove marker from any string node
            return node.replace(/^\[!(NOTE|WARNING|IMPORTANT|TIP|CAUTION)\]\s*/, '');
          }
          if (Array.isArray(node)) {
            // Recursively process all children
            return node.map(removeMarker);
          }
          if (node?.props?.children) {
            // Recursively process children of React elements
            return {
              ...node,
              props: {
                ...node.props,
                children: removeMarker(node.props.children)
              }
            };
          }
          return node;
        };

        modifiedChildren = removeMarker(children);
      }

      // Style based on alert type
      const styles = {
        note: {
          container: 'bg-blue-900/20 border-blue-500/30',
          text: 'text-blue-200',
          title: 'Note'
        },
        warning: {
          container: 'bg-yellow-900/20 border-yellow-500/30',
          text: 'text-yellow-200',
          title: 'Warning'
        },
        important: {
          container: 'bg-purple-900/20 border-purple-500/30',
          text: 'text-purple-200',
          title: 'Important'
        },
        tip: {
          container: 'bg-green-900/20 border-green-500/30',
          text: 'text-green-200',
          title: 'Tip'
        },
        caution: {
          container: 'bg-red-900/20 border-red-500/30',
          text: 'text-red-200',
          title: 'Caution'
        }
      };

      const style = alertType ? styles[alertType as keyof typeof styles] : null;

      if (style) {
        return (
          <div className={`${style.container} ${style.text} border rounded-lg p-4 mb-4 [&_p]:text-sm [&_p]:mb-0 [&_p]:leading-relaxed [&_code]:text-xs [&_code]:bg-opacity-30`} {...props}>
            <div className="font-semibold mb-2">{style.title}</div>
            {modifiedChildren}
          </div>
        );
      }

      // Default blockquote style (blue note)
      return (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4 [&_p]:text-sm [&_p]:mb-0 [&_p]:leading-relaxed [&_code]:text-xs" {...props}>
          {children}
        </div>
      );
    },

    // Images
    img: ({ src, alt, ...props }: any) => {
      // Convert relative media paths to absolute paths
      const imageSrc = src?.startsWith('media/') ? `/${src}` : src;
      
      return (
        <img
          src={imageSrc}
          alt={alt}
          className="rounded-lg my-4 max-w-full h-auto"
          {...props}
        />
      );
    },

    // Links
    a: ({ children, href, ...props }: any) => {
      const convertedHref = convertMarkdownLink(href, currentPath);
      const isExternal = convertedHref.startsWith('http://') || convertedHref.startsWith('https://');

      return (
        <a
          href={convertedHref}
          className="text-blue-400 hover:text-blue-300 transition-colors"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },

    // Strong text
    strong: ({ children, ...props }: any) => (
      <strong className="font-medium text-white" {...props}>
        {children}
      </strong>
    ),

    // Tables
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-neutral-800/50" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="border border-neutral-700/50 px-4 py-2 text-left text-white font-semibold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-neutral-700/50 px-4 py-2 text-gray-300" {...props}>
        {children}
      </td>
    ),
  };
}
