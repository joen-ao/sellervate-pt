# P3 · Pattern alerts per specialist
Branch `feat/pattern-alerts` · Migration `0005_alert_acks.sql` · Est. 60 min · Depends on 04

## 1. Product
"One of them was closing tickets without checking the order history for about a month. We found out because the brand found out." The data to catch it on day four is in `reviews`. SQL, not a model.

Rules (14-day window, per specialist per brand): ≥2 critical · same category ≥3 · avg <2.5 over ≥5 reviews.
- `/queue` header strip "N patterns need attention" → `/alerts`.
- `/alerts`: one card per (specialist, brand, rule) with links to the evidence; **Mark as talked about** records who and when.
- Specialists never see alerts.
- Model paragraph for DECISIONS: a model could pre-flag unreviewed replies resembling a known pattern so they jump the queue; needs a few hundred labelled reviews per brand, measured precision, and it only reorders — never scores.

## 2. Technical plan

### Migration `0005_alert_acks.sql`
```sql
create table if not exists alert_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id),
  specialist_id uuid not null references profiles(id),
  rule text not null check (rule in ('critical_x2','category_x3','avg_low')),
  rule_key text not null,            -- category name for category_x3, '' otherwise
  window_end timestamptz not null,   -- alerts recompute; an ack covers evidence up to this point
  acknowledged_by uuid not null references profiles(id),
  acknowledged_at timestamptz not null default now(),
  note text not null default ''
);
create index if not exists alert_acks_lookup on alert_acknowledgements (brand_id, specialist_id, rule, rule_key, window_end desc);
alter table alert_acknowledgements enable row level security;
alter table alert_acknowledgements force row level security;
create policy alert_acks_lead on alert_acknowledgements for all
  using ((select current_app_role())='team_lead' and is_brand_member(brand_id))
  with check ((select current_app_role())='team_lead' and is_brand_member(brand_id) and acknowledged_by=(select current_app_user_id()));

create or replace function pattern_alerts(p_brand_ids uuid[], p_days int default 14)
returns table (brand_id uuid, specialist_id uuid, rule text, rule_key text, evidence uuid[], latest timestamptz)
language sql stable as $$
with base as (
  select v.id, v.score, v.severity, v.categories, v.created_at, r.brand_id, r.specialist_id
  from reviews v join replies r on r.id = v.reply_id
  where r.brand_id = any(p_brand_ids) and v.created_at >= now() - (p_days||' days')::interval
),
crit as (select brand_id, specialist_id, 'critical_x2' rule, '' rule_key, array_agg(id) evidence, max(created_at) latest
         from base where severity='critical' group by 1,2 having count(*) >= 2),
cat as  (select brand_id, specialist_id, 'category_x3', c::text, array_agg(id), max(created_at)
         from base, unnest(categories) c group by 1,2,4 having count(*) >= 3),
low as  (select brand_id, specialist_id, 'avg_low', '', array_agg(id), max(created_at)
         from base group by 1,2 having count(*) >= 5 and avg(score) < 2.5)
select * from crit union all select * from cat union all select * from low;
$$;
```
Open alerts = `pattern_alerts(...)` minus rows with an acknowledgement whose `window_end >= latest`. Computed in the DAL with one extra query.

### Files
```
lib/data/alerts.ts           # listOpenAlerts(), acknowledgeAlert(input)
app/alerts/page.tsx loading.tsx error.tsx actions.ts
app/alerts/_components/{AlertCard,AckForm}.tsx
app/queue/_components/AlertStrip.tsx   # small server component added to QueuePage (coordinate after 03)
```
`acknowledgeAlert` validates `{brandId, specialistId, rule, ruleKey, windowEnd, note}` with zod, asserts membership, inserts. Idempotent by design (a later alert with newer evidence reopens).

### UI
Card: "{Specialist} · {Brand} — {human rule}" e.g. "Dani · Voltaire — 'Didn't check order history' ×3 in 14 days"; evidence as a row of score pills linking to reviews; note textarea + "Mark as talked about". Strip on queue: amber, count, link. Empty `/alerts`: "No patterns in the last 14 days across {brands}."

Seed: no extra rows needed if 01 seed gives Dani in Voltaire: reviews 101(critical), 104, 105 → not enough. Add `seed/alerts.sql`: two more Voltaire reviews for Dani with `no_order_history_check` (dated -4d, -6d) so `category_x3` fires. Reserve reply ids 110, 111.

## 3. Verify by hand
- Marta `/queue` shows strip "1 pattern needs attention"; `/alerts` shows Dani · Voltaire · category ×3 with three pills.
- Acknowledge with a note → disappears from strip; row exists in `alert_acknowledgements`.
- Add another matching review → alert reopens (latest > window_end).
- Nuria sees no alerts; Dani `/alerts` → 403.

## 4. Review checklist
- Rules live in SQL function only, thresholds not duplicated in TS?
- Ack insert asserts membership and `acknowledged_by = me`?
- Strip query cheap (single RPC + one lookup)?
