'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Client only for usePathname: marks the section you are in. Everything it
// links to is decided on the server (AppNav).
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}
      className={active ? 'font-medium text-base-content' : 'text-base-content/60 hover:text-base-content'}>
      {children}
    </Link>
  );
}
