import 'server-only';
import { admin } from '@/lib/supabase/admin';
import { asUser } from '@/lib/supabase/rls';
import { requireRole } from '@/lib/current-user';
import { getMemberBrandIds } from '@/lib/data/membership';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { FailureCategory, Severity } from '@/lib/types';

export type MyReview = {
  id: string; replyId: string; brandName: string; brandSlug: string; reviewerName: string;
  score: number; severity: Severity; categories: FailureCategory[]; comment: string;
  createdAt: string; acknowledgedAt: string | null;
  customerMessage: string; replyText: string; sentAt: string;
};

export type MySummary = { n: number; avg: number | null; critical: number };

const LIMIT = 100;
const DAY_MS = 864e5;

// Reviews on the current specialist's own replies, in brands they are a member of.
export async function listMyReviews(): Promise<{ items: MyReview[]; summary: MySummary }> {
  const u = await requireRole('specialist');
  const brandIds = await getMemberBrandIds(u.id);
  if (!brandIds.length) return { items: [], summary: { n: 0, avg: null, critical: 0 } };

  // The isolation lines stay in SQL (specialist_id, brand ids); RLS applies on top.
  const items = await asUser(u.id, tx => tx<MyReview[]>`
    select v.id, v.reply_id as "replyId", b.name as "brandName", b.slug as "brandSlug",
           rv.full_name as "reviewerName", v.score, v.severity, v.categories, v.comment,
           v.created_at as "createdAt", v.acknowledged_at as "acknowledgedAt",
           r.customer_message as "customerMessage", r.reply_text as "replyText", r.sent_at as "sentAt"
    from reviews v
    join replies r on r.id = v.reply_id
    join brands b on b.id = r.brand_id
    join profiles rv on rv.id = v.reviewer_id
    where r.specialist_id = ${u.id} and r.brand_id in ${tx(brandIds)}
    order by v.created_at desc
    limit ${LIMIT}`);

  // Deliberate exception to "aggregate in SQL" (see DECISIONS.md): the rows are
  // already isolated in SQL and there are at most LIMIT of them.
  const since = Date.now() - 30 * DAY_MS;
  const recent = items.filter(i => Date.parse(i.createdAt) > since);
  const summary: MySummary = {
    n: recent.length,
    avg: recent.length ? +(recent.reduce((s, i) => s + i.score, 0) / recent.length).toFixed(2) : null,
    critical: recent.filter(i => i.severity === 'critical').length,
  };
  return { items, summary };
}

// Marks a review on one of MY replies as read. Idempotent: acknowledging twice
// keeps the first timestamp. 404 if the review does not exist, 403 if it is
// on someone else's reply (or the caller is not a specialist).
export async function acknowledgeReview(reviewId: string): Promise<void> {
  const u = await requireRole('specialist');
  const brandIds = await getMemberBrandIds(u.id);

  // One statement: the ownership check is a subquery in the UPDATE itself, run
  // as the user, and RLS's update policy (owner specialist only) applies too.
  const outcome = await asUser(u.id, async tx => {
    if (!brandIds.length) return 'none' as const;
    const updated = await tx`
      update reviews v set acknowledged_at = now()
      where v.id = ${reviewId} and v.acknowledged_at is null
        and exists (select 1 from replies r where r.id = v.reply_id
                    and r.specialist_id = ${u.id} and r.brand_id in ${tx(brandIds)})
      returning v.id`;
    if (updated.length) return 'acked' as const;
    // Zero rows: already acknowledged (fine, first timestamp kept), or not mine.
    const [own] = await tx`
      select 1 from reviews v join replies r on r.id = v.reply_id
      where v.id = ${reviewId} and r.specialist_id = ${u.id}`;
    return own ? ('acked' as const) : ('none' as const);
  });
  if (outcome === 'acked') return;

  // 404 vs 403 needs to know whether the review exists at all, which RLS hides
  // from a specialist; this existence check is the one service-role read here.
  const { data: exists, error } = await admin.from('reviews')
    .select('id').eq('id', reviewId).maybeSingle();
  if (error) throw error;
  if (!exists) throw new NotFoundError('Review');
  throw new ForbiddenError('Not your review');
}
