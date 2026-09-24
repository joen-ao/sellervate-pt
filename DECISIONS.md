# Decisions

Six hours. What I read into the notes, what I built, how it is defended, and the
thing I would flag hardest if this were somebody else's repository.

## Product

**The real problem.** The lead's judgement already exists — five replies a morning
out of hundreds — and then it evaporates into Slack. So the error that costs
accounts surfaces weeks late or never, a new joiner is onboarded by digging
through the inbox the night before, and "are we getting better" is a sentence
rather than a number. The missing thing is not review. It is a **record** of a
review that already happens.

**What I built first.** The reviewing loop, with the brand trend on top. Of the
three readings offered it is the one the other two stand on: a proof and a
library are both downstream of having scored rows at all. So `/queue`, then
`/reviews/[id]` with the brand's guidelines on screen next to the reply, then
`/me`, where the specialist reads their own scores and presses **Got it**. The
trend came next because "I would rather show them the number than say the
sentence" is the only line in the notes with a deadline attached.

**What I left out.** Calibration, the coaching library and pattern alerts are
specified in `specs/plus/` and not built: each needs the scored rows this version
produces, so they are V2 by construction, not by fatigue. Reviews are immutable —
an audit trail you can rewrite is not one. No search, bulk actions or assignment.

**Where a model would earn its place.** Not scoring. **Ordering the queue**: the
lead gets through five of thirty, so ranking which five are most likely to be
wrong changes the economics of the product. What would have to be true first —
a few hundred human-scored rows *per brand* to measure the ranker against (there
are 13 today), and the unranked queue still browsable, so no reply goes invisible
because a model ranked it low. Where I would refuse one: deciding
`severity = critical`. That field is the reason this product exists, it names a
person, and a false positive is an accusation.

**What I would ask before a V2.** Is calibration a feature or an insult — does
Marta want Nuria's reviews on screen?

## Architecture

**Shape.** Server components read through `lib/data/*` (the DAL), server actions
write through the same DAL, and the handlers under `app/api` exist only so this
can be checked with `curl`. Identity comes from `getCurrentUser()` and nowhere
else: a signed httpOnly cookie, never a header, param or body.

**Data model.** `score` (1–5) *and* `severity` *and* `categories[]`, severity
independent of score, because a 4/5 can still carry the factual error that loses
the account. `unique (reply_id, reviewer_id)` lets two leads review one reply
when calibration arrives, no migration; `unique (source, external_id)` makes
ingestion idempotent from day one. Reviews carry no `brand_id` — it is derived
through `replies`.

**Authorisation: two gates, both on the server.** The DAL resolves the user,
resolves membership and filters in SQL, never after the fetch. RLS is the second
gate: identity is a *transaction-local* setting on a connection logging in as
`app_login`, a role without `BYPASSRLS`. A session-level `SET` on a pooled
connection would hand one user's identity to the next request; that is the
footgun this shape avoids. The experiment: delete the specialist filter from
`/api/me/reviews` and Dani still sees only Dani's rows. An unknown brand is 404
and a brand you do not cover is 403, because the client roster is not a secret
from the people who work it; the rows inside it are.

**What real authentication would take.** Replace `/switch` with Supabase Auth,
have `getCurrentUser()` read `auth.getUser()`, point RLS at `auth.uid()`. The DAL
and the membership model do not change.

**What breaks first.** `lib/data/brand-stats.ts` aggregates in JS — the spec asked
for a SQL function, that branch had no migration slot, flagged in PR #4 and
accepted knowingly. At a few thousand reviews per brand it becomes a SQL function
and a swapped reducer. Next: the queue's 48-hour window, a filter today and a
cursor at 20k replies.

**Tests.** First would be table-driven over the DAL, role × membership × expected
rows, because every other layer is a screen you can see. Not hour five: `curl`
against the real routes covers the same ground in a tenth of the time.

**`npm run setup` writes `.env.local`, reversing PR #1.** That branch decided
every line of `.env.example` should be commented out, on the grounds that a
half-real `.env.local` is harder to debug than an empty one. I believed it until
I cloned the repo into a clean directory and ran the definition of done verbatim:
every page answered 500, `supabaseUrl is required`. "Clone to running in under
ten minutes" is a checklist item, and a file you must hand-edit before the app
starts fails it in the first minute. My first repair was to commit the local
demo values, which the repository's own secret scanner rejected — correctly,
since they are JWTs, and "it is only a demo key" is how real keys get committed.
So the values are read from `supabase status` at setup time instead. No key is
ever in the repository, and the app uses your stack's keys rather than ones that
happened to match on the day this was written.

## AI

**How I worked.** Specs first, one branch per spec, an agent on each: it writes
the code and opens the PR, I read the PR before merging. Several ran in parallel
by wave, which is why the wall clock is longer than the hours. The standing
prompt every session loads is `CLAUDE.md`, mostly prohibitions:

> - Identity comes only from `getCurrentUser()`. Never from headers, params, body,
>   or a client component. Every `lib/data` function filters by membership in SQL.
> - `gh pr create` with what changed, what to review first, what was deliberately
>   left. **Never merge.**

**Where the agent was right and I was wrong.** My spec put the access check in the
page. In PR #4 the agent found every route returning HTTP 200 — including Dani on
Voltaire — because `loading.tsx` wraps the page in Suspense and the shell is out
before `forbidden()` runs. It named the cause and proposed the segment-layout
pattern; I applied it to every route.

**Where I overrode it.** The RLS grants in my own spec would have let a specialist
rewrite the score of a review of their own reply; narrowed to
`update (acknowledged_at)`. Same PR: `reply_with_review` needed
`security_invoker = true`, or the view skipped every policy it sat behind. What
got past me was smaller and I found it in the browser rather than the diff: the
sidebar counters in PR #14 did not move after "Got it". PR #15 is the fix.

## Status

**Finished.** Queue, review panel, brand trend, specialist view, RLS on the
request path, the empty/loading/error pass, the shell and person picker, the
client report (P5), helpdesk ingestion (P4).

**Extra, after the six hours.** PRs #17–19 replaced the visual layer: warm
graphite, serif titles, a new shell, every view restyled, specced in
`specs/redesign/` and UI only — no DAL, action or migration changed. Nothing in
the brief asked for it, it is not counted in the six, and it is not offered as
part of what the six bought.

**Half done.** Brand stats aggregate in JS; the report's "addressed" count is
stubbed until P3 exists.

**Never touched.** P1 calibration, P2 coaching library, P3 pattern alerts: specs
written, slots `0003`–`0005` reserved and deliberately empty, which is why the
migrations jump from `0002` to `0006`. P1 first: two leads scoring the same reply
differently is the fastest way to learn whether these numbers mean anything.

**The one thing I would flag hardest if this were somebody else's PR: P4,
helpdesk ingestion.** The note says *"Eventually this should pull the replies out
of the helpdesk on its own. **Not now.** Just do not make it impossible later."*
`source`, `external_id` and `unique (source, external_id)` in migration `0001`
already satisfied "not impossible later" — the whole ask, and it cost three
columns. The bearer-token API and the CSV import are a migration, a route, a DAL
and a screen spent on the half of the sentence that said *not now*. On somebody
else's PR I would close it and point at the note. I left it because it is the only
place in the repo where a non-human principal exists, but it is scope I was told
not to spend.
