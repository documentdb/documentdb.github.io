import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AIPage from '../app/ai/page';
import { samples } from '../app/data/samples';

describe('AI page', () => {
  const html = renderToStaticMarkup(createElement(AIPage));

  it('shows every vector search sample from the gallery', () => {
    const aiSamples = samples.filter((sample) => sample.tags.includes('Vector Search'));
    expect(aiSamples.length).toBeGreaterThan(0);
    for (const sample of aiSamples) {
      expect(html).toContain(`href="${sample.githubUrl}"`);
    }
  });

  // A sample renamed or removed in the gallery registry would otherwise drop its link silently
  it('links the RAG, search, and agent memory use cases to their samples', () => {
    expect(html.match(/>Sample: /g)).toHaveLength(3);
  });
});
