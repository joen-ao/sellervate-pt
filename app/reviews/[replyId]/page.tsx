import { getReplyForReview } from '@/lib/data/reviews';
import { runPage } from '@/lib/page';
import { Exchange } from './_components/Exchange';
import { ReviewForm } from './_components/ReviewForm';
import { ReviewReadOnly } from './_components/ReviewReadOnly';

export default async function ReviewPage({ params }: { params: Promise<{ replyId: string }> }) {
  const { replyId } = await params;
  return runPage(async () => {
    const data = await getReplyForReview(replyId);
    return (
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <Exchange reply={data.reply} brand={data.brand} specialist={data.specialist} />
        <aside className="lg:sticky lg:top-8 lg:self-start">
          {data.myReview
            ? <ReviewReadOnly review={data.myReview} />
            : <ReviewForm replyId={data.reply.id} specialistFirstName={data.specialist.full_name.split(' ')[0]} />}
        </aside>
      </main>
    );
  });
}
