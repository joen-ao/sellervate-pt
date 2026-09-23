# Plus specs — built after the core if attention time allows

Order is by how much each de-risks the account-loss problem. Each has a reserved migration slot and its own seed file so branches can run in parallel.

| # | Name | Branch | Slot | Seed file | Depends on |
|---|---|---|---|---|---|
| P1 | Calibration between leads | `feat/calibration` | 0003 | `seed/calibration.sql` | 04 |
| P2 | Coaching library | `feat/coaching-library` | 0004 | `seed/exemplars.sql` | 04 |
| P3 | Pattern alerts | `feat/pattern-alerts` | 0005 | — | 04 |
| P4 | Helpdesk ingestion | `feat/ingestion` | 0006 | `seed/ingest.sql` | 01 |
| P5 | Client-facing report | `feat/client-report` | 0007 | — | 05 |

RLS: every new table gets policies in its own migration, same pattern as `0002`. A plus branch that skips RLS on a new table is a review block.
