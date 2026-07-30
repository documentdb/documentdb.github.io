import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";

export default defineConfig([
  {
    ignores: [
      ".next/**",
      "out/**",
      "coverage/**",
      "build/**",
      "node_modules/**",
      // Jekyll vendors its gems into vendor/bundle when bundler-cache is on,
      // which drops third-party JavaScript such as Jekyll's minified
      // livereload.js into the tree. These paths are in .gitignore, but flat
      // config does not read .gitignore, so they have to be listed here too.
      "vendor/**",
      ".jekyll-cache/**",
      "**/_site/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      semi: "error",
      "prefer-const": "error",
    },
  },
]);
