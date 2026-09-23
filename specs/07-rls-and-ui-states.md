# 07 · RLS defence in depth + UI states pass
Branch `feat/rls-defense` (07a) and `feat/ui-states` (07b) · Migration `0002_rls.sql` · Est. 35 + 25 min · Wave 2 (07a) / Wave 3 (07b)

## 1. Product
Two things cheap now and expensive later: a second authorisation gate inside Postgres, and a sweep so every screen has designed empty/loading/error states.

RLS exists so a future direct DB consumer (ingester, report job, a bug in the DAL) still cannot cross brands. The DAL stays the primary gate.

Escape hatch: if wiring RLS into the request path passes 20 minutes, ship policies + proof SQL, leave the DAL on the admin client, and write in DECISIONS that RLS is defined and verified but not on the request path. Honest half-done item.

## 2. Technical plan — 07a RLS

### Mechanism
A transaction-scoped setting `app.current_user_id` read by a stable function. The DAL sets it inside the same transaction as the query, under a role without `bypassrls`. Session-scoped `SET` on a pooled connection would leak the previous user — this is the footgun the brief is fishing for.

### `supabase/migrations/0002_rls.sql`
```sql
-- role the app uses when RLS is on (service_role stays for seed/migrations only)
do $$ begin
  create role app_user nologin;
exception when duplicate_object then null; end $$;
grant usage on schema public to app_user;
grant select, insert, update on all tables in schema public to app_user;
grant usage on all sequences in schema public to app_user;
grant execute on all functions in schema public to app_user;
grant app_user to authenticated;   -- lets `set local role authenticated` work in proofs

create or replace function current_app_user_id()
returns uuid language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

create or replace function current_app_role()
returns user_role language sql stable as $$
  select role from profiles where id = (select current_app_user_id());
$$;

create or replace function is_brand_member(p_brand_id uuid)
returns boolean language sql stable as $$
  select exists (select 1 from brand_members
                 where brand_id = p_brand_id and user_id = (select current_app_user_id()));
$$;

-- brands: members read
alter table brands enable row level security;
alter table brands force row level security;
drop policy if exists brands_member_select on brands;
create policy brands_member_select on brands for select
  using (is_brand_member(id));

-- brand_members: you see the rows of brands you belong to (needed for joins)
alter table brand_members enable row level security;
alter table brand_members force row level security;
drop policy if exists brand_members_select on brand_members;
create policy brand_members_select on brand_members for select
  using (is_brand_member(brand_id));

-- profiles: everyone can read names (needed for reviewer/specialist names); no writes
alter table profiles enable row level security;
alter table profiles force row level security;
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (true);

-- replies: leads see member brands; specialists only own in member brands
alter table replies enable row level security;
alter table replies force row level security;
drop policy if exists replies_select on replies;
create policy replies_select on replies for select
  using (
    is_brand_member(brand_id)
    and ((select current_app_role()) = 'team_lead' or specialist_id = (select current_app_user_id()))
  );

-- reviews: leads see reviews on member-brand replies; specialists on own replies; insert only leads on member brands; update (ack) only owner specialist
alter table reviews enable row level security;
alter table reviews force row level security;
drop policy if exists reviews_select on reviews;
create policy reviews_select on reviews for select
  using (exists (select 1 from replies r where r.id = reply_id));   -- delegates to replies policy
drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews for insert
  with check (
    reviewer_id = (select current_app_user_id())
    and (select current_app_role()) = 'team_lead'
    and exists (select 1 from replies r where r.id = reply_id and is_brand_member(r.brand_id))
  );
drop policy if exists reviews_update_ack on reviews;
create policy reviews_update_ack on reviews for update
  using (exists (select 1 from replies r where r.id = reply_id and r.specialist_id = (select current_app_user_id())))
  with check (exists (select 1 from replies r where r.id = reply_id and r.specialist_id = (select current_app_user_id())));

-- entry point the DAL uses: sets user for this transaction only
create or replace function set_app_user(p_user_id uuid)
returns void language sql as $$
  select set_config('app.current_user_id', p_user_id::text, true);
$$;
```
Notes: `current_setting(..., true)` (missing-ok) avoids the `22P02` error when the setting is unset; functions are wrapped in `(select …)` so the planner caches them per statement; `force row level security` makes the table owner subject to policies too.

### Wiring into the request path (`lib/supabase/rls.ts`)
PostgREST runs each request in its own transaction, so `set_config(…, true)` cannot be shared across two REST calls. Two options; pick one, document it:

**Option A (chosen): direct Postgres connection for the DAL.**
```ts
import 'server-only';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL_APP!, { max: 5 });   // connects as a login role that is a member of app_user, no bypassrls

export async function asUser<T>(userId: string, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async tx => {
    await tx`select set_config('app.current_user_id', ${userId}, true)`;
    await tx`set local role app_user`;
    return fn(tx);
  });
}
```
DAL functions that already exist keep their signatures; internally they switch from `admin.from(...)` to `asUser(u.id, tx => tx\`select …\`)` for reads. Migration adds a login role: `create role app_login login password '…' in role app_user;` in local only, documented in README (`DATABASE_URL_APP`).

**Option B: keep supabase-js, add an RPC per read** (`queue_items`, `brand_stats`, …) that calls `set_app_user` first and selects in the same function body. Less wiring, more SQL. Choose B if the agent has Option A stuck after 15 minutes.

Either way: `admin` (service role) remains only for seed, `getCurrentUser()` profile lookup, and the switcher.

### Proof (README + `scripts/rls-proof.sql`)
```sql
begin;
select set_app_user('00000000-0000-0000-0000-000000000021');   -- Dani
set local role app_user;
select count(*) as should_be_0 from replies where brand_id = '00000000-0000-0000-0000-000000000003'; -- Lume
select count(*) as should_be_6_dani_only from replies where specialist_id <> '00000000-0000-0000-0000-000000000021';
-- expect 0 too: a specialist cannot see other specialists even in own brands
select count(*) as reviews_visible from reviews;  -- 6
rollback;

begin;
select set_app_user('00000000-0000-0000-0000-000000000011');   -- Marta
set local role app_user;
select count(*) from replies where brand_id = '00000000-0000-0000-0000-000000000003'; -- 0 (not member of Lume)
select count(*) from replies;                                                        -- 17 (Voltaire + Kraft&Co)
rollback;
```
Run with `psql "$DB_URL" -f scripts/rls-proof.sql`.

## 2. Technical plan — 07b UI states pass
Checklist per route: `/switch-needed`, `/queue`, `/reviews/[id]`, `/brands/[slug]`, `/me`:
- `loading.tsx` exists, skeleton matches real layout heights.
- `error.tsx` exists, uses `ErrorCard` with `reset()`.
- Empty state uses `EmptyState` with a real sentence and a next action.
- Forbidden/not-found render `StatePage`, not Next defaults (`app/forbidden.tsx`, `app/not-found.tsx`, `experimental.authInterrupts`).
- Dark/light: daisyUI theme tokens only; no raw hex in components (`grep -rn "#[0-9a-f]\{6\}" app components` → only `DESIGN.md` and theme file).

### `DESIGN.md` (≤ 25 lines) and daisyUI theme
```css
@plugin "daisyui/theme" {
  name: "sellervate-qa"; default: true; color-scheme: dark;
  --color-base-100: oklch(15% 0.01 260);   /* canvas */
  --color-base-200: oklch(19% 0.01 260);   /* raised surface */
  --color-base-300: oklch(26% 0.01 260);   /* hairline */
  --color-base-content: oklch(93% 0.005 260);
  --color-primary: oklch(62% 0.16 275);    /* one indigo, actions only */
  --color-success: oklch(70% 0.14 150);    /* score 4–5 */
  --color-warning: oklch(78% 0.14 80);     /* score 3, minor */
  --color-error:   oklch(62% 0.20 25);     /* critical ONLY */
  --radius-box: 0.5rem; --radius-field: 0.375rem;
}
```
Type: Inter via `next/font`, scale 12/14/16/20/28, weights 400/500/600. Rule: red = "this can cost the account", nowhere else.

## 3. Verify by hand
- `supabase db reset` twice (policies idempotent).
- `psql -f scripts/rls-proof.sql` matches expected counts.
- Break the DAL on purpose (remove `.eq('specialist_id', u.id)` in `/api/me/reviews` locally) → RLS still returns only Dani's rows. Put it back. Mention this experiment in DECISIONS: that is what defence in depth means.
- Walk all five routes as Marta, Nuria, Dani, Iker; screenshot each empty state for `docs/`.

## 4. Review checklist
- Any `current_setting` without missing-ok? Any function not in a subselect?
- Does seed still run (service role bypasses RLS; `force` does not affect superuser/service role)?
- Does the login role lack `bypassrls`? (`select rolbypassrls from pg_roles where rolname='app_login'` → f)
- Is the `set_config` inside `begin … commit` and is `set local role` used, never `set role`?
- Any raw hex colour in components?
