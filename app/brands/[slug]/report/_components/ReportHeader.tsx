import Link from 'next/link';
import type { Period } from '@/lib/data/report';
import { PrintButton } from './PrintButton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
export const periodLabel = (p: Period) => `${day(p.from)} – ${day(p.to)}`;

export function ReportHeader({ brand, period }: { brand: { name: string; slug: string }; period: Period }) {
  return (
    <header className="flex flex-col gap-4">
      {/* Screen-only controls: back, change period, print. */}
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <Link href={`/brands/${brand.slug}`} className="text-sm text-base-content/60 hover:underline">
          ← {brand.name} (internal view)
        </Link>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col text-xs text-base-content/60">From
            <input type="date" name="from" defaultValue={period.from} required className="input input-sm" />
          </label>
          <label className="flex flex-col text-xs text-base-content/60">To
            <input type="date" name="to" defaultValue={period.to} required className="input input-sm" />
          </label>
          <button type="submit" className="btn btn-sm">Update</button>
          <PrintButton />
        </form>
      </div>

      <div className="flex items-baseline justify-between gap-4 border-b border-base-300 pb-3">
        <div>
          <h1 className="text-3xl font-semibold">{brand.name}</h1>
          <p className="text-sm text-base-content/70">Customer support quality · {periodLabel(period)}</p>
        </div>
        <p className="text-sm font-semibold tracking-tight text-primary" aria-label="Sellervate">
          sellervate<span className="text-base-content/40">.</span>
        </p>
      </div>
    </header>
  );
}
