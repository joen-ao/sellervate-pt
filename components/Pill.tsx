type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'ghost';

const TONE: Record<Tone, string> = {
  neutral: 'badge-neutral', success: 'badge-success', warning: 'badge-warning',
  error: 'badge-error', info: 'badge-info', ghost: 'badge-ghost',
};

// A small status label: score, state, tag. Content carries the meaning; tone only colours it.
export function Pill({ children, tone = 'ghost', title }: { children: React.ReactNode; tone?: Tone; title?: string }) {
  return <span title={title} className={`badge badge-sm whitespace-nowrap ${TONE[tone]}`}>{children}</span>;
}
