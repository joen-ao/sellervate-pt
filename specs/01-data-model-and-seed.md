# 01 · Data model and seed
Branch `feat/schema-seed` · Migration `0001_schema.sql` · Est. 45–60 min · Wave 0

## 1. Product
Entities and relations that survive the product growing, plus seed data that makes the tool usable the moment it runs.

- **brands** — the client. `voice_guidelines` is the text the lead judges against.
- **profiles** — people. `role` is their default role; per-brand role lives in membership.
- **brand_members** — many-to-many; who covers which brand and as what.
- **replies** — a reply that already went out. Read-only in V1. Carries `source`/`external_id`/`channel` for future ingestion.
- **reviews** — one lead's judgement on one reply. Immutable in V1.

Decisions to defend:
- **Score (1–5) + severity + categories[]**, not a weighted rubric. Grows into `review_scores(review_id, criterion, value)` later without breaking anything.
- **`severity` independent of `score`.** A 4/5 can still contain a critical factual error; trends treat any `critical` as a red event.
- **`unique (reply_id, reviewer_id)`** — two leads may review the same reply (P1) with no migration.
- **`unique (source, external_id)`** — ingestion (P4) is idempotent from day one.
- **No `brand_id` on reviews** — derived via `replies`; one less thing to keep consistent.
- **Reviews immutable** — no update path; audit becomes `review_events` if ever needed.

## 2. Technical plan

### Files
```
supabase/config.toml                 # [db.seed] sql_paths = ["./seed.sql", "./seed/*.sql"]
supabase/migrations/0001_schema.sql
supabase/seed.sql
supabase/seed/.gitkeep
lib/database.types.ts                # npm run db:types
lib/types.ts                         # hand-written unions mirroring enums + row aliases
package.json scripts: db:reset, db:types, typecheck, lint
```

### Migration `0001_schema.sql`
```sql
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

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  voice_guidelines text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role user_role not null,
  created_at timestamptz not null default now()
);

create table if not exists brand_members (
  brand_id uuid not null references brands(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  primary key (brand_id, user_id)
);
create index if not exists brand_members_user_idx on brand_members (user_id);

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
```

### `lib/types.ts`
```ts
import type { Database } from './database.types';
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Brand = Tables<'brands'>;
export type Profile = Tables<'profiles'>;
export type Reply = Tables<'replies'>;
export type Review = Tables<'reviews'>;
export type UserRole = Database['public']['Enums']['user_role'];
export type Severity = Database['public']['Enums']['review_severity'];
export type FailureCategory = Database['public']['Enums']['failure_category'];

export const FAILURE_CATEGORIES = [
  'wrong_facts', 'tone_off_brand', 'answered_wrong_question',
  'too_slow', 'no_order_history_check', 'incomplete',
] as const satisfies readonly FailureCategory[];

export const CATEGORY_LABEL: Record<FailureCategory, string> = {
  wrong_facts: 'Wrong facts',
  tone_off_brand: 'Off-brand tone',
  answered_wrong_question: 'Answered a different question',
  too_slow: 'Too slow',
  no_order_history_check: "Didn't check order history",
  incomplete: "Correct but won't stop them writing again",
};
```

### Seed `supabase/seed.sql`
Fixed UUIDs so README and curl examples can reference them. Convention: `00000000-0000-0000-0000-0000000000NN`.

```sql
-- brands
insert into brands (id, name, slug, voice_guidelines) values
('00000000-0000-0000-0000-000000000001','Voltaire','voltaire',
 $$Voltaire sells electric scooters. Tone: calm, technical, confident.
Procedures:
1. Diagnose before you offer anything. Ask for the error code on the display and the mileage.
2. Check order history for prior claims before approving any RMA or refund.
3. Never approve a refund in the first reply.
4. Link the relevant help article by name.$$),
('00000000-0000-0000-0000-000000000002','Kraft&Co','kraftco',
 $$Kraft&Co sells packaging supplies to businesses. Tone: fast, exact, no small talk. Three lines max.
Procedures:
1. Confirm SKU and quantity back to the customer.
2. Quote lead time only from the lead-time table. Never promise a date not in the table.
3. Mention the pallet minimum whenever quantity is within 20% of it.$$),
('00000000-0000-0000-0000-000000000003','Lume','lume',
 $$Lume sells skincare. Tone: warm, reassuring, plain language. No medical claims.
Procedures:
1. Never say a product treats or cures anything.
2. Patch-test advice on every reaction complaint.
3. Offer replacement before refund.$$)
on conflict (id) do nothing;

-- people
insert into profiles (id, full_name, email, role) values
('00000000-0000-0000-0000-000000000011','Marta Ruiz','marta@sellervate.test','team_lead'),
('00000000-0000-0000-0000-000000000012','Nuria Vega','nuria@sellervate.test','team_lead'),
('00000000-0000-0000-0000-000000000021','Dani Ortega','dani@sellervate.test','specialist'),
('00000000-0000-0000-0000-000000000022','Iker Sanz','iker@sellervate.test','specialist'),
('00000000-0000-0000-0000-000000000023','Leo Marín','leo@sellervate.test','specialist')
on conflict (id) do nothing;

-- membership (cross-assigned on purpose: this is what makes isolation testable)
insert into brand_members (brand_id, user_id, role) values
('…0001','…0011','team_lead'), ('…0002','…0011','team_lead'),   -- Marta: Voltaire, Kraft&Co
('…0003','…0012','team_lead'),                                  -- Nuria: Lume
('…0001','…0021','specialist'), ('…0002','…0021','specialist'), -- Dani: Voltaire, Kraft&Co
('…0002','…0022','specialist'), ('…0003','…0022','specialist'), -- Iker: Kraft&Co, Lume
('…0003','…0023','specialist')                                  -- Leo: Lume
on conflict do nothing;
```
(Write full UUIDs in the file; `…` is shorthand here.)

**Replies** — `sent_at` relative to `now()` so the queue always shows "yesterday". 20 replies, 13 reviewed, 7 unreviewed. Required rows:

| id suffix | brand | specialist | sent_at | reviewed | score/severity/categories | what it is |
|---|---|---|---|---|---|---|
| 101 | voltaire | dani | now()-1d | yes | 1 / critical / {no_order_history_check, wrong_facts} | **the bad one**: approves refund on "won't charge", no error code asked, customer already had a replacement |
| 102 | voltaire | dani | -1d | yes | 5 / none / {} | textbook diagnosis: asks E-07 code + km, links article |
| 103 | voltaire | dani | -2d | yes | 4 / none / {} | good but one line too long |
| 104 | voltaire | dani | -6d | yes | 2 / minor / {answered_wrong_question} | customer asked about range, reply talks about charging |
| 105 | voltaire | dani | -9d | yes | 3 / none / {incomplete} | correct, didn't mention firmware update |
| 106 | voltaire | dani | -12d | yes | 4 / none / {} | |
| 107–109 | voltaire | dani | -1d, -1d, -1d | no | | queue material |
| 201 | kraftco | iker | -1d | yes | 3 / none / {incomplete} | **correct but bounces back**: lead time exact, no pallet-minimum mention |
| 202 | kraftco | dani | -1d | yes | 2 / minor / {tone_off_brand} | **wrong voice**: five warm paragraphs for a SKU question |
| 203 | kraftco | iker | -2d | yes | 5 / none / {} | three lines, SKU+qty confirmed, table lead time |
| 204 | kraftco | iker | -5d | yes | 4 / none / {} | |
| 205 | kraftco | dani | -8d | yes | 5 / none / {} | Dani nails the Kraft&Co voice — shows same person, different job |
| 206 | kraftco | iker | -11d | yes | 1 / critical / {wrong_facts} | promised a ship date not in the table |
| 207–208 | kraftco | iker, dani | -1d | no | | |
| 301 | lume | leo | -1d | yes (by Nuria) | 4 / none / {} | |
| 302 | lume | iker | -3d | no | | keeps Lume sparse on purpose: Nuria's empty/near-empty states |
| 303 | lume | leo | -1d | no | | |

All Voltaire/Kraft&Co reviews are by Marta (`…0011`); Lume by Nuria (`…0012`). Reply 101's review has `acknowledged_at = null`; 102's has `acknowledged_at = now()-12h` so both states appear in `/me`.

Text quality rule: each reply must be 2–8 sentences, mention a concrete product detail (model name, SKU code, article title), and read like a human wrote it for that brand. Write the customer message first, then the reply.

### `package.json` scripts
```json
"db:reset": "supabase db reset",
"db:types": "supabase gen types typescript --local > lib/database.types.ts",
"typecheck": "tsc --noEmit",
"lint": "next lint"
```

## 3. Verify by hand
```bash
supabase start && supabase db reset && supabase db reset   # twice, no errors
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -c "
select b.slug, round(avg(v.score),2) avg, count(*) n,
       count(*) filter (where v.severity='critical') critical
from reviews v join replies r on r.id=v.reply_id join brands b on b.id=r.brand_id
group by 1 order by 1;"
# expect three rows, distinct averages, voltaire critical=1, kraftco critical=1
npm run db:types && npm run typecheck
```
Read five replies aloud without the brand column; you must guess the brand every time.

## 4. Review checklist
- Every FK has an index that starts with it? Enum guards idempotent? `db reset` twice clean?
- Any `text` where an enum was specified? Any `sent_at` hardcoded to an absolute date?
- Do the seed replies actually sound different, and is 101 obviously bad to a non-technical reader?
- `database.types.ts` committed and matching?
