import 'server-only';
import { cache } from 'react';
import { requireRole } from '@/lib/current-user';
import { assertBrandMember } from '@/lib/data/membership';
import { nextUnreviewedReplyId as nextInQueueOrder } from '@/lib/data/replies';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { admin } from '@/lib/supabase/admin';
import { asUser } from '@/lib/supabase/rls';
import type { Brand, Profile, Reply, Review } from '@/lib/types';
import { ReplyId, type ReviewInput } from '@/lib/validation/review';

export type ReplyForReview = {
  reply: Pick<Reply, 'id' | 'customer_message' | 'reply_text' | 'sent_at' | 'channel'>;
  brand: Pick<Brand, 'id' | 'name' | 'slug' | 'voice_guidelines'>;
  specialist: Pick<Profile, 'id' | 'full_name'>;
  // only the current lead's own review; other leads' reviews are not shown (P1)
  myReview: Pick<Review, 'id' | 'score' | 'severity' | 'categories' | 'comment' | 'created_at'> | null;
};

// Existence + brand of a reply, on the service-role client: under RLS a reply in
// a brand you don't cover is invisible, which would turn the 403 into a 404
// (same reasoning as resolveMemberBrand). Returns ids only; content is read as the user.
async function replyBrandId(replyId: string): Promise<string> {
  const { data, error } = await admin.from('replies').select('brand_id').eq('id', replyId).maybeSingle();
  if (error) throw error;
  if (!data) throw new NotFoundError('Reply');
  return data.brand_id;
}

type ReplyRow = ReplyForReview['reply'] & {
  brand: ReplyForReview['brand']; specialist: ReplyForReview['specialist'];
};

// cache(): the segment layout runs this for the access check (so 403/404 are real
// HTTP statuses, decided before loading.tsx streams a 200) and the page reuses it.
export const getReplyForReview = cache(async (replyId: string): Promise<ReplyForReview> => {
  const u = await requireRole('team_lead');
  // a malformed id would fail Postgres' uuid cast (500); it is simply "no such reply"
  if (!ReplyId.safeParse(replyId).success) throw new NotFoundError('Reply');
  await assertBrandMember(u.id, await replyBrandId(replyId)); // 403 before anything else is read

  return asUser(u.id, async tx => {
    const [data] = await tx<ReplyRow[]>`
      select r.id, r.customer_message, r.reply_text, r.sent_at, r.channel,
             json_build_object('id', b.id, 'name', b.name, 'slug', b.slug,
                               'voice_guidelines', b.voice_guidelines) as brand,
             json_build_object('id', p.id, 'full_name', p.full_name) as specialist
      from replies r join brands b on b.id = r.brand_id join profiles p on p.id = r.specialist_id
      where r.id = ${replyId}`;
    if (!data) throw new ForbiddenError('Not a member of this brand');
    const [mine] = await tx<NonNullable<ReplyForReview['myReview']>[]>`
      select id, score, severity, categories, comment, created_at
      from reviews where reply_id = ${replyId} and reviewer_id = ${u.id}`;
    const { brand, specialist, ...reply } = data;
    return { reply, brand, specialist, myReview: mine ?? null };
  });
});

export async function createReview(input: ReviewInput): Promise<{ id: string; brandId: string }> {
  const u = await requireRole('team_lead');
  const brandId = await replyBrandId(input.replyId);
  await assertBrandMember(u.id, brandId); // before the insert; RLS's insert policy checks it again

  try {
    const [row] = await asUser(u.id, tx => tx<{ id: string }[]>`
      insert into reviews (reply_id, reviewer_id, score, severity, categories, comment)
      values (${input.replyId}, ${u.id}, ${input.score}, ${input.severity},
              string_to_array(${input.categories.join(',')}, ',')::failure_category[], ${input.comment})
      returning id`);
    return { id: row.id, brandId };
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === '23505') throw new ConflictError('Already reviewed');
    if (code === '42501') throw new ForbiddenError('Not allowed to review this reply');
    throw e;
  }
}

// "Save and next" follows the queue's order, oldest unreviewed first, by reusing
// the queue's own query (replies.ts). It prefers the brand just reviewed (same
// guidelines on screen), then any member brand.
export async function nextUnreviewedReplyId(preferBrandId?: string): Promise<string | null> {
  const u = await requireRole('team_lead');
  if (preferBrandId) {
    const [brand] = await asUser(u.id, tx => tx<{ slug: string }[]>`
      select slug from brands where id = ${preferBrandId}`);
    const inBrand = brand && await nextInQueueOrder(brand.slug); // re-checks membership
    if (inBrand) return inBrand;
  }
  return nextInQueueOrder();
}
