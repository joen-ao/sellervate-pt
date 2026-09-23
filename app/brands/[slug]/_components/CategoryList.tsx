import type { CategoryCount } from '@/lib/data/brand-stats';

export function CategoryList({ items }: { items: CategoryCount[] }) {
  if (!items.length) return <p className="text-sm text-base-content/60">No failure categories flagged in this period.</p>;
  const max = items[0].n;
  return (
    <ol className="flex flex-col gap-2">
      {items.map(c => (
        <li key={c.category} className="flex flex-col gap-1">
          <div className="flex justify-between gap-4 text-sm">
            <span>{c.label}</span>
            <span className="tabular-nums text-base-content/60">{c.n}</span>
          </div>
          <div className="h-1.5 rounded-full bg-base-200">
            <div className="h-full rounded-full bg-base-content/60" style={{ width: `${(c.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
