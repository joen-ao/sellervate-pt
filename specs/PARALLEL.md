# Running several agents in parallel

## Dependency graph
```
01 schema+seed
 └─ 02 current-user + DAL foundation
     ├─ 03 queue          ─┐
     ├─ 04 review panel   ─┼─ 07 UI-states pass (after all four merge)
     ├─ 05 brand trends   ─┤
     └─ 06 specialist view─┘
 └─ 07a RLS (only needs 01; can run alongside 03–06)
04 ─┬─ P1 calibration
    ├─ P2 coaching library
    └─ P3 pattern alerts
01 ─── P4 ingestion
05 ─── P5 client report
```

## Waves
| Wave | Branches (parallel) | Wall clock |
|---|---|---|
| 0 | 01 | ~45 min, solo — everything depends on it |
| 1 | 02 | ~30 min, solo — defines the contracts below |
| 2 | 03, 04, 05, 06, 07a-RLS | ~60 min |
| 3 | 07b UI pass, P4, P5 | ~45 min |
| 4 | P1, P2, P3 | ~60 min |

Do not start wave 2 until 02 is merged. The cost of a merge conflict in `lib/data` is higher than 30 minutes of waiting.

## Contracts fixed in wave 1 (nobody changes these in later branches)
- `lib/errors.ts` — `ForbiddenError`, `NotFoundError`.
- `lib/current-user.ts` — `getCurrentUser(): Promise<CurrentUser | null>`, `requireUser()`, `requireRole(role)`.
- `lib/data/membership.ts` — `getMemberBrandIds(userId)`, `assertBrandMember(userId, brandId)`.
- `lib/supabase/admin.ts` — the only Supabase client.
- `lib/database.types.ts` — generated; regenerate only in the branch that owns a migration.
- `app/forbidden.tsx`, `app/not-found.tsx` — shared error pages.

## Ownership rules
- A branch may **create** files under its own route folder and its own `lib/data/<name>.ts`. It may not edit another branch's DAL file. Shared helpers go in `lib/data/_shared.ts` only in 02.
- Migration numbers are reserved above. A branch that needs a migration uses its slot and regenerates `database.types.ts`; the merge order of migrations is by number, not by merge time.
- `seed.sql`: only 01 and P4 touch it. P1–P3 add seed rows in their own `supabase/seed/<name>.sql`, appended by `db reset` through `config.toml` `[db.seed] sql_paths`.
- Every agent runs `npm run typecheck && npm run lint` before opening the PR.

## PR discipline still applies
One branch = one PR = readable in five minutes. Parallel does not mean bigger. A branch that grows past ~400 lines of diff gets split.

## Time reporting
The README states: how many agents ran in parallel, and the hours reported are my own attention time (reviewing, deciding, testing), tracked in `docs/sessions/time-log.md`. We do not claim wall-clock parallelism as "six hours"; we claim what it cost me.
