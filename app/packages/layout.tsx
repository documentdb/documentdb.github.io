import { getMetadata } from "../services/metadataService";

// The packages page is a client component, so its metadata lives here.
export const metadata = getMetadata({
  title: "Install DocumentDB - Docker and Linux Packages",
  description:
    "Run DocumentDB with Docker on Linux, macOS, or Windows, or install Linux packages on Ubuntu 24.04 or RHEL/Rocky 9 with apt or dnf. Linux packages are pre-GA and for fresh installs.",
  path: "/packages/",
  extraKeywords: ["install", "Linux", "APT", "RPM", "dnf", "Ubuntu", "RHEL", "Rocky Linux", "Docker"],
});

export default function PackagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
