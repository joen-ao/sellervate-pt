# 00 · System overview

## What this is
An internal tool for Sellervate team leads to record their judgement on support replies that specialists already sent to customers, on behalf of client brands, and for specialists to read that judgement back.

It is **not** a helpdesk, inbox, ticketing system or AI product. Nobody talks to a customer here. No model scores anything.

## Product thesis
Sellervate loses accounts when a specialist tells a customer something factually wrong about their own product, and today that is found weeks late or never. The team lead's review lives in Slack, leaves no record, and cannot be used to coach or to show a brand a number.

We build the **system of record that turns the lead's judgement into data**: review fast, flag the critical error separately from tone, and let that data feed the quarterly "are we improving" conversation and the onboarding of new specialists.

Reading chosen: **the reviewing loop** with a brand trend view on top. Calibration, coaching library, pattern alerts, ingestion and client report are specified in `plus/` and built if time allows, in that order.

## Roles and visibility
| | Team lead | Specialist |
|---|---|---|
| replies | all replies in member brands | own replies, in member brands |
| reviews | all reviews on those replies | reviews on own replies |
| brand stats | member brands | never |
| write review | member brands | never |
| acknowledge | never | own reviews |

Membership is many-to-many (`brand_members`). A lead who is not a member of a brand does not see it either.

## Non-negotiables (from the brief)
- Login stubbed with a user switcher. **Authorisation enforced on the server**, before rows leave the database.
- Every change through a small PR the agent opens and I review in writing before merging. No squash, no rebase.
- Rough edges fine; disconnected screens not.
- Seed invented: ≥2 brands, 3 specialists, 2 team leads, enough scored rows.

## Stack (fixed)
Next.js 15 App Router · TypeScript strict · Supabase Postgres local (`supabase start`) · Tailwind 4 + daisyUI 5 custom theme · zod · `@supabase/supabase-js` server-only (no browser client in V1).

## Architecture in one paragraph
Server components read through `lib/data/*` (the DAL). Server actions write through the same DAL. Route handlers under `app/api` exist only so evaluators can hit the API with curl; they call the same DAL. The DAL takes the current user from a signed httpOnly cookie, resolves membership, and filters every query. RLS is a second gate inside Postgres (spec 07) using a transaction-scoped setting. No layer trusts a user id from the request.

## Repo layout
```
app/
  layout.tsx                 # shell + <UserSwitcher/>
  page.tsx                   # redirects by role
  switch/route.ts            # POST: sets signed cookie
  queue/page.tsx
  reviews/[replyId]/page.tsx
  brands/[slug]/page.tsx
  me/page.tsx
  forbidden.tsx  not-found.tsx
  api/brands/[slug]/replies/route.ts
  api/me/reviews/route.ts
components/                  # ui primitives (Pill, Skeleton, EmptyState, ErrorCard)
lib/
  errors.ts  current-user.ts  types.ts  database.types.ts
  supabase/admin.ts
  data/membership.ts replies.ts reviews.ts brand-stats.ts
  validation/review.ts
supabase/
  config.toml  migrations/000N_*.sql  seed.sql  seed/*.sql
specs/  docs/sessions/  CLAUDE.md  DESIGN.md  DECISIONS.md
```

## Rules for every agent (also in CLAUDE.md)
- Identity comes only from `getCurrentUser()`. Never from headers, params, body, or a client component.
- Every `lib/data` function receives or resolves the current user and filters by membership in SQL. No post-fetch filtering.
- Name columns in every `.select()`. No `*`.
- Migrations idempotent: `create table if not exists`, `drop policy if exists` before `create policy`, `do $$ ... $$` guards for enums.
- Errors: throw `ForbiddenError` / `NotFoundError`; pages `forbidden()`/`notFound()`; route handlers map to 403/404 JSON.
- Every list: designed empty, loading (`loading.tsx` skeleton), error (`error.tsx` with retry).
- `gh pr create --fill --body-file .github/PR_BODY.md` with: what changed, what to review first, what was deliberately left. Never merge.

## Definition of done (whole exercise)
Stranger: `git clone` → `supabase start` → `supabase db reset` → `cp .env.example .env.local` → `npm i && npm run dev` → switch to Marta → review a reply → open Voltaire → see trend and the critical event → switch to Dani → see only his reviews → `curl` Lume as Dani → 403. Under ten minutes.
