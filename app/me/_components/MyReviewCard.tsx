import { Check, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/PageHeader';
import { Pill, scoreTone } from '@/components/Pill';
import type { MyReview } from '@/lib/data/my-reviews';
import { CATEGORY_LABEL } from '@/lib/types';
import { AckButton } from './AckButton';
import { formatDate, readOn } from './format';

export function MyReviewCard({ review: r }: { review: MyReview }) {
  const unread = !r.acknowledgedAt;
  return (
    <article className="flex flex-col gap-4 rounded-box bg-base-200 p-5">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {unread && (
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <span aria-hidden className="size-1.5 rounded-full bg-base-content" /> New
          </span>
        )}
        <span className="font-medium">{r.brandName}</span>
        <time dateTime={r.createdAt} className="text-base-content/45">{formatDate(r.createdAt)}</time>
        <span className="flex-1" />
        {r.severity === 'critical' && <Pill tone="error">Critical</Pill>}
        {r.severity === 'minor' && <Pill tone="warning">Minor</Pill>}
        <Pill tone={scoreTone(r.score)} title={`Score ${r.score} of 5`}>{r.score}/5</Pill>
      </header>

      {r.comment ? (
        <div className="flex gap-3">
          <Avatar name={r.reviewerName} />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm font-medium text-base-content/70">{r.reviewerName}</p>
            <p className="whitespace-pre-line leading-relaxed">{r.comment}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-base-content/50">{r.reviewerName} scored this without a comment.</p>
      )}

      {r.categories.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="What went wrong">
          {r.categories.map(c => <li key={c}><Pill tone="neutral">{CATEGORY_LABEL[c]}</Pill></li>)}
        </ul>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300/70 pt-3">
        <details className="group min-w-0 flex-1 text-sm">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-base-content/55 hover:text-base-content [&::-webkit-details-marker]:hidden">
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden className="transition-transform group-open:rotate-90" />
            See the exchange
          </summary>
          <dl className="mt-3 grid gap-3">
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-base-content/50">Customer wrote</dt>
              <dd className="whitespace-pre-line rounded-field bg-base-100/60 px-4 py-3 leading-relaxed text-base-content/85">{r.customerMessage}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-base-content/50">You replied · {formatDate(r.sentAt)}</dt>
              <dd className="whitespace-pre-line rounded-field bg-base-300/40 px-4 py-3 leading-relaxed text-base-content/85">{r.replyText}</dd>
            </div>
          </dl>
        </details>
        {r.acknowledgedAt
          ? <span className="flex items-center gap-1.5 self-start text-sm text-success"><Check size={14} strokeWidth={2} aria-hidden /> {readOn(r.acknowledgedAt)}</span>
          : <div className="self-start"><AckButton reviewId={r.id} /></div>}
      </footer>
    </article>
  );
}
