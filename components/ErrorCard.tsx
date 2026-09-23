type Props = { title: string; body?: React.ReactNode; onRetry?: () => void; compact?: boolean };

// A failure of the tool, not of the reply: neutral, never red (red means critical, DESIGN.md).
// compact: one line inside a form. onRetry is a function, so pass it from a client component.
export function ErrorCard({ title, body = 'Something went wrong on our side. Nothing was lost.', onRetry, compact }: Props) {
  if (compact) return <p role="alert" className="alert py-2 text-sm">{title}</p>;
  return (
    <div role="alert" className="alert flex flex-col items-start gap-3">
      <p className="font-medium">{title}</p>
      <div className="text-sm text-base-content/70">{body}</div>
      {onRetry && <button type="button" className="btn btn-sm btn-neutral" onClick={onRetry}>Try again</button>}
    </div>
  );
}
