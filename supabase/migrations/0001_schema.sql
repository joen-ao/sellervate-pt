-- 0001 · schema for the reply-review system of record
-- Spec: specs/01-data-model-and-seed.md
-- Idempotent throughout: enum creation is guarded, every table/index uses
-- "if not exists", the view uses "create or replace".

-- enums (idempotent)
do $$ begin
  create type user_role as enum ('specialist', 'team_lead');
exception when duplicate_object then null; end $$;
do $$ begin
  create type reply_channel as enum ('email', 'amazon', 'shopify', 'walmart');
exception when duplicate_object then null; end $$;
do $$ begin
  create type review_severity as enum ('none', 'minor', 'critical');
exception when duplicate_object then null; end $$;
do $$ begin
  create type failure_category as enum (
    'wrong_facts', 'tone_off_brand', 'answered_wrong_question',
    'too_slow', 'no_order_history_check', 'incomplete');
exception when duplicate_object then null; end $$;

-- the client whose voice the lead judges against
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  voice_guidelines text not null,
  created_at timestamptz not null default now()
);

-- people; role here is the default, per-brand role lives in brand_members
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role user_role not null,
  created_at timestamptz not null default now()
);

-- many-to-many: who covers which brand, and as what
create table if not exists brand_members (
  brand_id uuid not null references brands(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  primary key (brand_id, user_id)
);
-- the pk already indexes brand_id first; this covers the user_id direction
create index if not exists brand_members_user_idx on brand_members (user_id);

-- a reply that already went out. Read-only in V1.
-- source/external_id/channel exist so ingestion (P4) is idempotent from day one.
create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id),
  specialist_id uuid not null references profiles(id),
  customer_message text not null,
  reply_text text not null,
  sent_at timestamptz not null,
  channel reply_channel not null default 'email',
  source text not null default 'seed',
  external_id text,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);
create index if not exists replies_brand_sent_idx on replies (brand_id, sent_at desc);
create index if not exists replies_specialist_sent_idx on replies (specialist_id, sent_at desc);

-- one lead's judgement on one reply. Immutable in V1: no update path.
-- severity is independent of score: a 4/5 can still carry a critical factual error.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references replies(id) on delete cascade,
  reviewer_id uuid not null references profiles(id),
  score smallint not null check (score between 1 and 5),
  severity review_severity not null default 'none',
  categories failure_category[] not null default '{}',
  comment text not null default '',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  unique (reply_id, reviewer_id),
  constraint critical_needs_category
    check (severity <> 'critical' or cardinality(categories) > 0)
);
create index if not exists reviews_reply_idx on reviews (reply_id);
create index if not exists reviews_reviewer_created_idx on reviews (reviewer_id, created_at desc);

-- helper used by 03/05/06: one row per reply with the current reviewer's review, if any
-- (kept as a view so DAL queries stay short; no security semantics here, DAL filters)
create or replace view reply_with_review as
select r.id, r.brand_id, r.specialist_id, r.customer_message, r.reply_text,
       r.sent_at, r.channel, r.source, r.external_id,
       v.id as review_id, v.reviewer_id, v.score, v.severity, v.categories,
       v.comment, v.created_at as reviewed_at, v.acknowledged_at
from replies r
left join reviews v on v.reply_id = r.id;
