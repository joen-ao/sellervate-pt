'use client';

import { RouteError } from '@/components/RouteError';

export default function ReviewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <RouteError title="Couldn't load this reply" body="Nothing was saved or lost. Try again." reset={reset} />
    </main>
  );
}
