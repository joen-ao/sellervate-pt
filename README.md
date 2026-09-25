# Sellervate — reply review

An internal tool for Sellervate team leads to record their judgement on support
replies that specialists already sent to customers, and for specialists to read
that judgement back. Not a helpdesk, not an inbox, no model scores anything.

`specs/00-system-overview.md` is the whole picture; `specs/README.md` maps each
branch to its spec. `CLAUDE.md` is what an agent session loads before it writes
a line.

## What it looks like

A team lead's queue: replies their specialists already sent, oldest first.

![Review queue](docs/screenshots/review-queue.png)

Reviewing one: the exchange on the left, score, severity and what went wrong on
the right. Keys 1–5 set the score.

![Reviewing a reply](docs/screenshots/review-a-reply.png)

The specialist's side: what their lead said, and "Got it" once it has landed.

![My feedback](docs/screenshots/my-feedback.png)

A brand over time: average score per week, the categories that keep coming up,
critical events and the split by specialist.

![Brand trends](docs/screenshots/brand-trends.png)

The client report, the page a team lead prints or saves as PDF for the brand.

![Client report](docs/screenshots/client-report.png)

Login is stubbed: this picker is how you become each of the five seed people.

![Switch person](docs/screenshots/switch-person.png)

## Before you start

Three things have to be on the machine. None is installed by `npm i`, and the
first one fails in a way that does not explain itself:

- **Docker, running.** Supabase's local stack is containers, so `supabase start`
  needs the daemon already up. On a Mac that means Docker Desktop open, not just
  installed.
- **Node 22 or newer** (`node -v`). Next 15 alone would accept 18.18, but
  `@supabase/supabase-js` declares `>=22.0.0`, so 22 is the floor. Verified on 26.
- **The Supabase CLI**, deliberately not a dependency of this package (see the
  bootstrap PR). Either put it on your `PATH` with
  `brew install supabase/tap/supabase`, or skip it: `npm run db:start` and
  `npm run db:reset` are the same two commands through `npx`, pinned to the
  version this was built against.

## Clone to running

```
git clone
npm i
supabase start        # no CLI on your PATH? npm run db:start
supabase db reset     #                      npm run db:reset
npm run setup
npm run dev
```

Nothing to fill in between those and the app. `npm run setup` writes `.env.local`
from the Supabase stack you just started — it reads the API URL and the
service-role key out of `supabase status` and generates a `SESSION_SECRET` for
this machine. It refuses to overwrite an existing `.env.local`, so rerunning it
is safe; delete the file to regenerate.

This is one step away from the definition of done in
`specs/00-system-overview.md`, which said `cp .env.example .env.local`. That copy
left every value commented out and the app answered 500 on every page, and the
obvious repair — commit working values — means committing a JWT, which trips
every secret scanner pointed at this repository. Reading the keys from the
running stack is both cleaner and more correct: it uses your keys, not ones that
happen to match today.

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

**Six hours**, up to and including PR #15. The visual redesign in PRs #17–19
came afterwards and is **extra**: it is not counted in the six and nothing in the
brief asked for it.

It is worth saying plainly what those six hours were, because the repository is
larger than six hours of typing and I do not want that read the wrong way. **I
orchestrated and reviewed; the agents wrote the code.** I read the notes, chose
which of the three readings to build, wrote the specs in `specs/`, then ran agent
sessions in parallel — one branch, one PR each, coordinated by
`specs/PARALLEL.md`. Every implementation commit in this history was written by
an agent. My time went on deciding what to build, reading each pull request
before merging it, and testing the result in the browser and with `curl`.

The wall clock across the history is about a day, because branches ran while I
was away from the keyboard. That is not the number. `docs/sessions/time-log.md`
has the split, and says which parts are estimates.

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
