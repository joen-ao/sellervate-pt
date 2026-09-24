import { Skeleton } from '@/components/Skeleton';

// Shaped like the person picker: title, intro, then two role groups of rows.
export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      {[2, 3].map(rows => (
        <div key={rows} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex flex-col divide-y divide-base-300 rounded-box border border-base-300">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
