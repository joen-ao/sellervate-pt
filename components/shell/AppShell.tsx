import Link from 'next/link';
import {
  ArrowLeftRight, ChartLine, FileText, ListChecks, Menu, MessageSquareText, Store, Upload,
} from 'lucide-react';
import type { CurrentUser } from '@/lib/current-user';
import type { ShellBrand } from '@/lib/data/shell';
import { BrandNav } from './BrandNav';
import { SidebarLink } from './SidebarLink';

const ICON = { size: 16, strokeWidth: 1.75 } as const;
const ROLE_LABEL = { team_lead: 'Team lead', specialist: 'Specialist' } as const;

// The signed-in frame: a sidebar that says who you are, what is waiting for you
// and where your brands live. daisyUI drawer: fixed on large screens, a panel
// behind a menu button on small ones, and it opens without JavaScript.
export function AppShell({ user, brands, children }: {
  user: CurrentUser; brands: ShellBrand[]; children: React.ReactNode;
}) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="app-nav" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-base-300 bg-base-100 px-3 lg:hidden">
          <label htmlFor="app-nav" className="btn btn-square btn-ghost btn-sm" aria-label="Open navigation">
            <Menu {...ICON} />
          </label>
          <Link href="/" className="text-sm font-semibold">Sellervate QA</Link>
          <span className="ml-auto truncate text-sm text-base-content/60">{user.fullName}</span>
        </header>
        {children}
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="app-nav" className="drawer-overlay" aria-label="Close navigation" />
        <Sidebar user={user} brands={brands} />
      </div>
    </div>
  );
}

function Sidebar({ user, brands }: { user: CurrentUser; brands: ShellBrand[] }) {
  const lead = user.role === 'team_lead';
  const pending = brands.reduce((s, b) => s + b.pending, 0);

  return (
    <aside className="flex min-h-full w-64 flex-col gap-7 border-r border-base-300 bg-base-200 px-3 py-5">
      <Link href="/" className="px-2 text-sm font-semibold">Sellervate QA</Link>

      <div className="flex items-center gap-3 px-2">
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-base-300 text-xs font-medium">
          {user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </span>
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-medium">{user.fullName}</p>
          <p className="text-sm text-base-content/60">
            {ROLE_LABEL[user.role]}
            {brands.length > 0 && <> · {brands.map(b => b.name).join(', ')}</>}
          </p>
        </div>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-7">
        <Group title="Your work">
          {lead ? (
            <li>
              <SidebarLink href="/queue" also={['/reviews']} icon={<ListChecks {...ICON} />}
                count={pending} countLabel={`${pending} unreviewed`}>
                Review queue
              </SidebarLink>
            </li>
          ) : (
            <li>
              <SidebarLink href="/me" icon={<MessageSquareText {...ICON} />}
                count={pending} countLabel={`${pending} unread`}>
                My feedback
              </SidebarLink>
            </li>
          )}
        </Group>

        {lead && brands.length > 0 && (
          <Group title="Brands">
            {brands.map(b => (
              <BrandNav key={b.id} slug={b.slug} name={b.name} pending={b.pending} icons={{
                brand: <Store {...ICON} />, trends: <ChartLine {...ICON} />,
                report: <FileText {...ICON} />, importing: <Upload {...ICON} />,
              }} />
            ))}
          </Group>
        )}
      </nav>

      <SidebarLink href="/switch-needed" icon={<ArrowLeftRight {...ICON} />}>Switch person</SidebarLink>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="px-2 text-xs font-medium uppercase tracking-wide text-base-content/50">{title}</h2>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </section>
  );
}
