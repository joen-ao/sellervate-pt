import { Skeleton } from '@/components/Skeleton';

export default function ReportLoading() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-8" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-40" />
      <div className="grid gap-8 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </main>
  );
}
