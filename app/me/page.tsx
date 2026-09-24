import { EmptyState } from '@/components/EmptyState';
import { listMyReviews } from '@/lib/data/my-reviews';
import { runPage } from '@/lib/page';
import { MyReviewCard } from './_components/MyReviewCard';
import { MySummary } from './_components/MySummary';

export const metadata = { title: 'My feedback · Sellervate' };

// Leads are redirected in layout.tsx; listMyReviews() is still role-gated.
export default async function MePage() {
  const { items, summary } = await runPage(() => listMyReviews());

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold">My feedback</h1>
        <p className="text-base-content/70">What your team lead said about replies you sent. Read each one and press Got it, so they know it landed. Only you see this.</p>
      </header>

      <MySummary summary={summary} />

      {items.length === 0 ? (
        <EmptyState title="No feedback yet"
          body="When your team lead reviews one of your replies, it shows up here. Nothing to do until then." />
      ) : (
        <section aria-label="Reviews, newest first" className="flex flex-col gap-4">
          {items.map(r => <MyReviewCard key={r.id} review={r} />)}
        </section>
      )}
    </main>
  );
}
