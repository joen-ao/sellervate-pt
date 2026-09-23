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

## The specialist's 30-day summary is computed in JS

`listMyReviews()` (`lib/data/my-reviews.ts`) fetches at most 100 reviews, already
restricted in SQL to the specialist's own replies in their member brands, and
computes count / average / critical over the last 30 days from those rows. That
is a deliberate exception to "aggregate in SQL": the rows are already isolated,
the set is tiny, and it saves a second query or an RPC (which would need a
migration this branch does not have).

The cost: a specialist with more than 100 reviews in 30 days would see an
undercount. Nobody is near that; if they get there, it becomes a SQL aggregate.
