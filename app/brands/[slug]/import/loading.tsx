import { Skeleton } from '@/components/Skeleton';

// Header, the upload card, the columns row.
export default function Loading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-60 w-full" />
      <Skeleton className="h-6 w-4/5" />
    </main>
  );
}
