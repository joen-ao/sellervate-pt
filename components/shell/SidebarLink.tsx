'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  href: string;
  icon?: React.ReactNode;
  count?: number;
  countLabel?: string;
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

export function SidebarLink({ href, icon, count, countLabel, also = [], exact, indent, children }: Props) {
  const path = usePathname();
  const matches = (p: string) => (exact ? path === p : path === p || path.startsWith(`${p}/`));
  const active = matches(href) || also.some(matches);

  return (
    <Link
      href={href}
      onClick={closeDrawer}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center gap-3 rounded-field py-1.5 text-sm transition-colors',
        indent ? 'pl-9 pr-2' : 'px-2',
        active
          ? 'bg-base-300 font-medium text-base-content'
          : 'text-base-content/70 hover:bg-base-300/50 hover:text-base-content',
      ].join(' ')}
    >
      {icon && <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count ? (
        <span className="text-xs tabular-nums text-base-content/60" aria-label={countLabel}>{count}</span>
      ) : null}
    </Link>
  );
}
