import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

const pathname = vi.hoisted(() => ({ value: '' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));

import Index from '../app/components/Index';

const item = (name: string) => ({ name, description: '', reference: `operators/accumulators/${name}`, type: 'operators', category: 'accumulators' });
const groupedReferences = { operators: { accumulators: [item('$avg'), item('$sum')] } };

function currentLinks(path: string) {
  pathname.value = path;
  const html = renderToStaticMarkup(createElement(Index, { groupedReferences }));
  return [...html.matchAll(/<a[^>]*aria-current="page"[^>]*>([^<]*)<\/a>/g)].map((match) => match[1]);
}

describe('Reference sidebar current page', () => {
  // trailingSlash: true serves every page at "/x/"; the static render sees "%24", the browser "$"
  it('marks exactly the current entry', () => {
    expect(currentLinks('/docs/reference/operators/accumulators/%24avg/')).toEqual(['$avg']);
    expect(currentLinks('/docs/reference/operators/accumulators/$avg/')).toEqual(['$avg']);
    expect(currentLinks('/docs/reference/operators/accumulators/')).toEqual(['Accumulators']);
    expect(currentLinks('/docs/reference/operators/')).toEqual(['Operators']);
  });
});
