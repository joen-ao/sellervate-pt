import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { Period } from '@/lib/data/brand-stats';

// Red only for more criticals (DESIGN.md); a falling average is a warning, not an alarm.
type Tone = 'good' | 'bad' | 'critical' | 'neutral';
const TONE: Record<Tone, string> = {
  good: 'text-success', bad: 'text-warning', critical: 'text-error', neutral: 'text-base-content/50',
};
const ICON = { size: 14, strokeWidth: 1.75, 'aria-hidden': true } as const;

function Delta({ d, digits = 0, tone }: { d: number | null; digits?: number; tone: Tone }) {
  if (d === null) return <span className="text-base-content/45">no prior data</span>;
  if (d === 0) return <span className="flex items-center gap-1 text-base-content/50"><Minus {...ICON} /> same as before</span>;
  return (
    <span className={`flex items-center gap-1 ${TONE[tone]}`}>
      {d > 0 ? <TrendingUp {...ICON} /> : <TrendingDown {...ICON} />}
      {d > 0 ? '+' : '−'}{Math.abs(d).toFixed(digits)} vs prior 30 d
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
    <div className="flex flex-col gap-1 rounded-box bg-base-200 px-5 py-4">
      <p className="text-xs font-medium text-base-content/50">{label}</p>
      <p className={`font-serif text-3xl font-medium tabular-nums ${valueClass ?? ''}`}>
        {value}{suffix && <span className="ml-1 font-sans text-sm font-normal text-base-content/40">{suffix}</span>}
      </p>
      <div className="text-xs tabular-nums">{children}</div>
    </div>
  );
}
