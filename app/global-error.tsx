'use client';

import { ErrorCard } from '@/components/ErrorCard';
import './globals.css';

// Last resort, if the root layout itself throws: replaces it, so it brings its
// own <html>. A full reload, because there is no layout left to refresh into.
export default function GlobalError() {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-4 px-6">
          <ErrorCard title="The tool can't reach its data right now"
            body="Nothing was lost. Try again in a moment; if it keeps failing, the database may be down."
            onRetry={() => window.location.reload()} />
        </main>
      </body>
    </html>
  );
}
