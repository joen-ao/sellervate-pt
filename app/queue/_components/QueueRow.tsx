import Link from 'next/link';
import { Pill } from '@/components/Pill';
import { SeverityDot } from '@/components/SeverityDot';
import type { QueueItem } from '@/lib/data/replies';
import { relativeTime } from '@/lib/format';

const scoreTone = (s: number) => (s <= 2 ? 'error' : s === 3 ? 'warning' : 'success');

// h-16 is shared with the skeleton row in QueueSkeleton; change both together.
export const ROW_HEIGHT = 'h-16';

export function QueueRow({ item }: { item: QueueItem }) {
  const { review } = item;
  return (
    <li>
      <Link href={`/reviews/${item.id}`}
        className={`${ROW_HEIGHT} grid grid-cols-[9rem_1fr_auto] items-center gap-4 overflow-hidden px-4 text-sm hover:bg-base-200`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{item.brandName}</Pill>
          </div>
          <p className="truncate text-xs text-base-content/60">
            {item.specialistName} · {relativeTime(item.sentAt)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base-content/60">{item.customerSnippet}</p>
          <p className="truncate">{item.replySnippet}</p>
        </div>
        <div className="flex items-center gap-2">
          {review ? (
            <>
              <SeverityDot severity={review.severity} />
              <Pill tone={scoreTone(review.score)} title={`Scored ${review.score} of 5`}>{review.score}/5</Pill>
              {review.acknowledgedAt && (
                <svg role="img" aria-label="Acknowledged" viewBox="0 0 16 16" className="size-4 text-success">
                  <title>Acknowledged</title>
                  <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </>
          ) : (
            <Pill>Unreviewed</Pill>
          )}
        </div>
      </Link>
    </li>
  );
}
