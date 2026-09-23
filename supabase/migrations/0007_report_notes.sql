-- 0007 · client-facing report: the lead's note per period + one aggregate RPC
-- Spec: specs/plus/P5-client-report.md
-- Idempotent: "if not exists" table, policy dropped before created,
-- "create or replace" function, grants/revokes are repeatable.

-- "What we are working on": one note per brand and exact period.
create table if not exists brand_report_notes (
  brand_id uuid not null references brands(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  working_on text not null default '' check (char_length(working_on) <= 2000),
  updated_by uuid not null references profiles(id),
  updated_at timestamptz not null default now(),
  primary key (brand_id, period_start, period_end),
  constraint brand_report_notes_period check (period_start < period_end)
);

alter table brand_report_notes enable row level security;
alter table brand_report_notes force row level security;
-- no delete: a note is emptied, not removed
grant select, insert, update on brand_report_notes to app_user;

-- A lead member of the brand reads and writes; a write must be signed by the
-- current user. Any lead of the brand may overwrite the note (last writer wins).
drop policy if exists report_notes_lead on brand_report_notes;
create policy report_notes_lead on brand_report_notes for all to app_user
  using ((select current_app_role()) = 'team_lead' and is_brand_member(brand_id))
  with check ((select current_app_role()) = 'team_lead' and is_brand_member(brand_id)
              and updated_by = (select current_app_user_id()));

-- The whole report in one round trip. Returns aggregates only: no reviewer,
-- specialist, reply id or comment ever leaves this function.
--
-- security INVOKER, unlike 0002's helpers: it reads reviews/replies, whose
-- policies call the definer helpers, so there is no recursion to break. As
-- invoker, app_user gets only the rows RLS lets it see (a non-member gets
-- zeros); as definer it would hand any brand's numbers to anyone with execute.
-- The app calls it as service_role (BYPASSRLS), so the DAL checks lead +
-- membership before calling it.
--
-- Periods are whole UTC days, [p_from, p_to] inclusive. The previous period is
-- the same number of days immediately before p_from.
create or replace function brand_report(p_brand_id uuid, p_from date, p_to date)
returns jsonb language sql stable security invoker set search_path = public as $$
with bounds as (
  select (p_from::timestamp at time zone 'UTC') as cur_from,
         ((p_to + 1)::timestamp at time zone 'UTC') as cur_to,
         ((p_from - (p_to - p_from + 1))::timestamp at time zone 'UTC') as prev_from
),
scoped as (
  select v.score, v.severity, v.categories, v.created_at, v.created_at >= b.cur_from as is_cur
  from reviews v join replies r on r.id = v.reply_id cross join bounds b
  where r.brand_id = p_brand_id and v.created_at >= b.prev_from and v.created_at < b.cur_to
),
cur as (select score, severity, categories, created_at from scoped where is_cur),
prev as (select categories from scoped where not is_cur),
totals as (select (select count(*) from cur) as cur_n, (select count(*) from prev) as prev_n),
cc as (select c, count(*) as n from cur, unnest(categories) c group by c),
pc as (select c, count(*) as n from prev, unnest(categories) c group by c),
-- share of reviews flagged with the category, in % of that period's reviews
rates as (
  select coalesce(pc.c, cc.c) as c,
         round(100.0 * coalesce(pc.n, 0) / nullif(t.prev_n, 0), 1) as prev_pct,
         round(100.0 * coalesce(cc.n, 0) / nullif(t.cur_n, 0), 1) as cur_pct
  from pc full join cc on cc.c = pc.c cross join totals t
),
weeks as (
  select w from generate_series(date_trunc('week', p_from::timestamp),
                                date_trunc('week', p_to::timestamp), interval '1 week') w
)
select jsonb_build_object(
  'avg', (select round(avg(score), 2) from cur),
  'n', (select cur_n from totals),
  'critical', (select count(*) from cur where severity = 'critical'),
  'prev_n', (select prev_n from totals),
  'weekly', (select coalesce(jsonb_agg(jsonb_build_object(
                 'start', w at time zone 'UTC', 'avg', a, 'n', k) order by w), '[]'::jsonb)
             from (select wk.w, round(avg(cur.score), 2) as a, count(cur.score) as k
                   from weeks wk
                   left join cur on date_trunc('week', cur.created_at at time zone 'UTC') = wk.w
                   group by wk.w) t),
  'improved', (select coalesce(jsonb_agg(jsonb_build_object(
                   'category', c, 'prev_pct', prev_pct, 'cur_pct', cur_pct) order by d desc, c), '[]'::jsonb)
               from (select c, prev_pct, cur_pct, prev_pct - cur_pct as d from rates
                     where prev_pct > cur_pct
                     order by d desc, c limit 3) t)
);
$$;

revoke execute on function brand_report(uuid, date, date) from public, anon, authenticated;
grant execute on function brand_report(uuid, date, date) to app_user, service_role;
