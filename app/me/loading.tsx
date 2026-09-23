import { Skeleton } from '@/components/Skeleton';

// Same shell as page.tsx: header, the 30-day stats row, three review cards.
export default function Loading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      {[0, 1, 2].map(i => <Skeleton key={i} className="h-40 w-full" />)}
    </main>
  );
}
