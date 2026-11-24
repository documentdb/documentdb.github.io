import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Next's string-based PostCSS plugins are not compatible with Vite.
  css: {
    postcss: { plugins: [] },
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
});
