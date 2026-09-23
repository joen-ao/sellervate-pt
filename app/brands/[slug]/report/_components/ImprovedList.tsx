import type { Improvement } from '@/lib/data/report';

const pct = (x: number) => `${Math.round(x)}%`;

// Categories whose share of reviews dropped most versus the previous period of equal length.
export function ImprovedList({ items, hasPreviousPeriod }: { items: Improvement[]; hasPreviousPeriod: boolean }) {
  if (!hasPreviousPeriod) {
    return <p className="text-sm text-base-content/70">First period on record — nothing to compare against yet.</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-base-content/70">No issue type became less frequent than in the previous period.</p>;
  }
  return (
    <ol className="flex flex-col gap-3">
      {items.map((i, k) => (
        <li key={i.category} className="flex gap-3">
          <span className="font-semibold tabular-nums text-primary">{k + 1}</span>
          <div>
            <p className="font-medium">{i.label}</p>
            <p className="text-sm tabular-nums text-base-content/70">
              flagged in {pct(i.before)} of reviews → {pct(i.now)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
