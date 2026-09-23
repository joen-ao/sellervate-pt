import { Pill, scoreTone } from '@/components/Pill';
import type { MyReview } from '@/lib/data/my-reviews';
import { CATEGORY_LABEL } from '@/lib/types';
import { AckButton } from './AckButton';
import { formatDate, readOn } from './format';

export function MyReviewCard({ review: r }: { review: MyReview }) {
  return (
    <article className="card border border-base-300 bg-base-100">
      <div className="card-body gap-3 p-5">
        <header className="flex flex-wrap items-center gap-2 text-sm">
          <Pill tone="neutral">{r.brandName}</Pill>
          <time dateTime={r.createdAt} className="text-base-content/60">{formatDate(r.createdAt)}</time>
          <span className="flex-1" />
          <Pill tone={scoreTone(r.score)} title={`Score ${r.score} of 5`}>{r.score}/5</Pill>
          {r.severity === 'critical' && <Pill tone="error">Critical</Pill>}
          {r.severity === 'minor' && <Pill tone="warning">Minor</Pill>}
        </header>

        {r.categories.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="What went wrong">
            {r.categories.map(c => <li key={c} className="badge badge-sm badge-outline">{CATEGORY_LABEL[c]}</li>)}
          </ul>
        )}

        {r.comment ? (
          <blockquote className="border-l-4 border-base-300 pl-4">
            <p className="whitespace-pre-line">{r.comment}</p>
            <footer className="mt-1 text-sm text-base-content/60">— {r.reviewerName}</footer>
          </blockquote>
        ) : (
          <p className="text-sm text-base-content/60">{r.reviewerName} scored this without a comment.</p>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer text-base-content/70">See the exchange</summary>
          <dl className="mt-3 grid gap-3">
            <div>
              <dt className="font-medium">Customer wrote</dt>
              <dd className="whitespace-pre-line text-base-content/80">{r.customerMessage}</dd>
            </div>
            <div>
              <dt className="font-medium">You replied · {formatDate(r.sentAt)}</dt>
              <dd className="whitespace-pre-line text-base-content/80">{r.replyText}</dd>
            </div>
          </dl>
        </details>

        <footer className="card-actions items-center justify-end">
          {r.acknowledgedAt
            ? <span className="text-sm text-base-content/60">✓ {readOn(r.acknowledgedAt)}</span>
            : <AckButton reviewId={r.id} />}
        </footer>
      </div>
    </article>
  );
}
