import type { SpecialistRow } from '@/lib/data/brand-stats';

export function SpecialistTable({ rows }: { rows: SpecialistRow[] }) {
  return (
    <table className="table table-sm">
      <thead>
        <tr><th>Specialist</th><th className="text-right">Avg</th><th className="text-right">Reviews</th><th className="text-right">Critical</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.specialistId}>
            <td>{r.name}</td>
            <td className="text-right tabular-nums">{r.avg.toFixed(2)}</td>
            <td className="text-right tabular-nums">{r.n}</td>
            <td className={`text-right tabular-nums ${r.critical > 0 ? 'text-error' : ''}`}>{r.critical}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
