import Link from 'next/link';
import { Check } from 'lucide-react';
import { Pill, scoreTone } from '@/components/Pill';
import { SeverityDot } from '@/components/SeverityDot';
import type { QueueItem } from '@/lib/data/replies';
import { relativeTime } from '@/lib/format';

// h-16 is shared with the skeleton row in QueueSkeleton; change both together.
export const ROW_HEIGHT = 'h-16';

export function QueueRow({ item }: { item: QueueItem }) {
  const { review } = item;
  return (
    <li>
      <Link href={`/reviews/${item.id}`}
        className={`${ROW_HEIGHT} grid grid-cols-[1fr_auto] items-center gap-5 overflow-hidden px-4 text-sm transition-colors hover:bg-base-300/40 sm:grid-cols-[9rem_1fr_auto]`}>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate font-medium">{item.brandName}</p>
          <p className="truncate text-xs text-base-content/50">
            {item.specialistName} · {relativeTime(item.sentAt)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base-content/50">
            {/* on small screens the brand column folds into the first line, keeping the row two lines tall */}
            <span className="font-medium text-base-content sm:hidden">{item.brandName} · </span>
            {item.customerSnippet}
          </p>
          <p className="truncate text-base-content/90">{item.replySnippet}</p>
        </div>
        <div className="flex items-center gap-2.5">
          {review ? (
            <>
              <SeverityDot severity={review.severity} />
              <Pill tone={scoreTone(review.score)} title={`Scored ${review.score} of 5`}>{review.score}/5</Pill>
              {review.acknowledgedAt && (
                <Check role="img" aria-label="Acknowledged" size={16} strokeWidth={2} className="text-success" />
              )}
            </>
          ) : (
            <span className="flex items-center gap-2 text-xs text-base-content/50">
              <span aria-hidden className="size-2 rounded-full border border-base-content/40" />
              To review
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
