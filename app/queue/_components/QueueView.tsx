import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { PAGE_SIZE } from '@/lib/data/_shared';
import type { QueueBrand, QueueStatus } from '@/lib/data/replies';
import { QUEUE_WINDOW_HOURS, listQueue } from '@/lib/data/replies';
import { runPage } from '@/lib/page';
import { QueueFilters, queueHref } from './QueueFilters';
import { QueueRow } from './QueueRow';
import { ReviewNextButton } from './ReviewNextButton';

type Props = { brand?: string; status: QueueStatus; page: number; caughtUp: boolean };

export async function QueueView({ brand, status, page, caughtUp }: Props) {
  const data = await runPage(() => listQueue({ brandSlug: brand, status, page }));
  const brandName = data.brands.find(b => b.slug === brand)?.name;
  const brandCount = brand ? 1 : data.brands.length;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Review queue</h1>
          <p className="text-sm text-base-content/70">
            {data.unreviewedTotal} unreviewed · {brandCount} {brandCount === 1 ? 'brand' : 'brands'}
            <span className="text-base-content/50"> · showing the last {QUEUE_WINDOW_HOURS} h</span>
          </p>
        </div>
        {data.brands.length > 0 && <ReviewNextButton brandSlug={brand} />}
      </header>

      {caughtUp && (
        <div role="status" className="alert alert-success alert-soft text-sm">
          Nothing left to review{brandName ? ` in ${brandName}` : ''}. You&apos;re caught up.
        </div>
      )}

      {data.brands.length > 0 && <QueueFilters brands={data.brands} brand={brand} status={status} />}

      {data.items.length > 0 ? (
        <>
          <ul className="divide-y divide-base-300 rounded-box border border-base-300">
            {data.items.map(item => <QueueRow key={item.id} item={item} />)}
          </ul>
          <Pager total={data.total} page={page} brand={brand} status={status} />
        </>
      ) : (
        <QueueEmpty brands={data.brands} brandName={brandName} status={status} page={page} />
      )}
    </main>
  );
}

function Pager({ total, page, brand, status }: { total: number; page: number; brand?: string; status: QueueStatus }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-between text-sm">
      {page > 1 ? <Link className="btn btn-ghost btn-sm" href={queueHref({ brand, status, page: page - 1 })}>Newer</Link> : <span />}
      <span className="text-base-content/60">Page {page} of {pages}</span>
      {page < pages ? <Link className="btn btn-ghost btn-sm" href={queueHref({ brand, status, page: page + 1 })}>Older</Link> : <span />}
    </nav>
  );
}

type EmptyProps = { brands: QueueBrand[]; brandName?: string; status: QueueStatus; page: number };

function QueueEmpty({ brands, brandName, status, page }: EmptyProps) {
  if (brands.length === 0) {
    return <EmptyState title="You don't cover any brands yet." body="Ask whoever assigns brands to add you to one; its replies show up here." />;
  }
  if (page > 1) {
    return <EmptyState title="No more replies on this page." action={<Link className="btn btn-sm" href={queueHref({ status })}>Back to page 1</Link>} />;
  }
  if (brandName) {
    const kind = status === 'all' ? '' : `${status} `;
    return (
      <EmptyState title={`No ${kind}replies from ${brandName} in the last ${QUEUE_WINDOW_HOURS} h.`}
        action={<Link className="btn btn-sm" href={queueHref({ status })}>See all brands</Link>} />
    );
  }
  if (status === 'unreviewed') {
    return (
      <EmptyState
        title="You're caught up."
        body={`Nothing unreviewed from ${brands.map(b => b.name).join(', ')} in the last ${QUEUE_WINDOW_HOURS} h.`}
        action={<Link className="btn btn-sm" href={queueHref({ status: 'reviewed' })}>See what you reviewed</Link>}
      />
    );
  }
  return (
    <EmptyState title={`No ${status === 'all' ? '' : 'reviewed '}replies in the last ${QUEUE_WINDOW_HOURS} h.`}
      body="Older replies are still reachable through Review next."
      action={<ReviewNextButton />} />
  );
}
