"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
// The Jekyll layout renders the same file, so the blog and announcement pages show this nav too
import nav from "../../blogs/_data/nav.json";
import { withBasePath } from "../services/sitePath";

type NavLink = { label: string; href: string; section?: string };
type NavGroup = { label: string; items: NavLink[] };
type NavIconLink = NavLink & { icon: string };

const links: (NavLink | NavGroup)[] = nav.links;
const iconLinks: NavIconLink[] = nav.icons;

const desktopLinkClass =
  "flex items-center gap-1 font-medium text-gray-300 transition-colors duration-200 hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400";
const dropdownLinkClass =
  "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors duration-200 hover:bg-neutral-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";
const mobileLinkClass =
  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors duration-200 hover:bg-neutral-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

function groupId(label: string) {
  return `nav-${label.toLowerCase()}`;
}

function NavAnchor({
  link,
  className,
  onClick,
  children,
}: {
  link: NavLink;
  className: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (isExternal(link.href)) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  // Jekyll builds these sections, so they are not Next.js routes
  if (link.section) {
    return (
      <a href={withBasePath(link.href)} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function BrandIcon({ name }: { name: string }) {
  if (name === "github") {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (name === "discord") {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z" />
      </svg>
    );
  }

  return null;
}

function ExternalIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-gray-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 13 13 7M8 7h5v5" />
    </svg>
  );
}

// The banner above the sticky nav varies in height, so fit the open menu to the screen space actually left
function fitToViewport(menu: HTMLDivElement | null) {
  if (!menu) return;
  const fit = () => {
    menu.style.maxHeight = `${window.innerHeight - menu.getBoundingClientRect().top}px`;
  };
  fit();
  window.addEventListener("resize", fit);
  return () => window.removeEventListener("resize", fit);
}

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const desktopNav = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setIsMenuOpen(false);
  const closeGroup = () => setOpenGroup(null);

  // Close on any navigation, back/forward included; resetting during render avoids a frame of open menu on the new page
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!openGroup) return;
    // Safari never focuses a clicked button, so blur alone cannot close the panel
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!desktopNav.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenGroup(null);
      document.getElementById(`${groupId(openGroup)}-button`)?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openGroup]);

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-700 bg-neutral-900/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3 md:h-16 md:py-0">
          <Link href="/" onClick={closeMenu} className="flex shrink-0 items-center gap-2 text-xl font-bold text-white sm:text-2xl">
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

          <div ref={desktopNav} className="hidden items-center gap-6 lg:flex">
            {links.map((item) => {
              if (!("items" in item)) {
                return (
                  <NavAnchor key={item.label} link={item} className={desktopLinkClass}>
                    {item.label}
                  </NavAnchor>
                );
              }

              const id = groupId(item.label);
              const isOpen = openGroup === item.label;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setOpenGroup((current) => (current === item.label ? null : current));
                    }
                  }}
                >
                  <button
                    id={`${id}-button`}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpenGroup(isOpen ? null : item.label)}
                    className={`${desktopLinkClass} cursor-pointer`}
                  >
                    {item.label}
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {/* Rendered while closed so crawlers still see the links */}
                  <div
                    id={id}
                    hidden={!isOpen}
                    className="absolute left-1/2 top-full z-50 mt-3 w-56 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-900 p-1.5 shadow-xl shadow-black/40"
                  >
                    {item.items.map((link) => (
                      <NavAnchor key={link.label} link={link} className={dropdownLinkClass} onClick={closeGroup}>
                        {link.label}
                        {isExternal(link.href) ? <ExternalIcon /> : null}
                      </NavAnchor>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-2 border-l border-neutral-700 pl-4">
              {iconLinks.map((link) => (
                <NavAnchor
                  key={link.label}
                  link={link}
                  className="rounded-md p-1.5 text-gray-300 transition-colors duration-200 hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  <BrandIcon name={link.icon} />
                  <span className="sr-only">{link.label}</span>
                </NavAnchor>
              ))}
            </div>
          </div>

          <button
            ref={menuButton}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-700 text-gray-200 transition-colors hover:border-blue-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
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
          <div id="mobile-navigation" ref={fitToViewport} className="overflow-y-auto border-t border-neutral-800 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {links.map((item) =>
                "items" in item ? (
                  <div key={item.label} className="mt-2 flex flex-col gap-1">
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {item.label}
                    </p>
                    {item.items.map((link) => (
                      <NavAnchor key={link.label} link={link} className={mobileLinkClass} onClick={closeMenu}>
                        {link.label}
                        {isExternal(link.href) ? <ExternalIcon /> : null}
                      </NavAnchor>
                    ))}
                  </div>
                ) : (
                  <NavAnchor key={item.label} link={item} className={mobileLinkClass} onClick={closeMenu}>
                    {item.label}
                  </NavAnchor>
                ),
              )}
              <div className="mt-2 flex gap-1 border-t border-neutral-800 pt-3">
                {iconLinks.map((link) => (
                  <NavAnchor key={link.label} link={link} className={mobileLinkClass} onClick={closeMenu}>
                    <BrandIcon name={link.icon} />
                    <span>{link.label}</span>
                  </NavAnchor>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
