import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-user';

// The role gate lives here, not in page.tsx: a layout renders outside the
// loading.tsx Suspense boundary, so a lead gets a real 307 to /queue instead of
// a streamed 200 with a client-side redirect. The DAL still enforces the role.
export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const u = await getCurrentUser();
  if (!u) redirect('/switch-needed');
  if (u.role === 'team_lead') redirect('/queue');
  return children;
}
