import Link from 'next/link';
import { SeverityDot } from '@/components/SeverityDot';
import type { CriticalEvent } from '@/lib/data/brand-stats';
import { dayMonth } from './format';

export function CriticalList({ events }: { events: CriticalEvent[] }) {
  if (!events.length) return <p className="text-sm text-base-content/50">No critical errors in this period.</p>;
  return (
    <ul className="-mx-2 flex flex-col">
      {events.map(e => (
        <li key={e.reviewId}>
          <Link href={`/reviews/${e.replyId}`} className="flex gap-3 rounded-field px-2 py-2.5 transition-colors hover:bg-base-300/40">
            <span className="pt-1.5"><SeverityDot severity="critical" /></span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm">
                <span className="tabular-nums text-base-content/50">{dayMonth(e.createdAt)}</span>
                {' · '}<span className="font-medium">{e.specialist}</span>
              </span>
              <span className="line-clamp-2 text-sm text-base-content/65">{e.comment}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
