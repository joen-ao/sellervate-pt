import 'server-only';
import { cache } from 'react';
import { asUser } from '@/lib/supabase/rls';
import { requireRole, requireUser } from '@/lib/current-user';
import { getMemberBrandIds, resolveMemberBrand } from './membership';
import { PAGE_SIZE, hoursAgo } from './_shared';
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
  return asUser(u.id, tx => tx<QueueBrand[]>`
    select b.id, b.name, b.slug from brands b
    join brand_members m on m.brand_id = b.id and m.user_id = ${u.id}
    order by b.name`);
}

type QueueRow = Omit<QueueItem, 'review'> & {
  score: number | null; severity: Severity | null; acknowledgedAt: string | null; reviewed: boolean;
};

// "Reviewed" means reviewed by the current lead: the left join is scoped to
// reviewer_id, so "no row" is an anti-join on *their* review. Runs as the user
// under RLS (app_user); the brand and specialist filters stay in SQL here too.
export async function listQueue(f: QueueFilter): Promise<QueueResult> {
  const u = await requireRole('team_lead');
  const brandIds = await scopeBrandIds(u.id, f.brandSlug);
  if (brandIds.length === 0) return { items: [], total: 0, unreviewedTotal: 0, brands: [] };

  const since = hoursAgo(f.windowHours ?? QUEUE_WINDOW_HOURS);
  const [{ rows, total }, unreviewedTotal, brands] = await Promise.all([
    asUser(u.id, async tx => {
      const where = tx`
        from replies r
        join brands b on b.id = r.brand_id
        join profiles p on p.id = r.specialist_id
        left join reviews v on v.reply_id = r.id and v.reviewer_id = ${u.id}
        where r.brand_id in ${tx(brandIds)} and r.sent_at >= ${since}::timestamptz
          and (${f.status} = 'all' or (${f.status} = 'unreviewed') = (v.id is null))`;
      // A separate count, so a page past the end is an empty list, not an error.
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n ${where}`;
      const rows = await tx<QueueRow[]>`
        select r.id, b.name as "brandName", b.slug as "brandSlug", p.full_name as "specialistName",
               r.sent_at as "sentAt", left(r.customer_message, ${SNIPPET}) as "customerSnippet",
               left(r.reply_text, ${SNIPPET}) as "replySnippet",
               v.score, v.severity, v.acknowledged_at as "acknowledgedAt", v.id is not null as reviewed
        ${where}
        order by r.sent_at desc
        limit ${PAGE_SIZE} offset ${(f.page - 1) * PAGE_SIZE}`;
      return { rows, total: n };
    }),
    countUnreviewed(u.id, brandIds), listMemberBrands(),
  ]);

  return {
    items: rows.map(({ score, severity, acknowledgedAt, reviewed, ...item }) => ({
      ...item,
      review: reviewed ? { score: score!, severity: severity!, acknowledgedAt } : null,
    })),
    total, unreviewedTotal, brands,
  };
}

// Whole backlog, not just the 48 h window: the counter is what "Review next" drains.
async function countUnreviewed(userId: string, brandIds: string[]): Promise<number> {
  const [{ n }] = await asUser(userId, tx => tx<{ n: number }[]>`
    select count(*)::int as n from replies r
    where r.brand_id in ${tx(brandIds)}
      and not exists (select 1 from reviews v where v.reply_id = r.id and v.reviewer_id = ${userId})`);
  return n;
}

// Oldest reply the lead has not reviewed in their brands (optionally one). Null → caught up.
export async function nextUnreviewedReplyId(brandSlug?: string): Promise<string | null> {
  const u = await requireRole('team_lead');
  const brandIds = await scopeBrandIds(u.id, brandSlug);
  if (brandIds.length === 0) return null;
  const [row] = await asUser(u.id, tx => tx<{ id: string }[]>`
    select r.id from replies r
    where r.brand_id in ${tx(brandIds)}
      and not exists (select 1 from reviews v where v.reply_id = r.id and v.reviewer_id = ${u.id})
    order by r.sent_at asc limit 1`);
  return row?.id ?? null;
}

// GET /api/brands/[slug]/replies. Leads see every reply in a member brand,
// specialists only their own — filtered here in SQL, and again by RLS.
export async function listBrandReplies(slug: string) {
  const u = await requireUser();
  const brand = await resolveMemberBrand(u.id, slug);
  const replies = await asUser(u.id, tx => tx`
    select id, brand_id, specialist_id, customer_message, reply_text, sent_at, channel, source, external_id
    from replies
    where brand_id = ${brand.id} and (${u.role} = 'team_lead' or specialist_id = ${u.id})
    order by sent_at desc limit ${PAGE_SIZE}`);
  return { brand: brand.slug, replies };
}
