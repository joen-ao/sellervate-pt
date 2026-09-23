import { getReplyForReview } from '@/lib/data/reviews';
import { runPage } from '@/lib/page';

// The access check lives here, above loading.tsx's Suspense boundary: a layout
// renders before the 200 shell is streamed, so forbidden()/notFound() come out as
// real 403/404 statuses. getReplyForReview is cache()d; the page reuses the result.
export default async function ReviewLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ replyId: string }> }) {
  const { replyId } = await params;
  await runPage(() => getReplyForReview(replyId));
  return children;
}
