import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Period } from '@/lib/data/report';
import { PrintButton } from './PrintButton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
export const periodLabel = (p: Period) => `${day(p.from)} – ${day(p.to)}`;

// Screen only, on the dark stage above the sheet: back, change period, print.
// It sits outside .report-root, so print.css drops it from the paper.
export function ReportToolbar({ brand, period }: { brand: { name: string; slug: string }; period?: Period }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-3 px-4 py-6 sm:px-0 print:hidden">
      <Link href={`/brands/${brand.slug}`} className="flex items-center gap-1.5 text-sm text-base-content/55 transition-colors hover:text-base-content">
        <ArrowLeft size={14} strokeWidth={1.75} aria-hidden /> {brand.name} <span className="text-base-content/35">(internal view)</span>
      </Link>
      {period && (
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-base-content/50">From
            <input type="date" name="from" defaultValue={period.from} required className="input input-sm bg-base-200" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-base-content/50">To
            <input type="date" name="to" defaultValue={period.to} required className="input input-sm bg-base-200" />
          </label>
          <button type="submit" className="btn btn-sm btn-neutral">Update</button>
          <PrintButton />
        </form>
      )}
    </div>
  );
}

// On the paper: what the client reads first.
export function ReportHeader({ brand, period }: { brand: { name: string; slug: string }; period: Period }) {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-base-300 pb-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-4xl font-medium tracking-tight">{brand.name}</h1>
        <p className="text-sm text-base-content/70">Customer support quality · {periodLabel(period)}</p>
      </div>
      <p className="text-sm font-semibold tracking-tight text-primary" aria-label="Sellervate">
        sellervate<span className="text-base-content/40">.</span>
      </p>
    </header>
  );
}
