import Link from 'next/link';
import type { ReplyForReview } from '@/lib/data/reviews';
import { CATEGORY_LABEL } from '@/lib/types';
import { formatDateTime } from './Exchange';

const SEVERITY = {
  none: { label: 'No error', cls: 'badge-ghost' },
  minor: { label: 'Minor', cls: 'badge-warning' },
  critical: { label: 'Critical', cls: 'badge-error' },
} as const;

// Reviews are immutable in V1: once I have reviewed a reply, this replaces the form.
export function ReviewReadOnly({ review }: { review: NonNullable<ReplyForReview['myReview']> }) {
  const sev = SEVERITY[review.severity];
  return (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <p className="text-sm text-base-content/70">
          Reviewed by you on <time dateTime={review.created_at}>{formatDateTime(review.created_at)}</time>
        </p>
        <div className="flex items-center gap-3">
          <span className="badge badge-lg badge-neutral font-mono">{review.score}/5</span>
          <span className={`badge ${sev.cls}`}>{sev.label}</span>
        </div>
        {review.categories.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {review.categories.map(c => (
              <li key={c} className="badge badge-outline">{CATEGORY_LABEL[c]}</li>
            ))}
          </ul>
        )}
        {review.comment
          ? <p className="whitespace-pre-line">{review.comment}</p>
          : <p className="text-sm text-base-content/50">No comment.</p>}
        <div className="card-actions">
          <Link href="/queue" className="btn btn-sm">Back to queue</Link>
        </div>
      </div>
    </div>
  );
}
