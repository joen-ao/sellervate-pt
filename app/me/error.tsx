'use client';

import { RouteError } from '@/components/RouteError';

export default function MeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-10">
      <RouteError title="Your feedback didn't load"
        body="Nothing was lost. Try again; if it keeps failing, the database may be down." reset={reset} />
    </main>
  );
}
