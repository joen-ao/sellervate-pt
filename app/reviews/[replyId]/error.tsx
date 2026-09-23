'use client';
import { ErrorCard } from './_components/ErrorCard';

export default function ReviewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <ErrorCard title="Couldn't load this reply" message="Nothing was saved or lost. Try again." onRetry={reset} />
    </main>
  );
}
