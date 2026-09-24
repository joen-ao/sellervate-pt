# Decisions

Six hours. What I read into the notes, what I built, how it is defended, and the
thing I would flag hardest if this were somebody else's repository.

## Product

**The real problem.** The lead's judgement already exists — five replies a
morning out of hundreds — and then it evaporates into Slack. So the failure that
costs accounts surfaces weeks late or never, a new joiner is onboarded by digging
through the inbox the night before, and "are we getting better" is a sentence
rather than a number. The missing thing is not review. It is a **record** of a
review that already happens.

**The reading I chose:** the reviewing loop, with the brand trend on top. Of the
three offered it is the one the other two stand on — a proof and a library are
both downstream of having scored rows at all. So `/queue` ("Review next" so the
lead never has to choose), `/reviews/[id]` (score, severity, categories, comment,
with the brand's guidelines on screen because that is what the reply is judged
against), `/me` (the specialist reads back their own scores and presses **Got
it**). The trend came next: "I would rather show them the number than say the
sentence" is the only line in the notes with a deadline attached.

**What I left out.** Calibration, the coaching library and pattern alerts are
specified in `specs/plus/` and not built: each needs the scored rows this version
produces, so they are V2 by construction, not by fatigue. Reviews are immutable —
an audit trail you can rewrite is not one. No search, bulk actions or assignment;
a lead reading five replies does not need to find anything.

**Where a model would earn its place.** Not scoring. First, **ordering the
queue** — the lead gets through five of thirty, so ranking which five are most
likely to be wrong changes the economics of the product. What would have to be
true first: a few hundred human-scored rows *per brand* to measure the ranker
against (there are 13 today), the lead able to override the order, and the
unranked queue still browsable so a reply never goes invisible because a model
ranked it low. Second, **drafting the opening sentence of the comment** from the
categories the lead already ticked: cheap, reversible, lead holds the pen.

Where I would refuse one: deciding `severity = critical`. That field is the
reason this product exists, it names a person, and a false positive is an
accusation. A human puts it there or nobody does.

**What I would ask before a V2.** Is calibration a feature or an insult — does
Marta want to see Nuria's reviews? And is "Got it" enough, or does the specialist
need to answer back?

## Architecture

**Shape.** Server components read through `lib/data/*` (the DAL); server actions
write through the same DAL; the handlers under `app/api` exist only so this can
be checked with `curl`. Identity comes from `getCurrentUser()` and nowhere else —
a signed httpOnly cookie, never a header, param or body.

**Data model.** `score` (1–5) *and* `severity` *and* `categories[]`, severity
independent of score: a 4/5 can still carry the factual error that loses the
account, and the trend treats any `critical` as a red event. `unique (reply_id,
reviewer_id)` lets two leads review one reply when calibration arrives, no
migration; `unique (source, external_id)` makes ingestion idempotent from day
one. Reviews carry no `brand_id` — it is derived through `replies`.

**Authorisation: two gates, both on the server.** The DAL resolves the user,
resolves membership and filters in SQL, never after the fetch. RLS is the second
gate: identity is a *transaction-local* setting (`set_config(..., true)` plus
`set local role app_user`) on a connection logging in as `app_login`, a role
without `BYPASSRLS`. A session-level `SET` on a pooled connection would hand one
user's identity to the next request; that is the footgun this shape avoids. The
experiment: delete the specialist filter from `/api/me/reviews` and Dani still
sees only Dani's rows. Unknown brand is 404, a brand you do not cover is 403 —
the client roster is not a secret from the people who work it; the rows inside it
are. Checks run in each route's `layout.tsx`, above `loading.tsx`, or a
`forbidden()` renders the 403 screen with an HTTP **200**.

**What real authentication would take.** Replace `/switch` with Supabase Auth,
have `getCurrentUser()` read `auth.getUser()`, point RLS at `auth.uid()`. The DAL
and the membership model do not change.

**What breaks first.** `lib/data/brand-stats.ts` aggregates in JS — the spec
asked for a SQL function, that branch had no migration slot, flagged in PR #4 and
accepted knowingly. At a few thousand reviews per brand it becomes a SQL function
and a swapped reducer. Next: the queue's 48-hour window, a filter today and a
cursor at 20k replies.

**Tests.** First test would be table-driven over the DAL, role × membership ×
expected rows, because every other layer is a screen you can see and that is the
one place a bug is silent; not in hour five, because `curl` against the real
routes covers the same ground in a tenth of the time.

## AI

**How I worked.** Specs first, one branch per spec, an agent on each: it writes
the code and opens the PR, I read the PR before merging. Several ran in parallel
by wave (`specs/PARALLEL.md`), which is why the wall clock is longer than the
hours. The standing prompt every session loads is `CLAUDE.md`, mostly
prohibitions:

> - Identity comes only from `getCurrentUser()`. Never from headers, params, body,
>   or a client component.
> - Every `lib/data` function resolves the current user and filters by membership
>   in SQL. No post-fetch filtering. Name columns in every `.select()`. No `*`.
> - `gh pr create` with what changed, what to review first, what was deliberately
>   left. **Never merge.**

**Where the agent was right and I was wrong.** My spec put the access check in
the page. In PR #4 the agent found every route returning HTTP 200 — including
Dani on Voltaire — because `loading.tsx` wraps the page in Suspense and the 200
shell is out before `forbidden()` runs. It named the cause and proposed the
segment-layout pattern; I applied it to every route.

**Where I overrode it.** The RLS grants in my own spec (`grant select, insert,
update on all tables`) would have let a specialist rewrite the score of a review
of their own reply; narrowed to `update (acknowledged_at)`. Same PR:
`reply_with_review` needed `security_invoker = true`, or the view — owned by a
BYPASSRLS role — skipped every policy it was meant to sit behind.

**Where it got past me.** PR #14 shipped a sidebar whose counters did not move
after "Got it". I found it clicking through as Dani, not reading the diff. PR #15
is the fix.

## Status

**Finished.** Queue, review panel, brand trend, specialist view, RLS on the
request path, the empty/loading/error pass, the shell and person picker, the
client report (P5), helpdesk ingestion (P4).

**Half done.** Brand stats aggregate in JS; the report's "addressed" count is
stubbed until P3 exists.

**Never touched.** P1 calibration, P2 coaching library, P3 pattern alerts: specs
written, migration slots `0003`–`0005` reserved and deliberately empty — which is
why the migrations jump from `0002` to `0006`. P1 first: two leads scoring the
same reply differently is the fastest way to learn whether any of these numbers
mean anything.

**The one thing I would flag hardest if this were somebody else's PR: P4,
helpdesk ingestion.** The note says *"Eventually this should pull the replies out
of the helpdesk on its own. **Not now.** Just do not make it impossible later."*
`source`, `external_id` and `unique (source, external_id)` in migration `0001`
already satisfied "not impossible later" — that was the whole ask, and it cost
three columns. The bearer-token API and the CSV import are a migration, a route,
a DAL and a screen spent on the half of the sentence that said *not now*. On
somebody else's PR I would close it and point at the note. I left it because it
is the only place in the repo where a non-human principal exists — but it is
scope I was told not to spend, and calling it a feature would be the wrong lesson.

**Second: fifteen pull requests, not one follow-up commit after a review.** Every
review reads "accepted, merging". Some of that is real — the specs were detailed
enough that the agents mostly hit them — but a reviewer who never sends anything
back is worth checking.
