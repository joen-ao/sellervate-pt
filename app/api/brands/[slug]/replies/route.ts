import { handle } from '@/app/api/_lib/respond';
import { requireUser } from '@/lib/current-user';
import { resolveMemberBrand } from '@/lib/data/membership';
import { PAGE_SIZE, REPLY_COLUMNS } from '@/lib/data/_shared';
import { admin } from '@/lib/supabase/admin';

// Foundation version: proves 200 / 403 / 404 from the cookie alone.
// 03 moves the query into lib/data/replies.ts and extends it.
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const u = await requireUser();
    const brand = await resolveMemberBrand(u.id, (await params).slug);
    let q = admin.from('replies').select(REPLY_COLUMNS)
      .eq('brand_id', brand.id).order('sent_at', { ascending: false }).limit(PAGE_SIZE);
    if (u.role === 'specialist') q = q.eq('specialist_id', u.id);
    const { data, error } = await q;
    if (error) throw error;
    return { brand: brand.slug, replies: data };
  });
}
