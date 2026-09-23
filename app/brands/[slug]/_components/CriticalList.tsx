import Link from 'next/link';
import type { CriticalEvent } from '@/lib/data/brand-stats';
import { dayMonth } from './format';

export function CriticalList({ events }: { events: CriticalEvent[] }) {
  if (!events.length) return <p className="text-sm text-base-content/60">No critical errors in this period.</p>;
  return (
    <ul className="flex flex-col divide-y divide-base-300">
      {events.map(e => (
        <li key={e.reviewId}>
          <Link href={`/reviews/${e.replyId}`} className="block py-2 hover:bg-base-200">
            <p className="text-sm">
              <span className="font-medium text-error">●</span>{' '}
              <span className="tabular-nums text-base-content/60">{dayMonth(e.createdAt)}</span>
              {' · '}{e.specialist}
            </p>
            <p className="text-sm text-base-content/70">{e.comment}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
