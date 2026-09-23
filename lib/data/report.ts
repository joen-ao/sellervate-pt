import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { admin } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/current-user';
import { resolveMemberBrand } from '@/lib/data/membership';
import type { Week } from '@/lib/data/brand-stats';
import { CATEGORY_LABEL, FAILURE_CATEGORIES, type FailureCategory } from '@/lib/types';

const DAY = 86_400_000;
export const DEFAULT_DAYS = 90;
export const MAX_DAYS = 366;
export const NOTE_MAX = 2000;

// Whole UTC days, both ends inclusive. from < to, at most MAX_DAYS apart.
export const PeriodInput = z.object({ from: z.iso.date(), to: z.iso.date() })
  .refine(p => p.from < p.to, { message: '"from" must be before "to".' })
  .refine(p => (Date.parse(p.to) - Date.parse(p.from)) / DAY <= MAX_DAYS,
    { message: `A report covers at most ${MAX_DAYS} days.` });
export type Period = z.infer<typeof PeriodInput>;

const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

// No params → the last DEFAULT_DAYS days ending today. Anything else is validated.
export function parsePeriod(from?: string, to?: string) {
  if (!from && !to) {
    const today = Date.now();
    return { success: true as const, data: { from: isoDay(today - (DEFAULT_DAYS - 1) * DAY), to: isoDay(today) } };
  }
  return PeriodInput.safeParse({ from, to });
}

// The RPC's shape, strict: an extra key (say, a specialist id) fails the parse
// instead of riding along to the page.
const ReportJson = z.strictObject({
  avg: z.number().nullable(),
  n: z.number().int(),
  critical: z.number().int(),
  prev_n: z.number().int(),
  weekly: z.array(z.strictObject({ start: z.string(), avg: z.number().nullable(), n: z.number().int() })),
  improved: z.array(z.strictObject({
    category: z.enum(FAILURE_CATEGORIES), prev_pct: z.number(), cur_pct: z.number(),
  })).max(3),
});

export type Improvement = { category: FailureCategory; label: string; before: number; now: number };
export type WorkingOn = { text: string; carriedFrom: Period | null };
// Everything the report page gets. No person appears in it: no names, no ids.
export type BrandReport = {
  brand: { name: string; slug: string };
  period: Period;
  current: { avg: number | null; n: number; critical: number; addressed: number | null };
  hasPreviousPeriod: boolean;
  weekly: Week[];
  improved: Improvement[];
  workingOn: WorkingOn;
};

async function requireLeadOf(slug: string) {
  const u = await requireRole('team_lead');
  return { user: u, brand: await resolveMemberBrand(u.id, slug) };
}

export async function getBrandReport(slug: string, period: Period): Promise<BrandReport> {
  const { brand } = await requireLeadOf(slug);

  const [rpc, workingOn, addressed] = await Promise.all([
    admin.rpc('brand_report', { p_brand_id: brand.id, p_from: period.from, p_to: period.to }),
    getWorkingOn(brand.id, period),
    countAddressed(brand.id, period),
  ]);
  if (rpc.error) throw rpc.error;
  const r = ReportJson.parse(rpc.data);

  return {
    brand: { name: brand.name, slug: brand.slug },
    period,
    current: { avg: r.avg, n: r.n, critical: r.critical, addressed },
    hasPreviousPeriod: r.prev_n > 0,
    weekly: r.weekly,
    improved: r.improved.map(i => ({
      category: i.category, label: CATEGORY_LABEL[i.category], before: i.prev_pct, now: i.cur_pct,
    })),
    workingOn,
  };
}

// The note for exactly this period; failing that, the latest non-empty note of
// the brand, marked as carried over (the default period moves every day).
async function getWorkingOn(brandId: string, period: Period): Promise<WorkingOn> {
  const exact = await admin.from('brand_report_notes').select('working_on')
    .eq('brand_id', brandId).eq('period_start', period.from).eq('period_end', period.to)
    .maybeSingle();
  if (exact.error) throw exact.error;
  if (exact.data) return { text: exact.data.working_on, carriedFrom: null };

  const { data: latest, error } = await admin.from('brand_report_notes')
    .select('period_start, period_end, working_on')
    .eq('brand_id', brandId).neq('working_on', '')
    .order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return latest
    ? { text: latest.working_on, carriedFrom: { from: latest.period_start, to: latest.period_end } }
    : { text: '', carriedFrom: null };
}

// "Addressed: N" needs P3's alert acknowledgements, which may not be merged.
// Feature-detected at runtime: a missing table (or a schema that differs from
// the assumed brand_id / acknowledged_at) omits the number instead of failing.
async function countAddressed(brandId: string, period: Period): Promise<number | null> {
  try {
    const untyped = admin as unknown as SupabaseClient;
    const { count, error } = await untyped.from('alert_acknowledgements')
      .select('brand_id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .gte('acknowledged_at', period.from)
      .lt('acknowledged_at', isoDay(Date.parse(period.to) + DAY));
    return error ? null : count;
  } catch {
    return null;
  }
}

export async function saveWorkingOn(slug: string, period: Period, text: string): Promise<void> {
  const { user, brand } = await requireLeadOf(slug);
  const { error } = await admin.from('brand_report_notes').upsert({
    brand_id: brand.id, period_start: period.from, period_end: period.to,
    working_on: text, updated_by: user.id, updated_at: new Date().toISOString(),
  }, { onConflict: 'brand_id,period_start,period_end' });
  if (error) throw error;
}
