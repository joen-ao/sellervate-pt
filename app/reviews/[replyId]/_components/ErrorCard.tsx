// Local stand-in until the shared ErrorCard from branch 03 lands; wave 3 (07b)
// swaps this for components/ErrorCard. No hooks, so it works in server and client trees.
type Props = { title?: string; message: string; compact?: boolean; onRetry?: () => void };

export function ErrorCard({ title = 'Something went wrong', message, compact, onRetry }: Props) {
  return (
    <div role="alert" className={`alert alert-error alert-soft ${compact ? 'py-2 text-sm' : ''}`}>
      <div>
        {!compact && <p className="font-semibold">{title}</p>}
        <p>{message}</p>
      </div>
      {onRetry && <button type="button" className="btn btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}
