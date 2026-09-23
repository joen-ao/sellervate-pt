-- 0006 · helpdesk ingestion: sources, unmatched rows, replies.ingested_at
-- Spec: specs/plus/P4-helpdesk-ingestion.md
--
-- Writes happen through the service-role client (lib/data/ingest.ts), which
-- bypasses RLS like the rest of the DAL today. RLS below is the second gate for
-- app_user, consistent with 0002: every policy is "to app_user", dropped before
-- created. Idempotent throughout.

-- A helpdesk (or the CSV upload) that feeds one brand. brand_id lives here, so
-- an ingested payload can never name its own brand.
create table if not exists ingest_sources (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  kind text not null check (kind in ('csv', 'gorgias', 'zendesk')),
  name text not null,
  config jsonb not null default '{}',   -- non-secret only (subdomain, field overrides)
  token_hash text,                      -- hex sha256 of the bearer; null for csv (UI-only)
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ingest_sources_brand_idx on ingest_sources (brand_id);

-- Items whose specialist email matched no profile. Kept, never dropped.
create table if not exists replies_unmatched (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references ingest_sources(id) on delete cascade,
  external_id text not null,
  payload jsonb not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (source_id, external_id)
);

-- Ingested rows carry source = ingest_sources.id::text; seed rows keep 'seed'.
-- reply_with_review names its columns, so this does not change the view.
alter table replies add column if not exists ingested_at timestamptz;

-- privileges: read-only for app_user, and not the token hash
grant select (id, brand_id, kind, name, config, last_synced_at, created_at)
  on ingest_sources to app_user;
grant select on replies_unmatched to app_user;

-- ingest_sources: leads of the brand
alter table ingest_sources enable row level security;
alter table ingest_sources force row level security;
drop policy if exists ingest_sources_lead on ingest_sources;
create policy ingest_sources_lead on ingest_sources for all to app_user
  using ((select current_app_role()) = 'team_lead' and is_brand_member(brand_id))
  with check ((select current_app_role()) = 'team_lead' and is_brand_member(brand_id));

-- replies_unmatched: visible iff its source is (the subquery runs under
-- ingest_sources' policy above, so this is leads-of-the-brand too)
alter table replies_unmatched enable row level security;
alter table replies_unmatched force row level security;
drop policy if exists replies_unmatched_lead on replies_unmatched;
create policy replies_unmatched_lead on replies_unmatched for select to app_user
  using (exists (select 1 from ingest_sources s
                 where s.id = source_id and is_brand_member(s.brand_id)));
