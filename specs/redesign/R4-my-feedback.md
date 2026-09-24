# R4 · My feedback (`/me`, specialist)

## 1. Product

**Now.** daisyUI `stats` row, then bordered cards; the comment uses a thick left border (a dated pattern) and
read/unread cards look identical until you reach the footer.

**Redesign.**
- `PageHeader`: eyebrow "Your work", serif "My feedback", the lead sentence.
- Summary: three tiles on `bg-base-200` (Reviews received, Average score, Critical errors), label on top, big
  tabular figure, a one-line caption. Critical figure red only when > 0.
- Cards on `bg-base-200`. Unread cards carry a small ivory dot and "New" before the brand, so the list scans.
  Header: brand · date on the left, soft score and severity pills on the right. Categories as small soft pills.
- The comment is a message from the lead: avatar disc with initials + name, text below. No left border.
- "See the exchange" is a disclosure with a chevron; inside, the two messages as in R3, compact.
- Footer: ivory "Got it" (the one primary per card is acceptable: it is the page's only action type), or
  "✓ Read today" in success text.

**Out.** Filtering, replying to the lead.

## 2. Technical plan

`page.tsx`, `MySummary.tsx`, `MyReviewCard.tsx`, `AckButton.tsx` (class only), `loading.tsx`.

## 3. Verify by hand

Got it drops the sidebar count immediately; empty state shows with a fresh specialist.

## 4. Review checklist

No brand/team averages introduced; the ack form still sends only the review id.
