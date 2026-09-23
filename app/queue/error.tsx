'use client';

import { ErrorCard } from '@/components/ErrorCard';

export default function QueueError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold">Review queue</h1>
      <ErrorCard title="Couldn't load the queue" onRetry={reset} />
    </main>
  );
}
