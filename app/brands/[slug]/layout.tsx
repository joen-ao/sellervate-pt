import { runPage } from '@/lib/page';
import { assertBrandStatsAccess } from '@/lib/data/brand-stats';

// The access check lives here, outside the loading.tsx Suspense boundary: once
// the skeleton streams, the status is already 200 and forbidden() can't change it.
export default async function BrandLayout({ children, params }: {
  children: React.ReactNode; params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await runPage(() => assertBrandStatsAccess(slug));
  return children;
}
