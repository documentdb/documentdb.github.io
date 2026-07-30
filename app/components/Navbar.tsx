"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { documentdbDiscordUrl } from "../services/externalLinks";
import { withBasePath } from "../services/sitePath";

type NavItem = {
  label: string;
  href: string;
  kind: "link" | "anchor";
  newTab?: boolean;
  icon?: "github" | "discord";
};

const navItems: NavItem[] = [
  { label: "Home", href: "/", kind: "link" },
  {
    label: "GitHub",
    href: "https://github.com/documentdb/documentdb",
    kind: "anchor",
    newTab: true,
    icon: "github",
  },
  {
    label: "Discord",
    href: documentdbDiscordUrl,
    kind: "anchor",
    newTab: true,
    icon: "discord",
  },
  { label: "Docs", href: "/docs", kind: "link" },
  { label: "AI", href: "/ai", kind: "link" },
  { label: "Download", href: "/packages", kind: "link" },
  { label: "K8s Operator", href: "/kubernetes-operator", kind: "link" },
  { label: "Blogs", href: withBasePath("/blogs/"), kind: "anchor" },
  { label: "Samples", href: "/samples", kind: "link" },
];

function NavIcon({ name }: { name: NonNullable<NavItem["icon"]> }) {
  if (name === "github") {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function renderNavItem(
  item: NavItem,
  className: string,
  onClick?: () => void,
) {
  const content = (
    <>
      {item.icon ? <NavIcon name={item.icon} /> : null}
      <span>{item.label}</span>
    </>
  );

  if (item.kind === "link") {
    return (
      <Link key={item.label} href={item.href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <a
      key={item.label}
      href={item.href}
      target={item.newTab ? "_blank" : undefined}
      rel={item.newTab ? "noopener noreferrer" : undefined}
      className={className}
      onClick={onClick}
    >
      {content}
    </a>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-700 bg-neutral-900/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3 md:h-16 md:py-0">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold text-white sm:text-2xl">
            <Image
              src={withBasePath("/images/DocumentDB Logo - background removed.png")}
              alt="DocumentDB Logo"
              width={48}
              height={48}
              unoptimized
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
            <span>DocumentDB</span>
          </Link>

          <div className="hidden items-center space-x-6 md:flex lg:space-x-8">
            {navItems.map((item) =>
              renderNavItem(
                item,
                "flex items-center gap-2 text-gray-300 transition-colors duration-200 font-medium hover:text-blue-400",
              ),
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-700 text-gray-200 transition-colors hover:border-blue-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {isMenuOpen ? (
          <div id="mobile-navigation" className="border-t border-neutral-800 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) =>
                renderNavItem(
                  item,
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors duration-200 hover:bg-neutral-800 hover:text-white",
                  closeMenu,
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
