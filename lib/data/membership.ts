import 'server-only';
import { cache } from 'react';
import { admin } from '@/lib/supabase/admin';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export const getMemberBrandIds = cache(async (userId: string): Promise<string[]> => {
  const { data, error } = await admin.from('brand_members')
    .select('brand_id').eq('user_id', userId);
  if (error) throw error;
  return data.map(r => r.brand_id);
});

export async function assertBrandMember(userId: string, brandId: string): Promise<void> {
  const ids = await getMemberBrandIds(userId);
  if (!ids.includes(brandId)) throw new ForbiddenError('Not a member of this brand');
}

// slug → id, but only if member. 404 if slug unknown, 403 if known and not member.
export async function resolveMemberBrand(userId: string, slug: string) {
  const { data } = await admin.from('brands')
    .select('id, name, slug, voice_guidelines').eq('slug', slug).maybeSingle();
  if (!data) throw new NotFoundError('Brand');
  await assertBrandMember(userId, data.id);
  return data;
}
