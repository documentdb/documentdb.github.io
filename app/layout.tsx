import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnnouncementBar from "./components/AnnouncementBar";
import Navbar from "./components/Navbar";
import { getMetadata } from "./services/metadataService";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = getMetadata({
  title: 'DocumentDB - Open Source Document Database', 
  description: 'A powerful, scalable open-source document database solution built on PostgreSQL for modern applications.',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnnouncementBar />
        <Navbar />
        {children}
        <footer className="bg-neutral-900 border-t border-neutral-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Copyright © DocumentDB a Series of LF Projects, LLC.
                For web site terms of use, trademark policy and other project policies please see https://lfprojects.org.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
