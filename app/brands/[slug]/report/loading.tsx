import { Skeleton } from '@/components/Skeleton';

// The dark stage with a sheet-shaped placeholder: toolbar, then the paper.
export default function ReportLoading() {
  return (
    <div className="min-h-screen bg-sunken px-4 pb-16 sm:px-8" aria-busy="true">
      <div className="mx-auto flex max-w-4xl justify-between py-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-80" />
      </div>
      <main className="mx-auto flex max-w-4xl flex-col gap-8 rounded-box bg-base-200 px-6 py-10 sm:px-12">
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
    </div>
  );
}
