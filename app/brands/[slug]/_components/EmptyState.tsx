// Local stand-in: branch 03 owns the shared components/EmptyState. Wave 3 (07b) swaps this for it.
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-box border border-dashed border-base-300 px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-base-content/60">{body}</p>
    </div>
  );
}
