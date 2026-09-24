import Link from 'next/link';
import { NavLink } from '@/components/NavLink';
import type { CurrentUser } from '@/lib/current-user';
import type { QueueBrand } from '@/lib/data/replies';

// The shell's navigation. Leads get the queue and one link per brand they cover
// (the brand list comes from the DAL, so it is membership-filtered); specialists
// get their reviews. Nobody signed in: nothing — /switch-needed says what to do.
export function AppNav({ user, brands }: { user: CurrentUser | null; brands: QueueBrand[] }) {
  if (!user) return null;
  return (
    <nav aria-label="Main" className="border-b border-base-300">
      <div className="mx-auto flex h-12 max-w-5xl items-center gap-6 px-6 text-sm">
        <Link href="/" className="font-semibold">Sellervate QA</Link>
        {user.role === 'team_lead' ? (
          <>
            <NavLink href="/queue">Queue</NavLink>
            {brands.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-base-content/40">Brands</span>
                {brands.map(b => <NavLink key={b.id} href={`/brands/${b.slug}`}>{b.name}</NavLink>)}
              </div>
            )}
          </>
        ) : (
          <NavLink href="/me">My reviews</NavLink>
        )}
      </div>
    </nav>
  );
}
