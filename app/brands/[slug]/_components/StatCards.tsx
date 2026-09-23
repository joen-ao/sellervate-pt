import type { Period } from '@/lib/data/brand-stats';

// Red only for more criticals (DESIGN.md); a falling average is a warning, not an alarm.
type Tone = 'good' | 'bad' | 'critical' | 'neutral';
const TONE: Record<Tone, string> = {
  good: 'text-success', bad: 'text-warning', critical: 'text-error', neutral: 'text-base-content/60',
};

function Delta({ d, digits = 0, tone }: { d: number | null; digits?: number; tone: Tone }) {
  if (d === null) return <span className="text-base-content/60">no prior data</span>;
  if (d === 0) return <span className="text-base-content/60">— same as before</span>;
  return (
    <span className={TONE[tone]}>
      {d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(digits)} vs prior 30 d
    </span>
  );
}

export function StatCards({ current, previous }: { current: Period; previous: Period }) {
  const avgDelta = current.avg !== null && previous.avg !== null
    ? Math.round((current.avg - previous.avg) * 100) / 100 : null;
  const nDelta = previous.n ? current.n - previous.n : null;
  const critDelta = previous.n ? current.critical - previous.critical : null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card label="Average score" value={current.avg?.toFixed(2) ?? '—'} suffix="/ 5">
        <Delta d={avgDelta} digits={2} tone={avgDelta && avgDelta > 0 ? 'good' : 'bad'} />
      </Card>
      <Card label="Reviews" value={String(current.n)}>
        <Delta d={nDelta} tone="neutral" />
      </Card>
      {/* A critical is never good news: fewer is neutral, more is red. */}
      <Card label="Critical errors" value={String(current.critical)}
        valueClass={current.critical > 0 ? 'text-error' : undefined}>
        <Delta d={critDelta} tone={critDelta && critDelta > 0 ? 'critical' : 'neutral'} />
      </Card>
    </div>
  );
}

function Card({ label, value, suffix, valueClass, children }: {
  label: string; value: string; suffix?: string; valueClass?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-box border border-base-300 p-4">
      <p className="text-sm text-base-content/60">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${valueClass ?? ''}`}>
        {value}{suffix && <span className="ml-1 text-base font-normal text-base-content/50">{suffix}</span>}
      </p>
      <p className="mt-1 text-sm tabular-nums">{children}</p>
    </div>
  );
}
