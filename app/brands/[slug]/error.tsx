'use client';

import { RouteError } from '@/components/RouteError';

export default function BrandError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-6 py-16">
      <RouteError title="Couldn't load this brand's numbers"
        body="Something failed while reading the reviews. Nothing was changed." reset={reset} />
    </main>
  );
}
