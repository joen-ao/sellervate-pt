-- 0002 · RLS: a second authorisation gate inside Postgres
-- Spec: specs/07-rls-and-ui-states.md (07a)
--
-- Who is subject to these policies: app_user, and app_login, the login role the
-- DAL's direct connection uses (lib/supabase/rls.ts). Who is not: postgres and
-- service_role, both BYPASSRLS in Supabase, so seed, migrations and the
-- supabase-js admin client behave exactly as before. BYPASSRLS wins over
-- FORCE ROW LEVEL SECURITY; FORCE only stops a non-bypass table owner.
--
-- Identity comes from app.current_user_id, set with set_config(..., true):
-- transaction-local, so a pooled connection cannot carry it to the next user.
--
-- Idempotent: roles are guarded (they are cluster-wide and survive db reset),
-- functions are "create or replace", every policy is dropped before created.

-- roles ---------------------------------------------------------------------
do $$ begin
  create role app_user nologin noinherit;
exception when duplicate_object then null; end $$;

-- LOCAL-ONLY credential for DATABASE_URL_APP. A hosted environment must rotate
-- it (alter role app_login password '<secret>') before anything connects.
-- noinherit: without `set local role app_user` it can read nothing at all, so
-- forgetting the role switch fails loudly instead of falling back to anything.
do $$ begin
  create role app_login login noinherit password 'app_login_local';
exception when duplicate_object then null; end $$;
grant app_user to app_login;
-- postgres is not a superuser in Supabase, and since PG16 creating a role does
-- not let you SET ROLE to it. This lets psql as postgres run
-- scripts/rls-proof.sql; inherit false, so postgres gains no privileges from it.
grant app_user to postgres with inherit false, set true;

-- privileges: read everything the policies allow, write only what V1 writes
grant usage on schema public to app_user;
grant select on brands, profiles, brand_members, replies, reviews, reply_with_review to app_user;
grant insert on reviews to app_user;
grant update (acknowledged_at) on reviews to app_user;   -- ack only; score etc. stay immutable

-- helpers -------------------------------------------------------------------
-- missing-ok current_setting: unset is NULL, not error 22P02. After a
-- transaction ends the setting reads '' (not NULL) on that session, hence nullif.
create or replace function current_app_user_id()
returns uuid language sql stable set search_path = public as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- security definer (owner postgres, BYPASSRLS): these read profiles and
-- brand_members, and brand_members' own policy calls is_brand_member — as
-- invoker that would recurse forever. They only ever answer about the
-- current app user, so running them as owner leaks nothing.
create or replace function current_app_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = (select current_app_user_id());
$$;

create or replace function is_brand_member(p_brand_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from brand_members
                 where brand_id = p_brand_id and user_id = (select current_app_user_id()));
$$;

-- entry point for a caller without direct set_config (e.g. an RPC): this transaction only
create or replace function set_app_user(p_user_id uuid)
returns void language sql set search_path = public as $$
  select set_config('app.current_user_id', p_user_id::text, true);
$$;

-- Supabase's default privileges hand every new function to anon/authenticated,
-- which PostgREST would expose as /rpc/*. Only app_user needs these.
revoke execute on function current_app_user_id(), current_app_role(),
  is_brand_member(uuid), set_app_user(uuid) from public, anon, authenticated;
grant execute on function current_app_user_id(), current_app_role(),
  is_brand_member(uuid), set_app_user(uuid) to app_user;

-- policies ------------------------------------------------------------------
-- Zero-argument helpers are wrapped in (select ...) so the planner evaluates
-- them once per statement; is_brand_member(col) depends on the row, so a
-- subselect could not cache it and it stays a plain call.
-- Every policy is "to app_user". anon and authenticated keep Supabase's default
-- table grants but get no policy, so with RLS on they now read nothing.

-- brands: members read
alter table brands enable row level security;
alter table brands force row level security;
drop policy if exists brands_member_select on brands;
create policy brands_member_select on brands for select to app_user
  using (is_brand_member(id));

-- brand_members: you see the rows of brands you belong to (needed for joins)
alter table brand_members enable row level security;
alter table brand_members force row level security;
drop policy if exists brand_members_select on brand_members;
create policy brand_members_select on brand_members for select to app_user
  using (is_brand_member(brand_id));

-- profiles: names are readable (reviewer/specialist names); no writes
alter table profiles enable row level security;
alter table profiles force row level security;
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to app_user using (true);

-- replies: leads see member brands; specialists only their own, in member brands
alter table replies enable row level security;
alter table replies force row level security;
drop policy if exists replies_select on replies;
create policy replies_select on replies for select to app_user
  using (
    is_brand_member(brand_id)
    and ((select current_app_role()) = 'team_lead'
         or specialist_id = (select current_app_user_id()))
  );

-- reviews: visible iff the reply is visible (the subquery runs under replies' policy)
alter table reviews enable row level security;
alter table reviews force row level security;
drop policy if exists reviews_select on reviews;
create policy reviews_select on reviews for select to app_user
  using (exists (select 1 from replies r where r.id = reply_id));

-- insert: a lead, as themself, on a reply in a brand they belong to
drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews for insert to app_user
  with check (
    reviewer_id = (select current_app_user_id())
    and (select current_app_role()) = 'team_lead'
    and exists (select 1 from replies r
                where r.id = reply_id and is_brand_member(r.brand_id))
  );

-- update (acknowledge): only the specialist who wrote the reply; the column
-- grant above limits the update to acknowledged_at
drop policy if exists reviews_update_ack on reviews;
create policy reviews_update_ack on reviews for update to app_user
  using (exists (select 1 from replies r
                 where r.id = reply_id and r.specialist_id = (select current_app_user_id())))
  with check (exists (select 1 from replies r
                      where r.id = reply_id and r.specialist_id = (select current_app_user_id())));

-- the view: owned by postgres (BYPASSRLS), so by default it would read the
-- base tables as postgres and skip every policy above. security_invoker makes
-- it read them as the caller. A later "create or replace view" must keep this.
alter view reply_with_review set (security_invoker = true);
