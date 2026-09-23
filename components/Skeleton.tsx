// A placeholder block; size it with className so it matches what it stands in for.
export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}
