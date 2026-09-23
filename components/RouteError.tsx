'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { ErrorCard } from './ErrorCard';

// What every error.tsx renders. reset() alone re-renders the same failed server
// payload; refresh() fetches it again, so "Try again" can actually recover.
export function RouteError({ title, body, reset }: { title: string; body?: React.ReactNode; reset: () => void }) {
  const router = useRouter();
  const retry = () => startTransition(() => { router.refresh(); reset(); });
  return <ErrorCard title={title} body={body} onRetry={retry} />;
}
