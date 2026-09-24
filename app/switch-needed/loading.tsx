import { Skeleton } from '@/components/Skeleton';

// Shaped like the person picker: title, intro, then two role cards of rows.
export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12 lg:py-16">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-3/5 max-w-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[2, 3].map(rows => (
          <div key={rows} className="flex flex-col gap-4 rounded-box bg-base-200 p-5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-4/5" />
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
