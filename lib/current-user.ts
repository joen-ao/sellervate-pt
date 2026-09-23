import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { admin } from '@/lib/supabase/admin';
import { ForbiddenError } from '@/lib/errors';
import { COOKIE, verifyUserId } from '@/lib/session';
import type { UserRole } from '@/lib/types';

export { COOKIE, signUserId } from '@/lib/session';

export type CurrentUser = { id: string; fullName: string; role: UserRole };

// cache(): one DB hit per request even if called from layout + page + actions.
// null means "nobody signed in"; a database error throws, so an outage reaches
// an error boundary instead of looking like a signed-out user.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const id = verifyUserId((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const { data, error } = await admin.from('profiles')
    .select('id, full_name, role').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, fullName: data.full_name, role: data.role } : null;
});

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new ForbiddenError('Not signed in');
  return u;
}

export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== role) throw new ForbiddenError(`Requires ${role}`);
  return u;
}

// The stubbed login's own need: the switcher lists everyone, because picking a
// person IS the login. It grants nothing — what each person sees is still
// decided by membership. Goes away when /switch becomes Supabase Auth.
export const listSwitchableUsers = cache(async (): Promise<CurrentUser[]> => {
  const { data, error } = await admin.from('profiles')
    .select('id, full_name, role').order('role', { ascending: false }).order('full_name');
  if (error) throw error;
  return data.map(p => ({ id: p.id, fullName: p.full_name, role: p.role }));
});
