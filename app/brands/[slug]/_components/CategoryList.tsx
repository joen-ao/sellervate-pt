import type { CategoryCount } from '@/lib/data/brand-stats';

export function CategoryList({ items }: { items: CategoryCount[] }) {
  if (!items.length) return <p className="text-sm text-base-content/50">No failure categories flagged in this period.</p>;
  const max = items[0].n;
  return (
    <ol className="flex flex-col gap-3">
      {items.map(c => (
        <li key={c.category} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-base-content/85">{c.label}</span>
            <span className="tabular-nums text-base-content/50">{c.n}</span>
          </div>
          <div className="h-1.5 rounded-full bg-base-300/70">
            <div className="h-full rounded-full bg-base-content/55" style={{ width: `${(c.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
