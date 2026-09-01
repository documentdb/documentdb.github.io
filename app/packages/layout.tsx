import { getMetadata } from "../services/metadataService";

// The packages page is a client component, so its metadata lives here.
export const metadata = getMetadata({
  title: "Download DocumentDB - Docker, APT, and RPM Packages",
  description:
    "Run DocumentDB with Docker or install the full stack from GPG-signed repositories for Ubuntu 24.04 and EL9, including Rocky-family systems and registered RHEL. Build other targets from source.",
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
