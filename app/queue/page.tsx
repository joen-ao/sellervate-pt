import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-user';
import type { QueueStatus } from '@/lib/data/replies';
import { QUEUE_STATUSES, assertQueueAccess } from '@/lib/data/replies';
import { runPage } from '@/lib/page';
import { QueueSkeleton } from './_components/QueueSkeleton';
import { QueueView } from './_components/QueueView';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);

// No loading.tsx on purpose: it would wrap this page in a Suspense boundary and
// stream a 200 before the checks below run, so a specialist would get a 200 and
// ?brand=lume a 200 forbidden page. The checks run first (real 307/403/404),
// then the list streams behind an explicit Suspense with the same skeleton.
export default async function QueuePage({ searchParams }: { searchParams: SearchParams }) {
  const u = await getCurrentUser();
  if (!u) redirect('/switch-needed');
  if (u.role === 'specialist') redirect('/me');

  const sp = await searchParams;
  const s = one(sp.status);
  const status: QueueStatus = QUEUE_STATUSES.find(x => x === s) ?? 'unreviewed';
  const page = Math.max(1, Math.floor(Number(one(sp.page) ?? 1)) || 1);
  const brand = one(sp.brand);

  // 404 unknown brand, 403 brand you don't cover, before a byte is streamed.
  await runPage(() => assertQueueAccess(brand));

  return (
    <Suspense key={`${brand}|${status}|${page}`} fallback={<QueueSkeleton />}>
      <QueueView brand={brand} status={status} page={page} caughtUp={!!one(sp.caught_up)} />
    </Suspense>
  );
}
