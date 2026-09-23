import type { MySummary as Summary } from '@/lib/data/my-reviews';

// Own numbers only, last 30 days. No brand or team averages on this page.
export function MySummary({ summary }: { summary: Summary }) {
  return (
    <section aria-label="Last 30 days" className="stats stats-horizontal w-full border border-base-300 bg-base-100">
      <div className="stat">
        <div className="stat-title">Reviews received</div>
        <div className="stat-value text-2xl">{summary.n}</div>
        <div className="stat-desc">last 30 days</div>
      </div>
      <div className="stat">
        <div className="stat-title">Average score</div>
        <div className="stat-value text-2xl">{summary.avg ?? '—'}</div>
        <div className="stat-desc">out of 5</div>
      </div>
      <div className="stat">
        <div className="stat-title">Critical errors</div>
        <div className={`stat-value text-2xl ${summary.critical > 0 ? 'text-error' : ''}`}>{summary.critical}</div>
        <div className="stat-desc">factually wrong to a customer</div>
      </div>
    </section>
  );
}
