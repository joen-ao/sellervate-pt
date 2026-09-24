import { Skeleton } from '@/components/Skeleton';
import { ROW_HEIGHT } from './QueueRow';

// loading.tsx for /queue: same shell and row height as QueueRow, so nothing jumps.
export function QueueSkeleton() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10" aria-busy="true" aria-label="Loading the queue">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between"><Skeleton className="h-7 w-56" /><Skeleton className="h-7 w-64" /></div>
        <ul className="divide-y divide-base-300/70 rounded-box bg-base-200">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className={`${ROW_HEIGHT} grid grid-cols-[9rem_1fr_auto] items-center gap-5 px-4`}>
              <div className="flex flex-col gap-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-28" /></div>
              <div className="flex flex-col gap-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>
              <Skeleton className="h-5 w-12" />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
