type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'ghost';

// Soft badges: a status tints the pill instead of filling it (DESIGN.md).
const TONE: Record<Tone, string> = {
  neutral: 'border-transparent bg-base-300 text-base-content/85',
  success: 'badge-soft badge-success', warning: 'badge-soft badge-warning',
  error: 'badge-soft badge-error', info: 'badge-soft badge-info',
  ghost: 'border-base-300 bg-transparent text-base-content/60',
};

// A small status label: score, state, tag. Content carries the meaning; tone only colours it.
export function Pill({ children, tone = 'ghost', title }: { children: React.ReactNode; tone?: Tone; title?: string }) {
  return <span title={title} className={`badge badge-sm whitespace-nowrap font-medium tabular-nums ${TONE[tone]}`}>{children}</span>;
}

// Score colour: 4–5 good, 1–3 needs work. Never red — red is reserved for a critical error.
export const scoreTone = (score: number): Tone => (score >= 4 ? 'success' : 'warning');
