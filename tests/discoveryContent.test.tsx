import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import matter from "gray-matter";
import { afterEach, describe, expect, it, vi } from "vitest";
import PackagesPage from "../app/packages/page";
import ArticlePage, { generateMetadata } from "../app/docs/[section]/[[...slug]]/page";
import StructuredData, { articleStructuredData } from "../app/components/StructuredData";
import { getModifiedTime } from "../app/services/metadataService";
import * as articles from "../app/services/articleService";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("method=packages&pg=unsupported"),
  notFound: () => { throw new Error("Not found"); },
}));

afterEach(() => vi.restoreAllMocks());

function structuredData(html: string) {
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!json) throw new Error("Missing structured data");
  return JSON.parse(json);
}

describe("static discovery content", () => {
  it("exports standalone install commands without treating an unread query as a valid selection", () => {
    const html = renderToStaticMarkup(createElement(PackagesPage));
    expect(html).toContain('aria-label="Static installation quickstarts"');
    expect(html).toContain("not commands customized from this URL");
    expect(html).toContain("docker run");
    expect(html).toContain("-p 127.0.0.1:10260:10260");
    expect(html).toContain("sudo apt install");
    expect(html).toContain("sudo dnf install");
    expect(html).toContain("documentdb-setup");
    expect(html).not.toContain("Loading installation steps");
    expect(html).not.toContain('aria-pressed="true"');
  });

  it("preserves upstream architecture content", () => {
    const markdown = `---
title: Upstream architecture
description: Architecture documentation from upstream.
layout: coming-soon
---

Architecture details will be published here.
`;
    const directory = path.join(process.cwd(), "articles", "architecture");
    const files = new Map([
      [path.join(directory, "index.md"), markdown],
      [path.join(directory, "navigation.yml"), "- title: Architecture\n  link: index.md\n"],
    ]);
    const existsSync = fs.existsSync;
    const readFileSync = fs.readFileSync;
    vi.spyOn(fs, "existsSync").mockImplementation((file) =>
      files.has(file.toString()) || existsSync(file),
    );
    vi.spyOn(fs, "readFileSync").mockImplementation((file, options) =>
      files.get(file.toString()) ?? readFileSync(file, options),
    );

    const source = matter(markdown);
    const architecture = articles.getArticleByPath("architecture");
    expect(architecture?.content).toBe(source.content);
    expect(architecture?.frontmatter).toEqual(source.data);
    expect(architecture?.frontmatter.markdownPath).toBeUndefined();
  });

  it("keeps other coming-soon articles out of search and article schema", async () => {
    vi.spyOn(articles, "getArticleByPath").mockReturnValue({
      content: "Not available yet.",
      frontmatter: { title: "Future guide", layout: "coming-soon" },
      navigation: [],
      section: "future",
      file: "index",
    });
    const params = Promise.resolve({ section: "future" });
    expect((await generateMetadata({ params })).robots).toEqual({ index: false, follow: true });
    const html = renderToStaticMarkup(await ArticlePage({ params }));
    expect(html).not.toContain('type="application/ld+json"');
  });

  it("escapes JSON-LD script boundaries while preserving the original article title", () => {
    const title = '</script><img src=x onerror="alert(1)">';
    const data = articleStructuredData({
      title,
      path: "/docs/example/",
      breadcrumbs: [{ name: title, path: "/docs/example/" }],
    });
    const html = renderToStaticMarkup(createElement(StructuredData, { data }));
    expect(html).not.toContain("<img");
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(structuredData(html)["@graph"][0].headline).toBe(title);
  });

  it.each(["2026-02-30", "not a date", 123, undefined])("omits untrustworthy modification date %s", (value) => {
    expect(getModifiedTime(value)).toBeUndefined();
  });

  it("preserves valid content timestamps with timezone offsets", () => {
    expect(getModifiedTime("2026-11-18T23:30:00-08:00")).toBe("2026-11-19T07:30:00.000Z");
  });

});
