# CLAUDE.md

Every session reads `specs/00-system-overview.md` and the spec for its own branch
(branch ↔ spec table in `specs/README.md`) before touching code.

## Architecture in one paragraph

Server components read through `lib/data/*` (the DAL). Server actions write through the same DAL. Route handlers under `app/api` exist only so evaluators can hit the API with curl; they call the same DAL. The DAL takes the current user from a signed httpOnly cookie, resolves membership, and filters every query. RLS is a second gate inside Postgres (spec 07) using a transaction-scoped setting. No layer trusts a user id from the request.

## Rules for every agent

- Identity comes only from `getCurrentUser()`. Never from headers, params, body, or a client component.
- Every `lib/data` function receives or resolves the current user and filters by membership in SQL. No post-fetch filtering.
- Name columns in every `.select()`. No `*`.
- Migrations idempotent: `create table if not exists`, `drop policy if exists` before `create policy`, `do $$ ... $$` guards for enums.
- Errors: throw `ForbiddenError` / `NotFoundError`; pages `forbidden()`/`notFound()`; route handlers map to 403/404 JSON.
- Every list: designed empty, loading (`loading.tsx` skeleton), error (`error.tsx` with retry).
- `gh pr create --fill --body-file .github/PR_BODY.md` with: what changed, what to review first, what was deliberately left. Never merge.

## Ownership (from `specs/PARALLEL.md`)

- A branch may **create** files under its own route folder and its own `lib/data/<name>.ts`. It may not edit another branch's DAL file. Shared helpers go in `lib/data/_shared.ts` only in 02.
- Migration numbers are reserved in `specs/README.md`. A branch that needs a migration uses its slot and regenerates `database.types.ts`; the merge order of migrations is by number, not by merge time.
- `seed.sql`: only 01 and P4 touch it. P1–P3 add seed rows in their own `supabase/seed/<name>.sql`, appended by `db reset` through `config.toml` `[db.seed] sql_paths`.
- Every agent runs `npm run typecheck && npm run lint` before opening the PR.
- The wave-1 contracts — `lib/errors.ts`, `lib/current-user.ts`, `lib/data/membership.ts`, `lib/supabase/admin.ts`, `lib/database.types.ts`, `app/forbidden.tsx`, `app/not-found.tsx` — are fixed in branch 02. Later branches call them; they do not change them.
- One branch = one PR = readable in five minutes. Past ~400 lines of diff, split it.

## Commands

```
npm run dev         # dev server on :3000 (Turbopack)
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run print-cookies  # signed cookies for the seed users: eval "$(npm run -s print-cookies)"
supabase start      # local Postgres + API; CLI is not in package.json, see README
supabase db reset   # re-apply migrations, then load [db.seed] sql_paths
```

## Layout

`app/` routes · `components/` UI primitives · `lib/data/` the DAL · `lib/validation/` zod
schemas · `supabase/migrations/` numbered SQL · `specs/` the contract · `docs/sessions/`
the time log.

## Conventions (spec 02 and PR review decisions)

- Pages wrap DAL calls in `runPage()` (`lib/page.ts`); route handlers wrap them in `handle()` (`app/api/_lib/respond.ts`).
- `reply_with_review` returns one row per *review*, not per reply. Every query on it filters by `reviewer_id` (PR #2).
- Each branch passes a filled *copy* of `.github/PR_BODY.md` to `gh pr create`; the committed template stays blank (PR #1).
