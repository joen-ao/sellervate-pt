'use client';

import { RouteError } from '@/components/RouteError';

export default function SwitchNeededError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="font-serif text-[1.75rem] font-medium tracking-tight">Pick who you are</h1>
      <RouteError title="Couldn't load the people to pick from"
        body="The database didn't answer. Nothing was changed." reset={reset} />
    </main>
  );
}
