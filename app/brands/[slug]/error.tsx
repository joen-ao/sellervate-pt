'use client';

// Local error card: branch 03 owns the shared components/ErrorCard. Wave 3 (07b) swaps this for it.
export default function BrandError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-6 py-16">
      <h1 className="text-xl font-semibold">Couldn&apos;t load this brand&apos;s numbers</h1>
      <p className="text-base-content/70">Something failed while reading the reviews. Nothing was changed.</p>
      <div><button type="button" className="btn btn-sm btn-neutral" onClick={reset}>Try again</button></div>
    </main>
  );
}
