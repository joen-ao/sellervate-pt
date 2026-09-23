# Specs

Written **before** code. Each session with an agent gets `00` plus the spec for its branch. They are not the deliverable (that is `DECISIONS.md`); they are how several agents and I stay consistent.

Structure of every feature spec:
1. **Product** — why, who, what rule, what is out.
2. **Technical plan** — files, signatures, queries, components, validation.
3. **Verify by hand** — what I do before writing the PR review.
4. **Review checklist** — what I look for in the agent's diff.

| File | Branch | Migration slot | Depends on |
|---|---|---|---|
| 00-system-overview.md | — | — | — |
| 01-data-model-and-seed.md | `feat/schema-seed` | `0001` | — |
| 02-current-user-and-authorization.md | `feat/current-user-dal` | — | 01 |
| 03-review-queue.md | `feat/review-queue` | — | 02 |
| 04-review-panel.md | `feat/review-panel` | — | 02 |
| 05-brand-trends.md | `feat/brand-trends` | — | 02 |
| 06-specialist-view.md | `feat/specialist-view` | — | 02 |
| 07-rls-and-ui-states.md | `feat/rls-defense` | `0002` | 01 (RLS), 03–06 (UI pass) |
| plus/P1-calibration.md | `feat/calibration` | `0003` | 04 |
| plus/P2-coaching-library.md | `feat/coaching-library` | `0004` | 04 |
| plus/P3-pattern-alerts.md | `feat/pattern-alerts` | `0005` | 04 |
| plus/P4-helpdesk-ingestion.md | `feat/ingestion` | `0006` | 01 |
| plus/P5-client-report.md | `feat/client-report` | `0007` | 05 |

`PARALLEL.md` explains how branches run concurrently without stepping on each other. Spanish mirror in `es/`.
