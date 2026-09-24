import 'server-only';
import { cache } from 'react';
import { admin } from '@/lib/supabase/admin';
import { asUser } from '@/lib/supabase/rls';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { Brand } from '@/lib/types';

export const getMemberBrandIds = cache(async (userId: string): Promise<string[]> => {
  const rows = await asUser(userId, tx => tx<{ brand_id: string }[]>`
    select brand_id from brand_members where user_id = ${userId}`);
  return rows.map(r => r.brand_id);
});

export async function assertBrandMember(userId: string, brandId: string): Promise<void> {
  const ids = await getMemberBrandIds(userId);
  if (!ids.includes(brandId)) throw new ForbiddenError('Not a member of this brand');
}

// slug → id, but only if member. 404 if slug unknown, 403 if known and not member.
// The existence lookup is the one read that stays on the service-role client:
// under RLS a brand you don't cover is invisible, which would turn the 403 into
// a 404 (DECISIONS: brand existence is not a secret). It returns the id only;
// everything else about the brand is read as the user.
export async function resolveMemberBrand(userId: string, slug: string) {
  const { data, error } = await admin.from('brands').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!data) throw new NotFoundError('Brand');
  await assertBrandMember(userId, data.id);
  const [brand] = await asUser(userId, tx =>
    tx<Pick<Brand, 'id' | 'name' | 'slug' | 'voice_guidelines'>[]>`
      select id, name, slug, voice_guidelines from brands where id = ${data.id}`);
  if (!brand) throw new ForbiddenError('Not a member of this brand');
  return brand;
}
