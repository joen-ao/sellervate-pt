import type { Severity } from '@/lib/types';

const DOT: Record<Exclude<Severity, 'none'>, { cls: string; label: string }> = {
  critical: { cls: 'bg-error ring-error/25', label: 'Critical error' },
  minor: { cls: 'bg-warning ring-warning/20', label: 'Minor issue' },
};

// Renders nothing for severity "none", so callers can drop it in unconditionally.
export function SeverityDot({ severity }: { severity: Severity }) {
  if (severity === 'none') return null;
  const d = DOT[severity];
  return (
    <span role="img" aria-label={d.label} title={d.label}
      className={`inline-block size-2 shrink-0 rounded-full ring-4 ${d.cls}`} />
  );
}
