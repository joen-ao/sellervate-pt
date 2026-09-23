import { Skeleton } from '@/components/Skeleton';

// Same shell as StatePage + the inline UserSwitcher: title, body, a 5-person menu.
export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-4 px-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="flex w-64 flex-col gap-2 rounded-box border border-base-300 p-2">
        {['h-4 w-20', 'h-8 w-full', 'h-8 w-full', 'h-4 w-20', 'h-8 w-full', 'h-8 w-full', 'h-8 w-full']
          .map((size, i) => <Skeleton key={i} className={size} />)}
      </div>
    </main>
  );
}
