'use client';

import { RouteError } from '@/components/RouteError';

export default function QueueError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="font-serif text-[1.75rem] font-medium tracking-tight">Review queue</h1>
      <RouteError title="Couldn't load the queue" reset={reset} />
    </main>
  );
}
