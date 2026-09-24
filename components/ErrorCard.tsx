import { CircleAlert } from 'lucide-react';

type Props = { title: string; body?: React.ReactNode; onRetry?: () => void; compact?: boolean };

// A failure of the tool, not of the reply: neutral, never red (red means critical, DESIGN.md).
// compact: one line inside a form. onRetry is a function, so pass it from a client component.
export function ErrorCard({ title, body = 'Something went wrong on our side. Nothing was lost.', onRetry, compact }: Props) {
  if (compact) {
    return (
      <p role="alert" className="flex items-center gap-2 rounded-field bg-base-300/60 px-3 py-2 text-sm">
        <CircleAlert size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-base-content/60" />
        {title}
      </p>
    );
  }
  return (
    <div role="alert" className="flex gap-4 rounded-box bg-base-200 p-5">
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content/70">
        <CircleAlert size={18} strokeWidth={1.75} />
      </span>
      <div className="flex flex-col items-start gap-2">
        <p className="font-medium">{title}</p>
        <div className="text-sm leading-relaxed text-base-content/60">{body}</div>
        {onRetry && <button type="button" className="btn btn-sm btn-neutral mt-1" onClick={onRetry}>Try again</button>}
      </div>
    </div>
  );
}
