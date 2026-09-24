import type { MySummary as Summary } from '@/lib/data/my-reviews';

// Own numbers only, last 30 days. No brand or team averages on this page.
export function MySummary({ summary }: { summary: Summary }) {
  return (
    <section aria-label="Last 30 days" className="grid grid-cols-3 gap-2 sm:gap-3">
      <Tile label="Reviews received" value={String(summary.n)} caption="last 30 days" />
      <Tile label="Average score" value={summary.avg === null ? '—' : String(summary.avg)} suffix="/ 5" caption="across those reviews" />
      <Tile label="Critical errors" value={String(summary.critical)} caption="factually wrong to a customer"
        valueClass={summary.critical > 0 ? 'text-error' : undefined} />
    </section>
  );
}

function Tile({ label, value, suffix, caption, valueClass = '' }: {
  label: string; value: string; suffix?: string; caption: string; valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-box bg-base-200 px-3 py-3 sm:px-5 sm:py-4">
      <p className="text-xs font-medium text-base-content/50">{label}</p>
      <p className={`font-serif text-2xl font-medium tabular-nums sm:text-3xl ${valueClass}`}>
        {value}{suffix && <span className="ml-1 font-sans text-sm font-normal text-base-content/40">{suffix}</span>}
      </p>
      <p className="hidden text-xs text-base-content/45 sm:block">{caption}</p>
    </div>
  );
}
