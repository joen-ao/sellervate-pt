import { Skeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8" aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-12 w-80" />
    </main>
  );
}
