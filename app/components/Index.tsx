"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { capitalCase } from 'change-case';
import pluralize from 'pluralize';
import React, { useEffect, useRef } from 'react';

type ReferencePage = {
  name: string;
  description: string;
  reference: string;
  type: string;
  category?: string;
};

type NavigationStructure = {
  type: string;
  displayName: string;
  categories: {
    category: string;
    displayName: string;
    items: ReferencePage[];
  }[];
}[];

const icons = {
  chevronRight: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  ),
};

export default function Index({
  groupedReferences
}: {
  groupedReferences: Record<string, Record<string, ReferencePage[]>>;
}) {
  const pathname = usePathname();
  const activeItemRef = useRef<HTMLAnchorElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  
  // Auto-scroll to active item when pathname changes
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeItem = activeItemRef.current;
      
      // Calculate position to scroll within the container
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const scrollOffset = itemRect.top - containerRect.top - (containerRect.height / 2) + (itemRect.height / 2);
      
      // Instant scroll without animation
      container.scrollBy({
        top: scrollOffset,
        behavior: 'instant'
      });
    }
  }, [pathname]);
  
  // Convert old structure to new structure
  const navigationStructure: NavigationStructure = Object.entries(groupedReferences)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, categories]) => ({
      type,
      displayName: type,
      categories: Object.entries(categories)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, items]) => ({
          category,
          displayName: category,
          items: items.sort((a, b) => a.name.localeCompare(b.name))
        }))
    }));

  // Parse pathname to determine current location
  const pathParts = pathname.split('/').filter(Boolean);
  const currentType = pathParts[2]; // /docs/reference/[type]
  const currentCategory = pathParts[3]; // /docs/reference/[type]/[category]
  const currentName = pathParts[4] ? decodeURIComponent(pathParts[4]) : undefined; // /docs/reference/[type]/[category]/[name]

  return (
    <section ref={containerRef} className="flex-1 overflow-y-auto p-4 min-h-0">
      <nav className="space-y-1">
        {navigationStructure.map((typeSection, typeIndex) => {
          // Types are always expanded
          const isTypeExpanded = true;
          const isTypeActive = pathname === `/docs/reference/${typeSection.type}`;

          return (
            <div key={typeSection.type}>
              {/* Separator between type sections (not before first) */}
              {typeIndex > 0 && (
                <div className="my-4 border-t border-neutral-700/50"></div>
              )}

              {/* Type row */}
              <div className="flex items-center gap-1">
                <div className="p-1 flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-gray-500 rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {icons.chevronRight}
                  </svg>
                </div>
                <Link
                  href={`/docs/reference/${typeSection.type}`}
                  ref={isTypeActive ? activeItemRef : null}
                  className={`flex-1 px-3 py-3 rounded-lg text-sm font-semibold uppercase transition-all duration-200 ${
                    isTypeActive
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-gray-300 hover:text-white hover:bg-neutral-700/50"
                  }`}
                >
                  {pluralize(capitalCase(typeSection.displayName))}
                </Link>
              </div>

              {/* Categories */}
              {isTypeExpanded && typeSection.categories.map((categorySection) => {
                // Category is expanded if we're on that category page or on one of its item pages
                const isCategoryExpanded = currentType === typeSection.type && currentCategory === categorySection.category;
                const isCategoryActive = pathname === `/docs/reference/${typeSection.type}/${categorySection.category}`;

                return (
                  <div key={`${typeSection.type}-${categorySection.category}`}>
                    {/* Category row */}
                    <div className="flex items-center gap-1 pl-4">
                      <div className="p-1 flex-shrink-0">
                        <svg
                          className={`w-3 h-3 text-gray-500 transition-transform ${isCategoryExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {icons.chevronRight}
                        </svg>
                      </div>
                      <Link
                        href={`/docs/reference/${typeSection.type}/${categorySection.category}`}
                        ref={isCategoryActive ? activeItemRef : null}
                        className={`flex-1 px-3 py-3 rounded-lg text-sm transition-all duration-200 ${
                          isCategoryActive
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "text-gray-300 hover:text-white hover:bg-neutral-700/50"
                        }`}
                      >
                        {capitalCase(categorySection.displayName)}
                      </Link>
                    </div>

                    {/* Individual reference items */}
                    {isCategoryExpanded && categorySection.items.map((item) => {
                      const itemFilename = item.reference.split('/').pop();
                      const itemPath = `/docs/reference/${typeSection.type}/${categorySection.category}/${itemFilename}`;
                      // Decode pathname to match against the constructed path
                      const decodedPathname = decodeURIComponent(pathname);
                      const isItemActive = decodedPathname === itemPath || pathname === itemPath;

                      return (
                        <div key={item.reference} className="flex items-center pl-10 ml-4">
                          <Link
                            href={itemPath}
                            ref={isItemActive ? activeItemRef : null}
                            className={`flex-1 px-3 py-3 rounded-lg text-sm transition-all duration-200 ${
                              isItemActive
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "text-gray-400 hover:text-white hover:bg-neutral-700/50"
                            }`}
                          >
                            {item.name}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>
    </section>
  );
}
