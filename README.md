# Sellervate — reply review

An internal tool for Sellervate team leads to record their judgement on support
replies that specialists already sent to customers, and for specialists to read
that judgement back. Not a helpdesk, not an inbox, no model scores anything.

`specs/00-system-overview.md` is the whole picture; `specs/README.md` maps each
branch to its spec. `CLAUDE.md` is what an agent session loads before it writes
a line.

## Clone to running

```
git clone
supabase start
supabase db reset
cp .env.example .env.local
npm i && npm run dev
```

Those are the steps from the definition of done in `specs/00-system-overview.md`,
verbatim. Two things they assume, which are true of the machine this was built on
but may not be true of yours:

- `supabase` is the Supabase CLI on your `PATH` (`brew install supabase/tap/supabase`,
  or `npx supabase@2.117.0 <command>` — it is deliberately not a dependency of this
  package, see the bootstrap PR).
- `cp .env.example .env.local` copies a file whose entries are all commented out,
  so open `.env.local` afterwards and fill in the values `supabase start` printed.

Then: switch to Marta → review a reply → open Voltaire → see the trend and the
critical event → switch to Dani → see only his reviews → `curl` Lume as Dani → 403.
Under ten minutes.

## Stack

Scaffolded with **`create-next-app@15.5.26`** (`--typescript --tailwind --eslint
--app --no-src-dir --turbopack --import-alias "@/*"`), then: daisyUI 5, zod,
`@supabase/supabase-js`, `postgres`, `server-only`, and `supabase init`.

Next 15.5.26 · React 19.1 · TypeScript strict · Tailwind 4 · daisyUI 5 ·
Supabase Postgres 17 local.

```
npm run dev         # dev server on :3000
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

## How this was built

Several agent sessions in parallel, one branch and one PR each, coordinated by
`specs/PARALLEL.md`. The hours reported for this exercise are **my own attention
time** — reviewing, deciding, testing — tracked in `docs/sessions/time-log.md`.
Wall-clock parallelism is not claimed as hours worked.

Agents run in parallel: _to be filled as the waves land._
Attention time: _see `docs/sessions/time-log.md`._

## RLS, the second gate

Migration `0002_rls.sql` turns on row-level security for every table (spec 07a),
and the DAL runs every query as the signed-in user through `asUser()`
(`lib/supabase/rls.ts`), so a bug in a DAL filter still cannot cross brands.
`DATABASE_URL_APP` in `.env.local` must log in as `app_login`, not `postgres`:
`postgresql://app_login:app_login_local@127.0.0.1:54322/postgres` (local-only
password, see `.env.example`). To see the policies hold:

```
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/rls-proof.sql
```

## Ingestion (spec P4)

Leads import a helpdesk export at `/brands/<slug>/import` (sample:
`docs/import-sample.csv`). A helpdesk can also push to the API with its source's
bearer token. The seed gives Voltaire a Gorgias source with the **local-only**
token `voltaire-dev-token` (only its sha256 is stored):

```
curl -s -X POST localhost:3000/api/ingest/00000000-0000-0000-0000-000000000611 \
  -H "Authorization: Bearer voltaire-dev-token" -H 'content-type: application/json' \
  --data @docs/ingest-sample.json      # {"inserted":3,"unmatched":1}, then 0/0
```

Field mappings for Gorgias and Zendesk: `docs/ingestion.md`.
