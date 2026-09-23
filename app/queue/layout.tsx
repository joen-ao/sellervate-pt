import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-user';
import { assertQueueAccess } from '@/lib/data/replies';
import { runPage } from '@/lib/page';
import { SEARCH_HEADER } from '@/middleware';

// The access check lives here, above loading.tsx's Suspense boundary, so the
// statuses are real: 307 for no user / specialist, 403 for ?brand= you don't
// cover, 404 for an unknown one. A layout gets no searchParams, so ?brand=
// arrives through middleware.ts. assertQueueAccess is cache()d; the page's
// listQueue reuses it, and still checks on its own when only the query changes
// (a client navigation re-renders the page, not this layout).
export default async function QueueLayout({ children }: { children: React.ReactNode }) {
  const u = await getCurrentUser();
  if (!u) redirect('/switch-needed');
  if (u.role === 'specialist') redirect('/me');

  // Same rule as the page: exactly one non-empty ?brand= filters, anything else is "all brands".
  const all = new URLSearchParams((await headers()).get(SEARCH_HEADER) ?? '').getAll('brand');
  const brand = all.length === 1 && all[0] ? all[0] : undefined;
  await runPage(() => assertQueueAccess(brand));
  return children;
}
