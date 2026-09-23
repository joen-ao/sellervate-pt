import type { QueueStatus } from '@/lib/data/replies';
import { QUEUE_STATUSES } from '@/lib/data/replies';
import { QueueView } from './_components/QueueView';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);

// Role and ?brand= are checked in layout.tsx, before loading.tsx streams.
export default async function QueuePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const s = one(sp.status);
  const status: QueueStatus = QUEUE_STATUSES.find(x => x === s) ?? 'unreviewed';
  const page = Math.max(1, Math.floor(Number(one(sp.page) ?? 1)) || 1);
  return <QueueView brand={one(sp.brand)} status={status} page={page} caughtUp={!!one(sp.caught_up)} />;
}
