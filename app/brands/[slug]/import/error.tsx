'use client';
import { ErrorCard } from '@/components/ErrorCard';

export default function ImportError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-8">
      <ErrorCard title="The import failed"
        body="Something went wrong on our side. Rows already written stay written; importing the same file again is safe."
        onRetry={reset} />
    </main>
  );
}
