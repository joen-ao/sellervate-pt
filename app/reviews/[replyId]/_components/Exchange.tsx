import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/PageHeader';
import type { ReplyForReview } from '@/lib/data/reviews';
import { GuidelinesPanel } from './GuidelinesPanel';

const CHANNEL_LABEL = { email: 'Email', amazon: 'Amazon', shopify: 'Shopify', walmart: 'Walmart' } as const;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

// Left column: who, where, when; the guidelines it is judged against; the
// exchange as a thread, set for long reading.
export function Exchange({ reply, brand, specialist }: Pick<ReplyForReview, 'reply' | 'brand' | 'specialist'>) {
  return (
    <section className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/queue" className="flex w-fit items-center gap-1.5 text-sm text-base-content/50 transition-colors hover:text-base-content">
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden /> Review queue
        </Link>
        <h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{brand.name}</h1>
        <p className="text-sm text-base-content/50">
          {CHANNEL_LABEL[reply.channel]} · {specialist.full_name} ·{' '}
          <time dateTime={reply.sent_at}>{formatDateTime(reply.sent_at)}</time>
        </p>
      </header>

      <GuidelinesPanel guidelines={brand.voice_guidelines} />

      <ol className="flex flex-col gap-5" aria-label="The exchange">
        <Message who="Customer" name="Customer" tone="bg-base-200">{reply.customer_message}</Message>
        <Message who={`Reply from ${specialist.full_name}`} name={specialist.full_name} tone="bg-base-300/45">
          {reply.reply_text}
        </Message>
      </ol>
    </section>
  );
}

function Message({ who, name, tone, children }: { who: string; name: string; tone: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <Avatar name={name} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className="text-sm font-medium text-base-content/70">{who}</h2>
        <p className={`whitespace-pre-line rounded-box px-5 py-4 leading-relaxed ${tone}`}>{children}</p>
      </div>
    </li>
  );
}
