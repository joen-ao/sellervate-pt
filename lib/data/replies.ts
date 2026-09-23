import 'server-only';
import { cache } from 'react';
import { admin } from '@/lib/supabase/admin';
import { requireRole, requireUser } from '@/lib/current-user';
import { getMemberBrandIds, resolveMemberBrand } from './membership';
import { PAGE_SIZE, REPLY_COLUMNS, hoursAgo } from './_shared';
import type { Severity } from '@/lib/types';

export type QueueStatus = 'unreviewed' | 'reviewed' | 'all';
export const QUEUE_STATUSES = ['unreviewed', 'reviewed', 'all'] as const satisfies readonly QueueStatus[];
export const QUEUE_WINDOW_HOURS = 48;

export type QueueFilter = { brandSlug?: string; status: QueueStatus; page: number; windowHours?: number };

export type QueueItem = {
  id: string; brandName: string; brandSlug: string; specialistName: string;
  sentAt: string; customerSnippet: string; replySnippet: string;
  review: null | { score: number; severity: Severity; acknowledgedAt: string | null };
};

export type QueueBrand = { id: string; name: string; slug: string };

export type QueueResult = {
  items: QueueItem[]; total: number; unreviewedTotal: number; brands: QueueBrand[];
};

const SNIPPET = 120;

// Brand ids the lead may query: all member brands, or the one named in the
// filter after resolveMemberBrand has checked it (404 unknown, 403 not member).
// cache(): the page checks access up front, listQueue reuses the answer.
const scopeBrandIds = cache(async (userId: string, brandSlug?: string): Promise<string[]> =>
  brandSlug ? [(await resolveMemberBrand(userId, brandSlug)).id] : getMemberBrandIds(userId));

// The cheap access check a page runs before it starts streaming, so a bad
// ?brand= is a real 403/404 status rather than a 200 shell.
export async function assertQueueAccess(brandSlug?: string): Promise<void> {
  const u = await requireRole('team_lead');
  await scopeBrandIds(u.id, brandSlug);
}

// The lead's member brands, for the filter chips.
export async function listMemberBrands(): Promise<QueueBrand[]> {
  const u = await requireRole('team_lead');
  const ids = await getMemberBrandIds(u.id);
  if (ids.length === 0) return [];
  const { data, error } = await admin.from('brands')
    .select('id, name, slug').in('id', ids).order('name');
  if (error) throw error;
  return data;
}

// "Reviewed" means reviewed by the current lead: the embedded reviews are
// scoped to reviewer_id, so the null check is an anti-join on *their* review.
export async function listQueue(f: QueueFilter): Promise<QueueResult> {
  const u = await requireRole('team_lead');
  const brandIds = await scopeBrandIds(u.id, f.brandSlug);
  if (brandIds.length === 0) return { items: [], total: 0, unreviewedTotal: 0, brands: [] };

  const from = (f.page - 1) * PAGE_SIZE;
  let q = admin.from('replies')
    .select(`id, sent_at, customer_message, reply_text,
             brands!inner(name, slug),
             profiles!replies_specialist_id_fkey!inner(full_name),
             reviews!left(score, severity, acknowledged_at, reviewer_id)`, { count: 'exact' })
    .in('brand_id', brandIds)
    .eq('reviews.reviewer_id', u.id)
    .gte('sent_at', hoursAgo(f.windowHours ?? QUEUE_WINDOW_HOURS))
    .order('sent_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (f.status === 'unreviewed') q = q.is('reviews', null);
  if (f.status === 'reviewed') q = q.not('reviews', 'is', null);

  const [{ data, error, count }, unreviewedTotal, brands] = await Promise.all([
    q, countUnreviewed(u.id, brandIds), listMemberBrands(),
  ]);
  if (error) throw error;

  return {
    items: data.map(r => {
      const v = r.reviews[0];
      return {
        id: r.id, brandName: r.brands.name, brandSlug: r.brands.slug,
        specialistName: r.profiles.full_name, sentAt: r.sent_at,
        customerSnippet: r.customer_message.slice(0, SNIPPET),
        replySnippet: r.reply_text.slice(0, SNIPPET),
        review: v ? { score: v.score, severity: v.severity, acknowledgedAt: v.acknowledged_at } : null,
      };
    }),
    total: count ?? 0, unreviewedTotal, brands,
  };
}

// Whole backlog, not just the 48 h window: the counter is what "Review next" drains.
async function countUnreviewed(userId: string, brandIds: string[]): Promise<number> {
  const { count, error } = await admin.from('replies')
    .select('id, reviews!left(id)', { count: 'exact', head: true })
    .in('brand_id', brandIds).eq('reviews.reviewer_id', userId).is('reviews', null);
  if (error) throw error;
  return count ?? 0;
}

// Oldest reply the lead has not reviewed in their brands (optionally one). Null → caught up.
export async function nextUnreviewedReplyId(brandSlug?: string): Promise<string | null> {
  const u = await requireRole('team_lead');
  const brandIds = await scopeBrandIds(u.id, brandSlug);
  if (brandIds.length === 0) return null;
  const { data, error } = await admin.from('replies').select('id, reviews!left(id)')
    .in('brand_id', brandIds).eq('reviews.reviewer_id', u.id).is('reviews', null)
    .order('sent_at', { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// GET /api/brands/[slug]/replies. Leads see every reply in a member brand,
// specialists only their own.
export async function listBrandReplies(slug: string) {
  const u = await requireUser();
  const brand = await resolveMemberBrand(u.id, slug);
  let q = admin.from('replies').select(REPLY_COLUMNS)
    .eq('brand_id', brand.id).order('sent_at', { ascending: false }).limit(PAGE_SIZE);
  if (u.role === 'specialist') q = q.eq('specialist_id', u.id);
  const { data, error } = await q;
  if (error) throw error;
  return { brand: brand.slug, replies: data };
}
