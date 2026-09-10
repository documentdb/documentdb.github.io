import { capitalCase } from 'change-case';
import Link from 'next/link';
import pluralize from 'pluralize';

export default function Breadcrumb({ type, category, name }: {
    type?: string;
    category?: string;
    name?: string;
}) {
    return (
        <nav className="mb-6 text-sm text-gray-400">
            <Link href="/docs" className="hover:text-blue-400 transition-colors">
                Docs
            </Link>
            <span className="mx-2">/</span>
            <Link href="/docs/reference" className="hover:text-blue-400 transition-colors">
                Reference
            </Link>
            {type && (
                <>
                    <span className="mx-2">/</span>
                    <Link href={`/docs/reference/${type}`} className="hover:text-blue-400 transition-colors capitalize">
                        {capitalCase(type)}
                    </Link>
                </>
            )}
            {category && (
                <>
                    <span className="mx-2">/</span>
                    <Link href={`/docs/reference/${type}/${category}`} className="hover:text-blue-400 transition-colors capitalize">
                        {capitalCase(category)}
                    </Link>
                </>
            )}
            {name && (
                <>
                    <span className="mx-2">/</span>
                    <span className="text-white">
                        {name}
                    </span>
                </>
            )}
        </nav>
    );
}