import { BookOpen } from 'lucide-react';

// Closed by default; the first line of the guidelines is the summary, so the
// brand's tone is visible without opening it.
export function GuidelinesPanel({ guidelines, defaultOpen = false }: { guidelines: string; defaultOpen?: boolean }) {
  const [first, ...rest] = guidelines.split('\n');
  return (
    <details open={defaultOpen} className="collapse collapse-arrow rounded-box bg-base-200/60">
      <summary className="collapse-title flex gap-3 pe-10 text-sm">
        <BookOpen size={16} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-base-content/50" />
        <span>
          <span className="block text-xs font-medium uppercase tracking-[0.08em] text-base-content/50">Brand guidelines</span>
          <span className="mt-1 block text-base-content/85">{first}</span>
        </span>
      </summary>
      {rest.length > 0 && (
        <div className="collapse-content whitespace-pre-line ps-11 text-sm leading-relaxed text-base-content/70">{rest.join('\n')}</div>
      )}
    </details>
  );
}
