import Link from "next/link";

export interface Crumb {
    title: string;
    href?: string;
}

/**
 * Breadcrumb trail for documentation pages:
 *   Docs / [version] / Section / Page
 * The last crumb (no href) is the page being viewed.
 */
export default function DocsBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
    return (
        <nav className="mb-6 text-sm text-gray-400">
            {crumbs.map((crumb, index) => (
                <span key={`${crumb.title}-${index}`}>
                    {index > 0 && <span className="mx-2">/</span>}
                    {crumb.href ? (
                        <Link href={crumb.href} className="hover:text-blue-400 transition-colors">
                            {crumb.title}
                        </Link>
                    ) : (
                        <span className="text-white">{crumb.title}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
