import Link from 'next/link';
import type { Page } from '../types/Page';

export default function Grid({ items }: {
  items: Page[];
}) {
  if (!items.length) return null;
  return (
    <section className="grid gap-3">
      {items.map(page => (
        <Link
          key={page.reference}
          className="bg-neutral-900/30 rounded-lg p-4 border border-neutral-600/20 text-left hover:border-blue-500/40 hover:bg-neutral-700/30 transition-all duration-200 group"
          href={`/docs/reference/${page.reference}`}>
          <div className="grid md:grid-cols-[20%_80%] grid-cols-[10%_90%] mb-2">
            <h4 className="text-blue-300 font-mono font-medium group-hover:text-blue-200">
              {page.name}
            </h4>
            <p className="text-xs text-gray-400 italic">
              {page.description}
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}
