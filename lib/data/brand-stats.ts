import 'server-only';
import { cache } from 'react';
import { asUser } from '@/lib/supabase/rls';
import { requireRole } from '@/lib/current-user';
import { resolveMemberBrand } from '@/lib/data/membership';
import { CATEGORY_LABEL, type FailureCategory, type Severity } from '@/lib/types';

const DAY = 86_400_000;
export const WINDOW_DAYS = 30;
export const TREND_WEEKS = 8;

export type Period = { avg: number | null; n: number; critical: number };
export type Week = { start: string; avg: number | null; n: number };
export type CategoryCount = { category: FailureCategory; label: string; n: number };
export type CriticalEvent = {
  reviewId: string; replyId: string; specialist: string; createdAt: string; comment: string;
};
export type SpecialistRow = { specialistId: string; name: string; avg: number; n: number; critical: number };
export type BrandStats = {
  current: Period; previous: Period; weekly: Week[];
  categories: CategoryCount[]; criticalEvents: CriticalEvent[]; bySpecialist: SpecialistRow[];
};

type Row = {
  id: string; reply_id: string; score: number; severity: Severity;
  categories: FailureCategory[]; comment: string | null; created_at: string;
  reply: { brand_id: string; specialist_id: string; specialist: { full_name: string } | null };
};

const round2 = (x: number) => Math.round(x * 100) / 100;
const avgOf = (rs: Row[]) => (rs.length ? round2(rs.reduce((s, r) => s + r.score, 0) / rs.length) : null);
const period = (rs: Row[]): Period =>
  ({ avg: avgOf(rs), n: rs.length, critical: rs.filter(r => r.severity === 'critical').length });

// Monday 00:00 UTC — the same boundary as Postgres date_trunc('week') in a UTC session.
function mondayUtc(t: number): number {
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

// Team lead + member of the brand. Specialists get 403 even on their own brands
// (specs/00: brand stats "never"). cache(): the segment layout calls this first so
// a 403/404 is decided before loading.tsx starts streaming a 200; the page's call
// then reuses the result.
export const assertBrandStatsAccess = cache(async (slug: string) => {
  const u = await requireRole('team_lead');
  return { ...(await resolveMemberBrand(u.id, slug)), userId: u.id };
});

// Access is checked before a single review row is read.
export async function getBrandStats(slug: string) {
  const brand = await assertBrandStatsAccess(slug);

  const now = Date.now();
  const curFrom = now - WINDOW_DAYS * DAY;
  const prevFrom = now - 2 * WINDOW_DAYS * DAY;
  const firstWeek = mondayUtc(now) - (TREND_WEEKS - 1) * 7 * DAY;
  const since = Math.min(prevFrom, firstWeek);

  // One query, filtered by brand and time window in SQL, run as the user under
  // RLS. The join on replies is what scopes reviews to the brand.
  const data = await asUser(brand.userId, tx => tx<Row[]>`
    select v.id, v.reply_id, v.score, v.severity, v.categories, v.comment, v.created_at,
           json_build_object('brand_id', r.brand_id, 'specialist_id', r.specialist_id,
                             'specialist', json_build_object('full_name', p.full_name)) as reply
    from reviews v
    join replies r on r.id = v.reply_id
    left join profiles p on p.id = r.specialist_id
    where r.brand_id = ${brand.id} and v.created_at >= ${new Date(since).toISOString()}::timestamptz
    order by v.created_at desc`);

  const at = (r: Row) => Date.parse(r.created_at);
  const cur = data.filter(r => at(r) >= curFrom);
  const prev = data.filter(r => at(r) >= prevFrom && at(r) < curFrom);

  const weekly: Week[] = Array.from({ length: TREND_WEEKS }, (_, i) => {
    const start = firstWeek + i * 7 * DAY;
    const rs = data.filter(r => at(r) >= start && at(r) < start + 7 * DAY);
    return { start: new Date(start).toISOString(), avg: avgOf(rs), n: rs.length };
  });

  const catCounts = new Map<FailureCategory, number>();
  for (const r of cur) for (const c of r.categories) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  const categories = [...catCounts].map(([category, n]) => ({ category, label: CATEGORY_LABEL[category], n }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));

  const name = (r: Row) => r.reply.specialist?.full_name ?? 'Unknown';
  const criticalEvents: CriticalEvent[] = cur.filter(r => r.severity === 'critical').map(r => ({
    reviewId: r.id, replyId: r.reply_id, specialist: name(r), createdAt: r.created_at,
    comment: (r.comment ?? '').slice(0, 140),
  }));

  const bySpec = new Map<string, Row[]>();
  for (const r of cur) bySpec.set(r.reply.specialist_id, [...(bySpec.get(r.reply.specialist_id) ?? []), r]);
  const bySpecialist: SpecialistRow[] = [...bySpec].map(([specialistId, rs]) => ({
    specialistId, name: name(rs[0]), ...period(rs), avg: avgOf(rs)!,
  })).sort((a, b) => a.avg - b.avg || b.critical - a.critical);

  const stats: BrandStats = {
    current: period(cur), previous: period(prev), weekly, categories, criticalEvents, bySpecialist,
  };
  return { brand: { id: brand.id, name: brand.name, slug: brand.slug }, stats };
}
