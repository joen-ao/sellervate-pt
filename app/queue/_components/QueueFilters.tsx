import Link from 'next/link';
import type { QueueBrand, QueueStatus } from '@/lib/data/replies';
import { QUEUE_STATUSES } from '@/lib/data/replies';

export type QueueQuery = { brand?: string; status: QueueStatus; page?: number };

// Default values stay out of the URL so /queue is the canonical "unreviewed, all brands".
export function queueHref({ brand, status, page }: QueueQuery) {
  const query: Record<string, string> = {};
  if (brand) query.brand = brand;
  if (status !== 'unreviewed') query.status = status;
  if (page && page > 1) query.page = String(page);
  return { pathname: '/queue', query };
}

const STATUS_LABEL: Record<QueueStatus, string> = { unreviewed: 'Unreviewed', reviewed: 'Reviewed', all: 'All' };

// Server component: every filter is a link, the URL is the only state.
export function QueueFilters({ brands, brand, status }: { brands: QueueBrand[]; brand?: string; status: QueueStatus }) {
  const chip = (active: boolean) => `btn btn-xs ${active ? 'btn-neutral' : 'btn-ghost'}`;
  return (
    <nav aria-label="Queue filters" className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1">
        <Link href={queueHref({ status })} className={chip(!brand)} aria-current={!brand ? 'true' : undefined}>
          All brands
        </Link>
        {brands.map(b => (
          <Link key={b.id} href={queueHref({ brand: b.slug, status })} className={chip(brand === b.slug)}
            aria-current={brand === b.slug ? 'true' : undefined}>
            {b.name}
          </Link>
        ))}
      </div>
      <div className="join">
        {QUEUE_STATUSES.map(s => (
          <Link key={s} href={queueHref({ brand, status: s })}
            className={`join-item btn btn-xs ${s === status ? 'btn-active' : ''}`}
            aria-current={s === status ? 'true' : undefined}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
