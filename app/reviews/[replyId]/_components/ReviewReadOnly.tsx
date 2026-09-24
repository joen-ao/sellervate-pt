import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Pill, scoreTone } from '@/components/Pill';
import type { ReplyForReview } from '@/lib/data/reviews';
import { CATEGORY_LABEL } from '@/lib/types';
import { formatDateTime } from './Exchange';

const SEVERITY = {
  none: { label: 'No error', tone: 'ghost' },
  minor: { label: 'Minor', tone: 'warning' },
  critical: { label: 'Critical', tone: 'error' },
} as const;

// Reviews are immutable in V1: once I have reviewed a reply, this replaces the form.
export function ReviewReadOnly({ review }: { review: NonNullable<ReplyForReview['myReview']> }) {
  const sev = SEVERITY[review.severity];
  return (
    <div className="flex flex-col gap-5 rounded-box bg-base-200 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Your review</h2>
        <p className="text-sm text-base-content/50">
          <time dateTime={review.created_at}>{formatDateTime(review.created_at)}</time>
        </p>
      </div>
      <div className="flex items-end gap-4">
        <p className="font-serif text-5xl font-medium leading-none tabular-nums">
          {review.score}<span className="ml-1 font-sans text-base font-normal text-base-content/40">/ 5</span>
        </p>
        <div className="flex gap-1.5 pb-1">
          <Pill tone={scoreTone(review.score)}>{review.score >= 4 ? 'Good' : 'Needs work'}</Pill>
          <Pill tone={sev.tone}>{sev.label}</Pill>
        </div>
      </div>
      {review.categories.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="What went wrong">
          {review.categories.map(c => <li key={c}><Pill tone="neutral">{CATEGORY_LABEL[c]}</Pill></li>)}
        </ul>
      )}
      {review.comment
        ? <p className="whitespace-pre-line rounded-field bg-base-100/60 px-4 py-3 leading-relaxed">{review.comment}</p>
        : <p className="text-sm text-base-content/50">No comment.</p>}
      <Link href="/queue" className="btn btn-sm btn-neutral w-fit gap-1.5">
        <ArrowLeft size={14} strokeWidth={1.75} aria-hidden /> Back to queue
      </Link>
    </div>
  );
}
