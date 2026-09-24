import 'server-only';
import { cache } from 'react';
import { getCurrentUser } from '@/lib/current-user';
import { admin } from '@/lib/supabase/admin';
import { asUser } from '@/lib/supabase/rls';
import type { UserRole } from '@/lib/types';

// What the app shell needs. Two reads, one per side of the stubbed login.

export type ShellBrand = { id: string; name: string; slug: string; pending: number };

// The current user's brands, each with what is waiting for them there: for a
// lead, replies they have not reviewed; for a specialist, feedback they have
// not read. Run as the user, like every DAL read.
export const getShellBrands = cache(async (): Promise<ShellBrand[]> => {
  const u = await getCurrentUser();
  if (!u) return [];
  return asUser(u.id, tx => tx<ShellBrand[]>`
    select b.id, b.name, b.slug,
      case when ${u.role} = 'team_lead' then
        (select count(*)::int from replies r where r.brand_id = b.id
           and not exists (select 1 from reviews v where v.reply_id = r.id and v.reviewer_id = ${u.id}))
      else
        (select count(*)::int from reviews v join replies r on r.id = v.reply_id
           where r.brand_id = b.id and r.specialist_id = ${u.id} and v.acknowledged_at is null)
      end as pending
    from brands b join brand_members m on m.brand_id = b.id and m.user_id = ${u.id}
    order by b.name`);
});

export type Persona = { id: string; fullName: string; role: UserRole; brands: string[] };

// Everyone, with the brands they cover, for the person picker. Like
// listSwitchableUsers() this is the stubbed login's own read (service role):
// picking a person IS the login, so there is no user yet to read as. It grants
// nothing — what each person then sees is decided by membership.
export const listPersonas = cache(async (): Promise<Persona[]> => {
  const { data, error } = await admin.from('profiles')
    .select('id, full_name, role, brand_members(brands(name))')
    .order('full_name');
  if (error) throw error;
  return data.map(p => ({
    id: p.id, fullName: p.full_name, role: p.role,
    brands: p.brand_members.map(m => m.brands.name).sort(),
  }));
});

// The sidebar's counts keyed as the sidebar keys them ('total', 'brand:<slug>'),
// read fresh after a write so an action can hand the client the real numbers.
export async function getPendingCounts(): Promise<Record<string, number>> {
  const brands = await getShellBrands();
  const counts: Record<string, number> = { total: brands.reduce((s, b) => s + b.pending, 0) };
  for (const b of brands) counts[`brand:${b.slug}`] = b.pending;
  return counts;
}
