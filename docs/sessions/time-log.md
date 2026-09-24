# Time log

**Six hours.** Attention time: writing the specs, deciding what to build, reading
each pull request and testing the result before merging it. Not agent wall clock,
and not the wall clock of branches running in parallel while I was away from the
keyboard — `specs/PARALLEL.md` says we claim what the exercise cost me, and this
is that number. The split below is rounded to the nearest quarter hour; the pull
request numbers are exact.

| Wave | PRs | Attention | What my time actually went on |
|---|---|---|---|
| Specs + bootstrap | #1 | ~75 min | Reading the notes, choosing the reviewing loop over the other two readings, writing `specs/00`–`07` and `specs/plus/`, and the agent rules in `CLAUDE.md`. The most valuable hour of the six: everything after this is an agent hitting a target I had already aimed. |
| 1 · foundation | #2, #3 | ~45 min | Reading the schema and the 20 seed replies out loud to check the two brands do not sound alike. Checking the cookie signing and the 404-vs-403 ordering by hand with `curl`. |
| 2 · the loop | #4–#8 | ~90 min | Four branches in parallel. Clicking through the queue, the review panel and `/me` as each of the five people; running the RLS proof; catching that the spec's grants let a specialist rewrite their own score. |
| 3 · states + plus | #9–#12 | ~75 min | Checking every empty, loading and error state, the 26 status codes, and the two plus branches. Screenshots in `docs/screenshots/`. |
| 4 · wiring + shell | #13–#15 | ~60 min | Putting RLS on the request path and re-running the isolation experiment through the real endpoints. Then finding, by clicking through as Dani, that the new sidebar counters did not move after "Got it" — PR #15. |
| Write-up | — | ~15 min | `DECISIONS.md` and this README. |

Wall clock across the git history is about a day. That is not the number; this is.
