import { getMetadata } from "../services/metadataService";

// The packages page is a client component, so its metadata lives here.
export const metadata = getMetadata({
  title: "Install DocumentDB - Native Linux Packages and Docker",
  description:
    "Install DocumentDB on Ubuntu 24.04 or RHEL/Rocky 9 with apt or dnf, then run guided PostgreSQL setup. Native packages are pre-GA and for fresh installs. Docker is also available.",
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
