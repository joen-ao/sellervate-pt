import type { Week } from '@/lib/data/brand-stats';
import { dayMonth } from './format';

const W = 640, H = 160, TOP = 10, BOTTOM = 130, LEFT = 24;
// y axis runs 1 → 5; a score of 1 sits on the baseline.
const y = (score: number) => BOTTOM - ((score - 1) / 4) * (BOTTOM - TOP);

export function TrendChart({ weeks }: { weeks: Week[] }) {
  const slot = (W - LEFT) / weeks.length;
  const bar = slot * 0.6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label={`Average score per week, last ${weeks.length} weeks`}>
      {[3, 4].map(s => (
        <g key={s}>
          <line x1={LEFT} x2={W} y1={y(s)} y2={y(s)} className="stroke-base-content/15" strokeDasharray="2 4" />
          <text x={0} y={y(s) + 4} className="fill-base-content/40 text-[10px]">{s}</text>
        </g>
      ))}
      <line x1={LEFT} x2={W} y1={BOTTOM} y2={BOTTOM} className="stroke-base-content/20" />
      {weeks.map((w, i) => {
        const x = LEFT + i * slot + (slot - bar) / 2;
        const cx = x + bar / 2;
        // The latest week is "now": ivory; earlier weeks recede. No hue needed.
        const latest = i === weeks.length - 1;
        return (
          <g key={w.start}>
            {w.avg === null ? (
              <line x1={x} x2={x + bar} y1={BOTTOM - 0.5} y2={BOTTOM - 0.5} className="stroke-base-content/40" />
            ) : (
              <rect x={x} y={y(w.avg)} width={bar} height={Math.max(BOTTOM - y(w.avg), 1)} rx={3}
                className={latest ? 'fill-primary' : 'fill-base-content/25'}>
                <title>{`Week of ${dayMonth(w.start)}: avg ${w.avg.toFixed(2)}, n=${w.n}`}</title>
              </rect>
            )}
            <text x={cx} y={w.avg === null ? BOTTOM - 4 : y(w.avg) - 3} textAnchor="middle"
              className={`${latest ? 'fill-base-content font-medium' : 'fill-base-content/60'} text-[10px] tabular-nums`}>
              {w.avg === null ? 'n=0' : w.avg.toFixed(1)}
            </text>
            <text x={cx} y={BOTTOM + 16} textAnchor="middle" className="fill-base-content/45 text-[10px]">
              {dayMonth(w.start)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
