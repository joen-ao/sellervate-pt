# 05 · Brand trends
Branch `feat/brand-trends` · No migration · Est. 40 min · Wave 2

## 1. Product
"I would rather show them the number than say the sentence." One page per brand the lead opens in the meeting.

- Route `/brands/[slug]`: team lead with membership; specialists never.
- Headline numbers (30 d vs prior 30 d): avg score, reviews, critical count, deltas.
- Trend: avg score per ISO week, last 8 weeks, inline SVG bars.
- "What we keep getting wrong": categories by frequency (30 d).
- Critical events: list, newest first, link to review.
- By specialist: avg + critical count (lead-only).
- Out: printable report (P5), cross-brand comparison, external metrics.

## 2. Technical plan

### Files
```
lib/data/brand-stats.ts
app/brands/[slug]/page.tsx  loading.tsx  error.tsx
app/brands/[slug]/_components/{StatCards,TrendChart,CategoryList,CriticalList,SpecialistTable}.tsx
```

### Aggregation in SQL — one RPC, not five queries reduced in JS
Migration-free: use `admin.rpc` on a function created in **this branch's** migration? That would need a slot. Decision: allow a small migration `0001_2_brand_stats_fn.sql` (sorted after 0001, before 0002) containing only functions, no tables. Say so in the PR body.

```sql
create or replace function brand_stats(p_brand_id uuid, p_days int default 30)
returns jsonb language sql stable as $$
with base as (
  select v.*, r.specialist_id, r.sent_at
  from reviews v join replies r on r.id = v.reply_id
  where r.brand_id = p_brand_id
),
cur as (select * from base where created_at >= now() - (p_days || ' days')::interval),
prev as (select * from base where created_at <  now() - (p_days || ' days')::interval
                             and created_at >= now() - (2*p_days || ' days')::interval)
select jsonb_build_object(
  'current', jsonb_build_object('avg', round(avg(score),2), 'n', count(*),
                                'critical', count(*) filter (where severity='critical')),
  'previous', (select jsonb_build_object('avg', round(avg(score),2), 'n', count(*),
                                'critical', count(*) filter (where severity='critical')) from prev),
  'weekly', (select coalesce(jsonb_agg(jsonb_build_object('week', w, 'avg', a, 'n', n) order by w), '[]')
             from (select date_trunc('week', created_at) w, round(avg(score),2) a, count(*) n
                   from base where created_at >= now() - interval '8 weeks' group by 1) t),
  'categories', (select coalesce(jsonb_agg(jsonb_build_object('category', c, 'n', n) order by n desc), '[]')
                 from (select unnest(categories) c, count(*) n from cur group by 1) t),
  'critical_events', (select coalesce(jsonb_agg(jsonb_build_object(
                        'review_id', id, 'reply_id', reply_id, 'specialist_id', specialist_id,
                        'created_at', created_at, 'comment', left(comment, 140)) order by created_at desc), '[]')
                      from cur where severity='critical'),
  'by_specialist', (select coalesce(jsonb_agg(jsonb_build_object(
                        'specialist_id', specialist_id, 'avg', a, 'n', n, 'critical', c) order by a), '[]')
                    from (select specialist_id, round(avg(score),2) a, count(*) n,
                                 count(*) filter (where severity='critical') c from cur group by 1) t)
) from cur;
$$;
```

### `lib/data/brand-stats.ts`
```ts
export type BrandStats = { /* typed mirror of the jsonb above, with specialist names joined */ };

export async function getBrandStats(slug: string): Promise<{ brand: BrandSummary; stats: BrandStats }> {
  const u = await requireRole('team_lead');
  const brand = await resolveMemberBrand(u.id, slug);           // 403/404 first
  const { data, error } = await admin.rpc('brand_stats', { p_brand_id: brand.id, p_days: 30 });
  if (error) throw error;
  const raw = BrandStatsSchema.parse(data);                       // zod: never trust jsonb shape blindly
  // resolve specialist names in one query
  const ids = [...new Set([...raw.by_specialist, ...raw.critical_events].map(x => x.specialist_id))];
  const { data: people } = await admin.from('profiles').select('id, full_name').in('id', ids);
  return { brand, stats: hydrate(raw, people ?? []) };
}
```
Why not put the membership check inside the SQL function: RLS (07) will do that layer; the DAL check keeps the 403 semantics consistent with every other page.

### Components
- `StatCards`: three cards; delta arrow; critical delta in `--color-critical` when > 0, neutral otherwise (never green for "fewer criticals" — a critical is never good news, it just went down).
- `TrendChart`: pure SVG, `viewBox="0 0 640 160"`, one bar per week, label = week start `dd MMM`, y from 1 to 5, gridlines at 3 and 4. Empty weeks render as a hairline with `n=0`. No chart library.
- `CategoryList`: ranked list with count and a proportional bar; labels from `CATEGORY_LABEL`.
- `CriticalList`: date · specialist · comment snippet → `/reviews/[reply_id]`.
- `SpecialistTable`: name, avg, n, critical; sorted worst first.
- Empty: `stats.current.n === 0` → `EmptyState` "No reviews for {brand} in the last 30 days. Reviews from the queue show up here." (Lume as Nuria hits this near-empty case with n=1 — good.)

## 3. Verify by hand
- `/brands/voltaire` as Marta: avg ≈ 3.2, critical 1, `Didn't check order history` in the category list, critical event links to 101.
- `/brands/kraftco`: different avg; `Off-brand tone` and `Correct but won't stop them…` at the top; Iker's 206 in critical events.
- `/brands/lume` as Marta → forbidden. As Nuria → renders with n=1.
- `/brands/voltaire` as Dani → forbidden.
- `select brand_stats('…0001')` in psql returns the same numbers as the page.

## 4. Review checklist
- Any aggregation in JS over a row list? (should be none beyond hydrating names)
- Membership resolved before the RPC?
- jsonb validated with zod?
- Week boundaries: `date_trunc('week')` (Monday) consistent with the label?
- Is "critical went down" rendered as neutral, not celebratory?
