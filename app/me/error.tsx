'use client';

// Local error card; wave 3 (07b) swaps it for the shared ErrorCard from components/.
export default function MeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-10">
      <div role="alert" className="alert alert-error alert-soft flex-col items-start gap-3">
        <h1 className="font-semibold">Your feedback didn&apos;t load</h1>
        <p>Nothing was lost. Try again; if it keeps failing, the database may be down.</p>
        <button type="button" className="btn btn-sm" onClick={() => reset()}>Try again</button>
      </div>
    </main>
  );
}
