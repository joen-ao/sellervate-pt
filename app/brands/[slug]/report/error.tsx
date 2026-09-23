'use client';
import { ErrorCard } from '@/components/ErrorCard';

export default function ReportError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-lg flex-col px-6 py-16">
      <ErrorCard title="Couldn't build this report" onRetry={reset} />
    </main>
  );
}
