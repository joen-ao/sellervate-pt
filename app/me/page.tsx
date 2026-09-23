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
        <p className="text-base-content/70">What your team lead said about replies you sent. Only you see this.</p>
      </header>

      <MySummary summary={summary} />

      {items.length === 0 ? (
        <section className="rounded-box border border-dashed border-base-300 p-10 text-center">
          <h2 className="font-medium">No feedback yet</h2>
          <p className="mt-1 text-base-content/70">
            When your team lead reviews one of your replies, it shows up here.
          </p>
        </section>
      ) : (
        <section aria-label="Reviews, newest first" className="flex flex-col gap-4">
          {items.map(r => <MyReviewCard key={r.id} review={r} />)}
        </section>
      )}
    </main>
  );
}
