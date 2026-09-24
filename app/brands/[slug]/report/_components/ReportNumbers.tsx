import type { BrandReport } from '@/lib/data/report';

export function ReportNumbers({ current }: { current: BrandReport['current'] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Figure label="Average quality" value={current.avg?.toFixed(2) ?? '—'} suffix="/ 5" />
      <Figure label="Replies reviewed" value={String(current.n)} />
      {/* "addressed" only exists once pattern alerts (P3) are merged. */}
      <Figure label="Critical issues" value={String(current.critical)}
        note={current.addressed === null ? undefined : `addressed: ${current.addressed}`} />
    </div>
  );
}

function Figure({ label, value, suffix, note }: { label: string; value: string; suffix?: string; note?: string }) {
  return (
    <div className="rounded-box bg-base-200 px-5 py-4">
      <p className="text-xs font-medium text-base-content/60">{label}</p>
      <p className="font-serif text-3xl font-medium tabular-nums">
        {value}{suffix && <span className="ml-1 font-sans text-sm font-normal text-base-content/50">{suffix}</span>}
      </p>
      {note && <p className="mt-1 text-sm text-base-content/70">{note}</p>}
    </div>
  );
}
