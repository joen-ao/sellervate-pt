import 'server-only';
import { admin } from '@/lib/supabase/admin';
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

  const { data, error } = await admin.from('reviews')
    .select(`id, reply_id, score, severity, categories, comment, created_at, acknowledged_at,
             reviewer:profiles!reviews_reviewer_id_fkey!inner(full_name),
             reply:replies!inner(specialist_id, brand_id, customer_message, reply_text, sent_at,
               brand:brands!inner(name, slug))`)
    // the isolation lines: in SQL, on the joined table
    .eq('reply.specialist_id', u.id)
    .in('reply.brand_id', brandIds)
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (error) throw error;

  const items: MyReview[] = data.map(r => ({
    id: r.id, replyId: r.reply_id,
    brandName: r.reply.brand.name, brandSlug: r.reply.brand.slug,
    reviewerName: r.reviewer.full_name,
    score: r.score, severity: r.severity, categories: r.categories, comment: r.comment,
    createdAt: r.created_at, acknowledgedAt: r.acknowledged_at,
    customerMessage: r.reply.customer_message, replyText: r.reply.reply_text, sentAt: r.reply.sent_at,
  }));

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

  // PostgREST cannot put a subquery in an UPDATE's WHERE, so ownership is two
  // SQL predicates: (1) the reply carrying this review, only if it is mine...
  const { data: own, error: ownErr } = await admin.from('replies')
    .select('id, reviews!inner(id)')
    .eq('specialist_id', u.id)
    .in('brand_id', brandIds)
    .eq('reviews.id', reviewId);
  if (ownErr) throw ownErr;
  const ownReplyIds = own.map(r => r.id);

  if (ownReplyIds.length) {
    // ...(2) and the update itself only touches reviews on those replies.
    const { error } = await admin.from('reviews')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', reviewId)
      .in('reply_id', ownReplyIds)
      .is('acknowledged_at', null);
    if (error) throw error;
    return; // zero rows updated here = already acknowledged, which is fine
  }

  const { data: exists, error } = await admin.from('reviews')
    .select('id').eq('id', reviewId).maybeSingle();
  if (error) throw error;
  if (!exists) throw new NotFoundError('Review');
  throw new ForbiddenError('Not your review');
}
