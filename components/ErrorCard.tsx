type Props = { title: string; body?: React.ReactNode; onRetry?: () => void };

// For error.tsx boundaries. onRetry is a function, so render this from a client component when you pass it.
export function ErrorCard({ title, body = 'Something went wrong on our side. Nothing was lost.', onRetry }: Props) {
  return (
    <div role="alert" className="alert alert-error alert-soft flex flex-col items-start gap-3">
      <p className="font-medium">{title}</p>
      <div className="text-sm">{body}</div>
      {onRetry && <button type="button" className="btn btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}
