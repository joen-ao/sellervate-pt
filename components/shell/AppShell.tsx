import {
  ArrowLeftRight, ChartLine, FileText, ListChecks, Menu, MessageSquareText, Store, Upload,
} from 'lucide-react';
import { Avatar } from '@/components/PageHeader';
import { BrandMark } from '@/components/BrandMark';
import type { CurrentUser } from '@/lib/current-user';
import type { ShellBrand } from '@/lib/data/shell';
import { BrandNav } from './BrandNav';
import { PendingCountsProvider } from './PendingCounts';
import { IconLink, SidebarLink } from './SidebarLink';

const ICON = { size: 16, strokeWidth: 1.75 } as const;
const ROLE_LABEL = { team_lead: 'Team lead', specialist: 'Specialist' } as const;

// The signed-in frame: a sidebar that says who you are, what is waiting for you
// and where your brands live. daisyUI drawer: fixed on large screens, a panel
// behind a menu button on small ones, and it opens without JavaScript.
export function AppShell({ user, brands, children }: {
  user: CurrentUser; brands: ShellBrand[]; children: React.ReactNode;
}) {
  return (
    <PendingCountsProvider>
      <div className="drawer lg:drawer-open">
        <input id="app-nav" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex min-h-screen min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-base-300/60 bg-base-100/85 px-3 backdrop-blur lg:hidden">
            <label htmlFor="app-nav" className="btn btn-square btn-ghost btn-sm" aria-label="Open navigation">
              <Menu {...ICON} />
            </label>
            <BrandMark />
            <span className="ml-auto truncate text-sm text-base-content/60">{user.fullName}</span>
          </header>
          {children}
        </div>
        <div className="drawer-side z-40">
          <label htmlFor="app-nav" className="drawer-overlay" aria-label="Close navigation" />
          <Sidebar user={user} brands={brands} />
        </div>
      </div>
    </PendingCountsProvider>
  );
}

function Sidebar({ user, brands }: { user: CurrentUser; brands: ShellBrand[] }) {
  const lead = user.role === 'team_lead';
  const pending = brands.reduce((s, b) => s + b.pending, 0);

  return (
    <aside className="flex min-h-full w-64 flex-col gap-8 bg-sunken px-3 pt-4 pb-3">
      <div className="px-2"><BrandMark /></div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-7">
        <Group title="Your work">
          {lead ? (
            <li>
              <SidebarLink href="/queue" also={['/reviews']} icon={<ListChecks {...ICON} />}
                count={pending} countId="total" countLabel={`${pending} unreviewed`}>
                Review queue
              </SidebarLink>
            </li>
          ) : (
            <li>
              <SidebarLink href="/me" icon={<MessageSquareText {...ICON} />}
                count={pending} countId="total" countLabel={`${pending} unread`}>
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

      {/* Who you are, at the foot, like an account menu; switching sits beside it. */}
      <div className="flex items-center gap-3 rounded-box px-2 py-2">
        <Avatar name={user.fullName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-base-content/50">
            {ROLE_LABEL[user.role]}
            {brands.length > 0 && <> · {brands.map(b => b.name).join(', ')}</>}
          </p>
        </div>
        <IconLink href="/switch-needed" label="Switch person"><ArrowLeftRight {...ICON} /></IconLink>
      </div>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-base-content/40">{title}</h2>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </section>
  );
}
