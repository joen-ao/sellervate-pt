'use client';

import { RouteError } from '@/components/RouteError';

export default function QueueError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold">Review queue</h1>
      <RouteError title="Couldn't load the queue" reset={reset} />
    </main>
  );
}
