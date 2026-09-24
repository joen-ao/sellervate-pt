'use client';

import { usePathname } from 'next/navigation';
import { SidebarLink } from './SidebarLink';

type Props = {
  slug: string;
  name: string;
  pending: number;
  icons: { brand: React.ReactNode; trends: React.ReactNode; report: React.ReactNode; importing: React.ReactNode };
};

// One brand in a lead's sidebar. Its pages unfold only while you are inside
// the brand, so two brands or ten read as a short list.
export function BrandNav({ slug, name, pending, icons }: Props) {
  const base = `/brands/${slug}`;
  const path = usePathname();
  const open = path === base || path.startsWith(`${base}/`);

  return (
    <li className="flex flex-col gap-0.5">
      <SidebarLink href={base} icon={icons.brand} count={pending}
        countLabel={`${pending} ${pending === 1 ? 'reply' : 'replies'} to review`}>
        {name}
      </SidebarLink>
      {open && (
        <ul className="flex flex-col gap-0.5">
          <li><SidebarLink href={base} exact indent icon={icons.trends}>Trends</SidebarLink></li>
          <li><SidebarLink href={`${base}/report`} indent icon={icons.report}>Client report</SidebarLink></li>
          <li><SidebarLink href={`${base}/import`} indent icon={icons.importing}>Import replies</SidebarLink></li>
        </ul>
      )}
    </li>
  );
}
