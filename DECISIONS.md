# Decisions

What we chose, what we gave up, and why. Newest last.

## Unknown brand is 404, known brand you don't cover is 403

`resolveMemberBrand(userId, slug)` looks the slug up first and checks membership
second. An unknown slug is a 404; a real brand the user is not a member of is a
403.

The cost: a 403 tells the caller that the brand exists. We accept that because
the brand list is Sellervate's own client roster, which everyone in the tool
already works for — it is not a secret from specialists. What must never leak is
the *rows* inside a brand, and those stay behind the membership check either way.

The alternative (404 for both) hides existence, but it makes "you're not
assigned to this brand" indistinguishable from a typo, for the user and for
whoever is debugging a missing assignment.

## RLS is a second gate, defined and proven, not yet on the request path

Migration `0002_rls.sql` enables and forces RLS on all five tables. Identity is
`app.current_user_id`, set with `set_config(..., true)` inside the same
transaction as the query, then `set local role app_user`. Both die at commit, so
a pooled connection cannot hand one user's identity to the next request; a
session-level `set role` / `set` would. `scripts/rls-proof.sql` shows Dani sees
only his 12 replies and 8 reviews, Marta 17 and 12, nobody sees Lume unless a
member, and an unset user sees nothing.

**Option A, a direct Postgres connection (`lib/supabase/rls.ts`, `asUser()`),
not Option B (one RPC per read).** PostgREST gives every REST call its own
transaction, so the setting cannot be shared through supabase-js. A would keep
the DAL's queries in TypeScript next to the code that calls them; B would move
every read into a SQL function and double the places a filter can drift. The
connection logs in as `app_login`: no BYPASSRLS, NOINHERIT, so without
`set local role app_user` it cannot read a single table — forgetting the switch
fails loudly instead of quietly seeing everything.

**Not on the request path yet.** The DAL files that would call `asUser()`
(`replies`, `reviews`, `brand-stats`, `my-reviews`) were being written on four
parallel branches when this landed, and `membership.ts` is a frozen contract.
Rewiring them here meant guaranteed conflicts, so the switch from `admin` to
`asUser()` is a follow-up once 03–06 merge. Until then the DAL is the only gate
on the request path and RLS protects every other consumer: the anon key
(which, before 0002, could read every table through PostgREST under Supabase's
default grants), a future ingester or report job, a bug.

What the DAL-bug experiment shows: `` asUser(dani, tx => tx`select count(*) from
replies`) `` — no specialist filter at all, the bug the spec asks us to simulate
— returns 12, Dani's own. That is what defence in depth means. The spec's
version (`remove .eq('specialist_id', u.id)` in `/api/me/reviews`) waits for
that route to exist and to run through `asUser()`.

Choices beyond the spec's SQL, each deliberate:
- `is_brand_member` and `current_app_role` are `security definer`. As invoker,
  `brand_members`' policy would call `is_brand_member`, which reads
  `brand_members`, which applies the policy — infinite recursion.
- Policies are `to app_user`, and the helper functions are revoked from
  `anon`/`authenticated`: nothing but the app role gets a policy or an RPC.
- Grants are narrow: `select` on all, `insert` on `reviews`, and `update` on
  `reviews(acknowledged_at)` only. The spec's ack policy alone would let a
  specialist rewrite the score of a review of their own reply.
- `reply_with_review` gets `security_invoker = true`. It is owned by `postgres`,
  which is BYPASSRLS here, so without it the view would skip every policy. A
  later `create or replace view` must restate the option.
- No `grant app_user to authenticated` (the spec's workaround for running the
  proof). Instead `postgres` gets `app_user` with `inherit false, set true`:
  since PG16 a non-superuser cannot `set role` to a role it merely created, and
  `inherit false` means postgres gains nothing from the membership.

## The specialist's 30-day summary is computed in JS

`listMyReviews()` (`lib/data/my-reviews.ts`) fetches at most 100 reviews, already
restricted in SQL to the specialist's own replies in their member brands, and
computes count / average / critical over the last 30 days from those rows. That
is a deliberate exception to "aggregate in SQL": the rows are already isolated,
the set is tiny, and it saves a second query or an RPC (which would need a
migration this branch does not have).

The cost: a specialist with more than 100 reviews in 30 days would see an
undercount. Nobody is near that; if they get there, it becomes a SQL aggregate.

## Access checks live in the segment layout, above `loading.tsx`

One pattern for every route. The check that can say 307/403/404 runs in the
route's `layout.tsx`; `loading.tsx` sits below it; the page renders the data.

Why: in Next 15.5, `loading.tsx` wraps the page in a Suspense boundary, so the
skeleton streams with a 200 before the page runs. A `forbidden()` thrown in the
page then renders the 403 screen with an HTTP 200. A layout renders before that
boundary, so its `forbidden()` / `notFound()` / `redirect()` set the real
status. The checks are `cache()`d (`getReplyForReview`, `assertBrandStatsAccess`,
`assertQueueAccess` → `scopeBrandIds`), so the page reuses the answer instead
of querying twice. The page still goes through the same DAL call, so a page
reached without its layout re-rendering (a client navigation that only changes
the query string) is still checked, it just can't set an HTTP status there,
and there it doesn't matter.

`/queue` was the exception (it had no `loading.tsx`, and streamed behind its
own `<Suspense>`), because its check depends on `?brand=` and a layout gets
`params`, not `searchParams`. `middleware.ts` now copies the query string into a
request header (`x-queue-search`, always overwritten) for `/queue` only, and
`app/queue/layout.tsx` reads `?brand=` from it. That header names a brand, not
a person, and the brand is resolved through membership like any other input.

Rejected: dropping `loading.tsx` everywhere and streaming behind an explicit
`<Suspense>` after a check in the page. It also gives real statuses, but
contradicts the spec's per-route `loading.tsx`, shows nothing on a client
navigation until the check returns, and for `/reviews/[id]` the check *is* the
data fetch, so there'd be nothing left to stream.

`curl -w "%{http_code}"` for every forbidden / not-found case on every route
is in the `feat/ui-states` PR.

## A database outage is an error screen, not "signed out"

`getCurrentUser()` used to ignore the query error and return `null`, so with
the database down every page redirected to "Pick who you are". It now throws on
a database error (same signature; `null` still means no valid cookie or no such
profile). The root layout catches its own failure to load the switcher and
still renders the page, so the route's `error.tsx` (or `app/error.tsx`, when the
failing call is in a segment layout) shows a retry. `app/global-error.tsx` is
the backstop if the root layout throws anyway.

## The client report (P5) computes in one SQL function, as invoker

`brand_report(brand, from, to)` (migration 0007) returns only aggregates — no
reviewer, specialist, reply id or comment — and the DAL parses it with a
*strict* zod object, so an extra key fails the request instead of reaching the
page. It is `security invoker`, unlike 0002's helpers: it does not read
`brand_members` itself, so there is no policy recursion to break, and as invoker
an `app_user` caller only aggregates the rows RLS shows it (Marta asking for
Lume gets `n = 0`). As definer it would hand any brand's numbers to anyone with
execute. Execute is revoked from `anon`/`authenticated`. The app still calls it
as `service_role`, so the DAL checks lead + membership first.

Changes to the spec's SQL, each deliberate:
- The previous period is the same length as the current one. The spec's
  `p_from - (p_to - p_from)` is one day shorter, because `[p_from, p_to]` is inclusive.
- "Top three things we improved" compares each category's *share* of reviews,
  not its raw count. A quieter period would otherwise read as improvement on
  every category — a claim we would be making to the client.
- `limit 3` sits in a subquery; in the spec it applied to the single aggregated
  row, so it never limited anything (checked: it returns all five of five).
- Weeks with no reviews are emitted (`generate_series`) so the chart shows gaps
  instead of hiding them; bucketing is explicit UTC.

A note is keyed by the exact period, as specified. The default period is "the
last 90 days", so it moves every day; without help a note written today would be
gone tomorrow. When there is no note for the exact period, the latest non-empty
note of the brand pre-fills the form (and prints), marked as carried over.
