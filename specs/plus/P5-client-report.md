# P5 · Client-facing report
Branch `feat/client-report` · Migration `0007_report_notes.sql` · Est. 30–45 min · Depends on 05

## 1. Product
"I would rather show them the number than say the sentence." `/brands/[slug]` is the lead's working view; the meeting needs a version with nothing internal.

- `/brands/[slug]/report?from&to` (default: last 90 days). Brand name, period, small wordmark.
- Three numbers: avg quality, replies reviewed, critical issues (with "addressed: N" from P3 acks if present).
- Weekly trend; **Top three things we improved** (category frequency drop vs previous period, from data); **What we are working on** (lead-written note per period).
- Strips every person: no names, no per-specialist table, no comments.
- `@media print` → "Save as PDF" is the export.
- Lead with membership only. Public tokenised link is V3.

## 2. Technical plan

### Migration `0007_report_notes.sql`
```sql
create table if not exists brand_report_notes (
  brand_id uuid not null references brands(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  working_on text not null default '',
  updated_by uuid not null references profiles(id),
  updated_at timestamptz not null default now(),
  primary key (brand_id, period_start, period_end)
);
alter table brand_report_notes enable row level security; alter table brand_report_notes force row level security;
create policy report_notes_lead on brand_report_notes for all
  using ((select current_app_role())='team_lead' and is_brand_member(brand_id))
  with check ((select current_app_role())='team_lead' and is_brand_member(brand_id) and updated_by=(select current_app_user_id()));

create or replace function brand_report(p_brand_id uuid, p_from date, p_to date)
returns jsonb language sql stable as $$
with cur as (select v.* from reviews v join replies r on r.id=v.reply_id
             where r.brand_id=p_brand_id and v.created_at >= p_from and v.created_at < p_to + 1),
     prev as (select v.* from reviews v join replies r on r.id=v.reply_id
              where r.brand_id=p_brand_id and v.created_at >= p_from - (p_to - p_from) and v.created_at < p_from),
     cc as (select unnest(categories) c, count(*) n from cur group by 1),
     pc as (select unnest(categories) c, count(*) n from prev group by 1)
select jsonb_build_object(
  'avg', (select round(avg(score),2) from cur), 'n', (select count(*) from cur),
  'critical', (select count(*) filter (where severity='critical') from cur),
  'weekly', (select coalesce(jsonb_agg(jsonb_build_object('week', w, 'avg', a) order by w),'[]')
             from (select date_trunc('week', created_at) w, round(avg(score),2) a from cur group by 1) t),
  'improved', (select coalesce(jsonb_agg(jsonb_build_object('category', c, 'delta', d) order by d desc),'[]')
               from (select coalesce(pc.c, cc.c) c, coalesce(pc.n,0) - coalesce(cc.n,0) d
                     from pc full join cc on cc.c = pc.c) t where d > 0 limit 3)
);
$$;
```

### Files
```
lib/data/report.ts           # getBrandReport(slug, from, to), saveWorkingOn(...)
app/brands/[slug]/report/page.tsx  actions.ts  print.css
app/brands/[slug]/report/_components/{ReportHeader,ReportNumbers,ImprovedList,WorkingOnForm}.tsx
```
`getBrandReport`: `requireRole('team_lead')` + `resolveMemberBrand` → `rpc('brand_report')` → zod → plus note lookup → plus (if P3 merged) count of `alert_acknowledgements` in period. Feature-detect P3 by checking `database.types.ts` at build time — simpler: a `try` around the query; if the table is missing the count is omitted. Say so in PR.

### UI
Light print theme forced on this route (`data-theme="sellervate-print"`, a light variant of the tokens). Layout fits one A4: header, three numbers, chart, two columns (improved / working on). `WorkingOnForm` hidden in print. `TrendChart` reused from 05.
Empty states: no previous period → "First period on record" instead of the improved list; `n=0` → "No reviews in this period."

## 3. Verify by hand
- `/brands/voltaire/report` as Marta renders; Ctrl+P preview is one page; no specialist names anywhere (`grep -c "Dani" page-source` → 0).
- Save "What we are working on" → persists; Nuria for Lume gets her own note.
- `/brands/lume/report` as Marta → 403; as Dani → 403.
- `?from=2020-01-01&to=2020-02-01` → "No reviews in this period."

## 4. Review checklist
- Payload contains no specialist ids or names (check the DAL return type, not the JSX)?
- Date params validated (`from < to`, max 366 days)?
- Print stylesheet hides the form and the switcher?
- Note upsert scoped by `updated_by = me` in RLS?
