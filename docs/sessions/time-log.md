# Time log

**Six hours**, up to and including PR #15. The visual redesign in PRs #17–19 came
after that and is extra, counted separately at the bottom.

## What the six hours were

I was the orchestrator and the reviewer. **The agents wrote the code** — every
implementation commit, every migration, every component in this history was
written by an agent session, not by me. What the six hours bought was the part
that decides whether any of that is worth having:

- reading the meeting notes and picking one of the three readings to build,
  which is the decision the brief says it reads first;
- writing the specs in `specs/` before a line of code existed, so each agent had
  a target instead of a prompt;
- writing `CLAUDE.md`, the standing rules every session loads;
- deciding the waves in `specs/PARALLEL.md` — what could run at once without two
  agents colliding in `lib/data`;
- reading every pull request before merging it, and writing the review on it;
- testing each result myself, in the browser as each of the five seed people and
  with `curl` against the API.

## The split

The pull request numbers are exact. **The minutes are estimates**, reconstructed
after the fact rather than measured with a stopwatch, and rounded to the nearest
quarter hour. They are offered as an honest account, not as a record.

| Wave | PRs | Attention (est.) | What I was doing |
|---|---|---|---|
| Specs + bootstrap | #1 | ~75 min | Reading the notes, choosing the reviewing loop over the proof and the library, writing `specs/00`–`07` plus `specs/plus/`, and the agent rules. The most valuable block of the six: everything after it is an agent aiming at a target I had already set. |
| 1 · foundation | #2, #3 | ~45 min | Reviewing the schema and the invented seed, and checking the cookie signing and the 404-vs-403 ordering by hand before letting four branches build on top of them. |
| 2 · the loop | #4–#8 | ~90 min | Five branches in parallel. Reading five diffs, clicking through the queue, the review panel and `/me` as each of the five people, and running the RLS proof script. |
| 3 · states + plus | #9–#12 | ~75 min | Reviewing the empty/loading/error pass and the two `plus/` branches, and checking the status codes each route returns. |
| 4 · wiring + shell | #13–#15 | ~60 min | Reviewing the RLS wiring and the shell, and re-running the isolation checks through the real endpoints. PR #15 exists because the sidebar counters did not move when I clicked "Got it" as Dani. |
| Write-up | — | ~15 min | `DECISIONS.md` and the README. |

Wall clock across the git history is about a day, because branches ran while I
was away from the keyboard. That is not the number; the six is.

## Extra, after the six: the redesign

PRs #17–19 replaced the visual layer — warm graphite theme, serif titles, a new
shell, and every view restyled. Specced the same way as everything else, in
`specs/redesign/` (R0 foundations, R1–R7 one per view), built by agents, reviewed
by me before each merge, and UI only: no DAL, server action or migration changed.

Nothing in the brief asked for it. It is not counted in the six hours, and it is
not offered as part of what the six hours bought.
