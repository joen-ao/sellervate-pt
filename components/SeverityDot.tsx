import type { Severity } from '@/lib/types';

const DOT: Record<Exclude<Severity, 'none'>, { cls: string; label: string }> = {
  critical: { cls: 'bg-error', label: 'Critical error' },
  minor: { cls: 'bg-warning', label: 'Minor issue' },
};

// Renders nothing for severity "none", so callers can drop it in unconditionally.
export function SeverityDot({ severity }: { severity: Severity }) {
  if (severity === 'none') return null;
  const d = DOT[severity];
  return (
    <span role="img" aria-label={d.label} title={d.label}
      className={`inline-block size-2.5 shrink-0 rounded-full ${d.cls}`} />
  );
}
