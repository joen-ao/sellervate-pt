import type { ReplyForReview } from '@/lib/data/reviews';
import { GuidelinesPanel } from './GuidelinesPanel';

const CHANNEL_LABEL = { email: 'Email', amazon: 'Amazon', shopify: 'Shopify', walmart: 'Walmart' } as const;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

// Left column: who, where, when; the guidelines it is judged against; the exchange.
export function Exchange({ reply, brand, specialist }: Pick<ReplyForReview, 'reply' | 'brand' | 'specialist'>) {
  return (
    <section className="flex flex-col gap-5">
      <header>
        <h1 className="text-xl font-semibold">{brand.name}</h1>
        <p className="text-sm text-base-content/70">
          {CHANNEL_LABEL[reply.channel]} · {specialist.full_name} ·{' '}
          <time dateTime={reply.sent_at}>{formatDateTime(reply.sent_at)}</time>
        </p>
      </header>

      <GuidelinesPanel guidelines={brand.voice_guidelines} />

      <div>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">Customer</h2>
        <p className="whitespace-pre-line rounded-box bg-base-200 p-4">{reply.customer_message}</p>
      </div>

      <div>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Reply from {specialist.full_name}
        </h2>
        <p className="whitespace-pre-line rounded-box border border-base-300 p-4">{reply.reply_text}</p>
      </div>
    </section>
  );
}
