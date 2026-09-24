-- RLS proof (spec 07a). Read-only: every block ends in rollback.
-- Run as postgres against the seeded local DB, e.g.
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/rls-proof.sql
-- Each block becomes app_user for one transaction, exactly as lib/supabase/rls.ts does.
-- The expected values are baked into the column names (own_replies_expect_12), and
-- they are the seed's numbers: run this against a freshly `db reset` database.
-- Review a reply in the UI first and the counts go up, which is the proof working.
-- No psql on the machine? docker exec -i supabase_db_sellervate-pt psql -U postgres -d postgres < this file
\set ON_ERROR_STOP off

\echo '--- Dani (specialist: Voltaire + Kraft&Co)'
begin;
select set_app_user('00000000-0000-0000-0000-000000000021');
set local role app_user;
select count(*) as lume_replies_expect_0 from replies
  where brand_id = '00000000-0000-0000-0000-000000000003';
select count(*) as others_replies_expect_0 from replies
  where specialist_id <> '00000000-0000-0000-0000-000000000021';
select count(*) as own_replies_expect_12 from replies;
select count(*) as reviews_expect_8 from reviews;
select count(*) as view_rows_expect_12 from reply_with_review;
select count(*) as brands_expect_2 from brands;
rollback;

\echo '--- Marta (lead: Voltaire + Kraft&Co)'
begin;
select set_app_user('00000000-0000-0000-0000-000000000011');
set local role app_user;
select count(*) as lume_replies_expect_0 from replies
  where brand_id = '00000000-0000-0000-0000-000000000003';
select count(*) as replies_expect_17 from replies;
select count(*) as reviews_expect_12 from reviews;
rollback;

\echo '--- no user set: nothing visible'
begin;
set local role app_user;
select count(*) as replies_expect_0 from replies;
select count(*) as reviews_expect_0 from reviews;
rollback;

\echo '--- writes: Marta reviews an unreviewed Voltaire reply (expect INSERT 0 1)'
begin;
select set_app_user('00000000-0000-0000-0000-000000000011');
set local role app_user;
insert into reviews (reply_id, reviewer_id, score)
  select r.id, '00000000-0000-0000-0000-000000000011', 4 from replies r
  where r.brand_id = '00000000-0000-0000-0000-000000000001'
    and not exists (select 1 from reviews v where v.reply_id = r.id)
  limit 1;
rollback;

\echo '--- ack: Dani acknowledges reviews of his own replies (expect UPDATE 8)'
begin;
select set_app_user('00000000-0000-0000-0000-000000000021');
set local role app_user;
update reviews set acknowledged_at = now();
rollback;

\echo '--- writes: Marta may not review a Lume reply (expect ERROR: new row violates row-level security policy)'
begin;
select set_app_user('00000000-0000-0000-0000-000000000011');
set local role app_user;
insert into reviews (reply_id, reviewer_id, score)
  values ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011', 4);
rollback;

\echo '--- writes: Dani may not review at all, even his own reply (expect ERROR)'
begin;
select set_app_user('00000000-0000-0000-0000-000000000021');
set local role app_user;
insert into reviews (reply_id, reviewer_id, score)
  values ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000021', 5);
rollback;

\echo '--- ack: Iker cannot acknowledge a review of Dani''s reply (expect UPDATE 0)'
begin;
select set_app_user('00000000-0000-0000-0000-000000000022');
set local role app_user;
update reviews set acknowledged_at = now()
  where reply_id = '00000000-0000-0000-0000-000000000101';
rollback;

\echo '--- ack: Dani can only touch acknowledged_at (expect ERROR: permission denied)'
begin;
select set_app_user('00000000-0000-0000-0000-000000000021');
set local role app_user;
update reviews set score = 5
  where reply_id = '00000000-0000-0000-0000-000000000101';
rollback;

\echo '--- the setting is transaction-local: after commit the same session sees nothing'
begin;
select set_app_user('00000000-0000-0000-0000-000000000011');
commit;
begin;
set local role app_user;
select current_app_user_id() as user_expect_null, count(*) as replies_expect_0 from replies;
rollback;
