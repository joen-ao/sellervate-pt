// Closed by default; the first line of the guidelines is the summary, so the
// brand's tone is visible without opening it.
export function GuidelinesPanel({ guidelines, defaultOpen = false }: { guidelines: string; defaultOpen?: boolean }) {
  const [first, ...rest] = guidelines.split('\n');
  return (
    <details open={defaultOpen} className="collapse collapse-arrow rounded-box border border-base-300 bg-base-200/50">
      <summary className="collapse-title pe-10 text-sm">
        <span className="block text-xs font-semibold uppercase tracking-wide text-base-content/60">Brand guidelines</span>
        <span className="mt-1 block">{first}</span>
      </summary>
      {rest.length > 0 && (
        <div className="collapse-content whitespace-pre-line text-sm text-base-content/80">{rest.join('\n')}</div>
      )}
    </details>
  );
}
