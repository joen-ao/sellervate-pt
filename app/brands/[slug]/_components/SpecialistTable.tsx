import type { SpecialistRow } from '@/lib/data/brand-stats';

export function SpecialistTable({ rows }: { rows: SpecialistRow[] }) {
  return (
    <table className="table table-sm">
      <thead>
        <tr className="border-base-300/70 bg-base-300/30 text-xs font-medium text-base-content/50">
          <th className="pl-5">Specialist</th><th className="text-right">Avg</th><th className="text-right">Reviews</th><th className="pr-5 text-right">Critical</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.specialistId} className="border-base-300/70">
            <td className="pl-5 font-medium">{r.name}</td>
            <td className="text-right tabular-nums">{r.avg.toFixed(2)}</td>
            <td className="text-right tabular-nums text-base-content/70">{r.n}</td>
            <td className={`pr-5 text-right tabular-nums ${r.critical > 0 ? 'text-error' : 'text-base-content/50'}`}>{r.critical}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
