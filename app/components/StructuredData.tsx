import { siteUrl } from "../services/metadataService";

export const softwareId = `${siteUrl}/#software`;

export const projectStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#project`,
      name: "DocumentDB",
      url: `${siteUrl}/`,
      parentOrganization: {
        "@type": "Organization",
        name: "The Linux Foundation",
        url: "https://www.linuxfoundation.org/",
      },
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": softwareId,
      name: "DocumentDB",
      description: "An MIT-licensed, open-source, MongoDB-compatible document database built on PostgreSQL.",
      url: `${siteUrl}/`,
      codeRepository: "https://github.com/documentdb/documentdb",
      license: "https://opensource.org/license/mit",
      programmingLanguage: ["C", "Rust"],
      publisher: { "@id": `${siteUrl}/#project` },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "DocumentDB",
      url: `${siteUrl}/`,
      about: { "@id": softwareId },
      publisher: { "@id": `${siteUrl}/#project` },
    },
  ],
};

export function articleStructuredData({
  title, description, path, breadcrumbs, dateModified,
}: {
  title: string;
  description?: string;
  path: string;
  breadcrumbs: { name: string; path: string }[];
  dateModified?: string;
}) {
  const url = new URL(path, siteUrl).href;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: title,
        description,
        url,
        mainEntityOfPage: url,
        inLanguage: "en",
        about: { "@id": softwareId },
        isPartOf: { "@id": `${siteUrl}/#website` },
        publisher: { "@id": `${siteUrl}/#project` },
        ...(dateModified ? { dateModified } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: new URL(item.path, siteUrl).href,
        })),
      },
    ],
  };
}

export default function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
