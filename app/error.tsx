'use client';

import { RouteError } from '@/components/RouteError';

// Catches what a route's own error.tsx cannot: a throw in its layout (the access
// check) or in app/page.tsx — in practice, the database being unreachable.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-4 px-6">
      <RouteError title="The tool can't reach its data right now"
        body="Nothing was lost. Try again in a moment; if it keeps failing, the database may be down." reset={reset} />
    </main>
  );
}
