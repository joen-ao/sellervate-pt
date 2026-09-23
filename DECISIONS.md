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
