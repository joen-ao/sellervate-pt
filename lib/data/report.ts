import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { admin } from '@/lib/supabase/admin';
import { asUser } from '@/lib/supabase/rls';
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
  const { user, brand } = await requireLeadOf(slug);

  // brand_report is security invoker: run as the user, RLS applies inside it too.
  const [[rpc], workingOn, addressed] = await Promise.all([
    asUser(user.id, tx => tx<{ report: unknown }[]>`
      select brand_report(${brand.id}, ${period.from}::date, ${period.to}::date) as report`),
    getWorkingOn(user.id, brand.id, period),
    countAddressed(brand.id, period),
  ]);
  const r = ReportJson.parse(rpc.report);

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
async function getWorkingOn(userId: string, brandId: string, period: Period): Promise<WorkingOn> {
  return asUser(userId, async tx => {
    const [exact] = await tx<{ working_on: string }[]>`
      select working_on from brand_report_notes
      where brand_id = ${brandId} and period_start = ${period.from}::date and period_end = ${period.to}::date`;
    if (exact) return { text: exact.working_on, carriedFrom: null };

    const [latest] = await tx<{ period_start: string; period_end: string; working_on: string }[]>`
      select period_start, period_end, working_on from brand_report_notes
      where brand_id = ${brandId} and working_on <> ''
      order by updated_at desc limit 1`;
    return latest
      ? { text: latest.working_on, carriedFrom: { from: latest.period_start, to: latest.period_end } }
      : { text: '', carriedFrom: null };
  });
}

// "Addressed: N" needs P3's alert acknowledgements, which may not be merged.
// Stays on the service-role client until P3 lands (a missing table inside
// asUser() would abort the transaction). Feature-detected at runtime: a missing table (or a schema that differs from
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
  // As the user: RLS's policy on brand_report_notes (lead, member, updated_by = me)
  // re-checks what requireLeadOf already did.
  await asUser(user.id, tx => tx`
    insert into brand_report_notes (brand_id, period_start, period_end, working_on, updated_by, updated_at)
    values (${brand.id}, ${period.from}::date, ${period.to}::date, ${text}, ${user.id}, now())
    on conflict (brand_id, period_start, period_end)
    do update set working_on = excluded.working_on, updated_by = excluded.updated_by, updated_at = now()`);
}
