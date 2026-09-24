import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { listMyReviews } from '@/lib/data/my-reviews';
import { runPage } from '@/lib/page';
import { MyReviewCard } from './_components/MyReviewCard';
import { MySummary } from './_components/MySummary';

export const metadata = { title: 'My feedback · Sellervate' };

// Leads are redirected in layout.tsx; listMyReviews() is still role-gated.
export default async function MePage() {
  const { items, summary } = await runPage(() => listMyReviews());

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <PageHeader eyebrow="Your work" title="My feedback"
        lead="What your team lead said about replies you sent. Read each one and press Got it, so they know it landed. Only you see this." />

      <MySummary summary={summary} />

      {items.length === 0 ? (
        <EmptyState title="No feedback yet"
          body="When your team lead reviews one of your replies, it shows up here. Nothing to do until then." />
      ) : (
        <section aria-label="Reviews, newest first" className="flex flex-col gap-3">
          {items.map(r => <MyReviewCard key={r.id} review={r} />)}
        </section>
      )}
    </main>
  );
}
