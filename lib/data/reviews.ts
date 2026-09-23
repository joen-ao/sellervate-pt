import 'server-only';
import { requireRole } from '@/lib/current-user';
import { assertBrandMember, getMemberBrandIds } from '@/lib/data/membership';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { admin } from '@/lib/supabase/admin';
import type { Brand, Profile, Reply, Review } from '@/lib/types';
import { ReplyId, type ReviewInput } from '@/lib/validation/review';

export type ReplyForReview = {
  reply: Pick<Reply, 'id' | 'customer_message' | 'reply_text' | 'sent_at' | 'channel'>;
  brand: Pick<Brand, 'id' | 'name' | 'slug' | 'voice_guidelines'>;
  specialist: Pick<Profile, 'id' | 'full_name'>;
  // only the current lead's own review; other leads' reviews are not shown (P1)
  myReview: Pick<Review, 'id' | 'score' | 'severity' | 'categories' | 'comment' | 'created_at'> | null;
};

export async function getReplyForReview(replyId: string): Promise<ReplyForReview> {
  const u = await requireRole('team_lead');
  // a malformed id would fail Postgres' uuid cast (500); it is simply "no such reply"
  if (!ReplyId.safeParse(replyId).success) throw new NotFoundError('Reply');
  const { data, error } = await admin.from('replies')
    .select(`id, customer_message, reply_text, sent_at, channel, brand_id,
             brands!inner(id, name, slug, voice_guidelines),
             profiles!replies_specialist_id_fkey!inner(id, full_name)`)
    .eq('id', replyId).maybeSingle();
  if (error) throw error;
  if (!data) throw new NotFoundError('Reply');
  await assertBrandMember(u.id, data.brand_id); // 403 before anything else is returned

  const { data: mine, error: mineError } = await admin.from('reviews')
    .select('id, score, severity, categories, comment, created_at')
    .eq('reply_id', replyId).eq('reviewer_id', u.id).maybeSingle();
  if (mineError) throw mineError;

  return {
    reply: {
      id: data.id, customer_message: data.customer_message, reply_text: data.reply_text,
      sent_at: data.sent_at, channel: data.channel,
    },
    brand: data.brands,
    specialist: data.profiles,
    myReview: mine ?? null,
  };
}

export async function createReview(input: ReviewInput): Promise<{ id: string; brandId: string }> {
  const u = await requireRole('team_lead');
  const { data: reply, error: replyError } = await admin.from('replies')
    .select('id, brand_id').eq('id', input.replyId).maybeSingle();
  if (replyError) throw replyError;
  if (!reply) throw new NotFoundError('Reply');
  await assertBrandMember(u.id, reply.brand_id); // before the insert

  const { data, error } = await admin.from('reviews').insert({
    reply_id: input.replyId, reviewer_id: u.id, score: input.score,
    severity: input.severity, categories: input.categories, comment: input.comment,
  }).select('id').single();
  if (error?.code === '23505') throw new ConflictError('Already reviewed');
  if (error) throw error;
  return { id: data.id, brandId: reply.brand_id };
}

// "Save and next": the newest reply the current lead has not reviewed, preferring
// the brand just reviewed (same guidelines on screen), then any member brand.
export async function nextUnreviewedReplyId(preferBrandId?: string): Promise<string | null> {
  const u = await requireRole('team_lead');
  const brandIds = await getMemberBrandIds(u.id);
  if (brandIds.length === 0) return null;

  const { data: mine, error: mineError } = await admin.from('reviews')
    .select('reply_id').eq('reviewer_id', u.id);
  if (mineError) throw mineError;
  const reviewed = mine.map(r => r.reply_id);

  const scopes = preferBrandId && brandIds.includes(preferBrandId)
    ? [[preferBrandId], brandIds] : [brandIds];
  for (const ids of scopes) {
    let q = admin.from('replies').select('id').in('brand_id', ids)
      .order('sent_at', { ascending: false }).limit(1);
    if (reviewed.length) q = q.not('id', 'in', `(${reviewed.join(',')})`);
    const { data, error } = await q;
    if (error) throw error;
    if (data[0]) return data[0].id;
  }
  return null;
}
