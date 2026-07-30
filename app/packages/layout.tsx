import { getMetadata } from "../services/metadataService";

// The packages page is a client component, so its metadata lives here.
export const metadata = getMetadata({
  title: "Download DocumentDB - Docker, APT, and RPM Packages",
  description:
    "Run DocumentDB locally with Docker or install the PostgreSQL extension from GPG-signed APT and RPM packages for Ubuntu, Debian, and RHEL-compatible systems.",
  path: "/packages/",
  extraKeywords: ["download", "install", "Docker", "APT", "RPM", "Debian", "Ubuntu", "RHEL"],
});

export default function PackagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
