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
verbatim. Two things they assume:

- The Supabase CLI. It is deliberately not a dependency of this package (see the
  bootstrap PR), so either put it on your `PATH` — `brew install
  supabase/tap/supabase` — or write `npx supabase@2.117.0 start` and
  `npx supabase@2.117.0 db reset`, which is what `npm run db:reset` does.
- `cp .env.example .env.local` copies a file whose entries are all commented out,
  so open `.env.local` afterwards and fill in the values `supabase start` printed.

## What is in the database

`supabase/seed.sql` — invented, nobody's real support inbox. Three client brands
with real voice guidelines that contradict each other (Voltaire diagnoses before
it offers anything, Kraft&Co wants three lines and no small talk, Lume may not
make a medical claim), five people, and **20 replies that already went out, 13 of
them reviewed**. Read five replies without looking at the brand column and you
should still know which brand you are in; reply `…0101` is the one that loses the
account. `sent_at` is always relative to `now()`, so the queue reads "yesterday"
whenever you reset.

Then: be Marta → review a reply → open Voltaire → see the trend and the critical
event → be Dani → see only his reviews → `curl` Lume as Dani → 403. Under ten
minutes.

## Being each role

Login is stubbed. The first screen at `/` is **"Who are you today?"**: five seed
people grouped by role, with what each one does in the tool and which brands they
cover. Pick one and you are them. To change afterwards, **"Switch person" at the
bottom of the sidebar** takes you back to the same screen.

| Person | Role | Covers | Lands on |
|---|---|---|---|
| Marta Ruiz | team lead | Voltaire, Kraft&Co | `/queue` |
| Nuria Vega | team lead | Lume | `/queue` |
| Dani Ortega | specialist | Voltaire, Kraft&Co | `/me` |
| Iker Sanz | specialist | Kraft&Co, Lume | `/me` |
| Leo Marín | specialist | Lume | `/me` |

Picking a person grants nothing: what each one may see is decided on the server
from membership. Marta on Lume is a 403 in the browser and a 403 on the API. For
the API, `eval "$(npm run -s print-cookies)"` exports a signed cookie per person:

```
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/brands/lume/replies \
  -H "Cookie: app_user=$DANI"     # 403 — and 200 for voltaire, 404 for an unknown brand
```

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

## Hours, and how this was built

**Six hours.** That is the number, and it is the cap rather than a stopwatch
reading: my own time in front of this project came in a little under it.

It is worth saying plainly how it was spent, because the repository is larger
than six hours of typing. I wrote the specs in `specs/` first, then ran agent
sessions in parallel — one branch, one PR each, coordinated by
`specs/PARALLEL.md` — and my time went on deciding what to build, reading each
pull request and testing the result before merging it. The wall clock across the
history is about a day; several branches were running while I was not at the
keyboard, and I do not count that. The six hours are mine, not the machine's.
`docs/sessions/time-log.md` has the breakdown by wave.

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

Two notes on that command. The column names carry the expected value
(`own_replies_expect_12`), and those numbers are the seed's, so run it on a
freshly `db reset` database — review a few replies in the UI first and the
counts legitimately go up. And if you have no `psql` on the machine (the
Supabase CLI does not bring one), the container has it:

```
docker exec -i supabase_db_sellervate-pt psql -U postgres -d postgres < scripts/rls-proof.sql
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
