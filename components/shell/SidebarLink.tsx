'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePendingCount } from './PendingCounts';

type Props = {
  href: string;
  icon?: React.ReactNode;
  count?: number;
  countLabel?: string;
  // Lets a client action adjust this count before the server sends a new one.
  countId?: string;
  // Other path prefixes that belong to this section (the review panel is part of the queue).
  also?: string[];
  exact?: boolean;
  indent?: boolean;
  children: React.ReactNode;
};

// Close the mobile drawer after a navigation; on desktop the checkbox is inert.
function closeDrawer() {
  const toggle = document.getElementById('app-nav') as HTMLInputElement | null;
  if (toggle) toggle.checked = false;
}

export function SidebarLink({ href, icon, count, countLabel, countId, also = [], exact, indent, children }: Props) {
  const path = usePathname();
  const shown = usePendingCount(countId, count);
  const matches = (p: string) => (exact ? path === p : path === p || path.startsWith(`${p}/`));
  const active = matches(href) || also.some(matches);

  return (
    <Link
      href={href}
      onClick={closeDrawer}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex h-8 items-center gap-2.5 rounded-field text-sm transition-colors',
        indent ? 'pl-8 pr-2' : 'px-2',
        active
          ? 'bg-base-300/70 font-medium text-base-content'
          : 'text-base-content/65 hover:bg-base-300/40 hover:text-base-content',
      ].join(' ')}
    >
      {icon && <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shown ? (
        <span className="min-w-5 rounded-full bg-base-300 px-1.5 text-center text-[11px] font-medium leading-5 tabular-nums text-base-content/75" aria-label={countLabel}>{shown}</span>
      ) : null}
    </Link>
  );
}

// An icon-only sidebar link (the account footer's switch): same drawer behaviour.
export function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={closeDrawer} title={label} aria-label={label}
      className="btn btn-square btn-ghost btn-sm text-base-content/60 hover:text-base-content">
      {children}
    </Link>
  );
}
