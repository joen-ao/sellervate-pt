import { Skeleton } from '@/components/Skeleton';

// Same shell as page.tsx: header, the three 30-day tiles, three review cards.
export default function Loading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-44 w-full" />)}
      </div>
    </main>
  );
}
