# R2 · Review queue (`/queue`)

## 1. Product

**Now.** Header, a row of `btn-xs` chips and a `join` of statuses, then a bordered list. The chips and the join
look alike, so brand vs status is not obvious; rows are dense and the unreviewed state is a grey pill that
competes with the scores.

**Redesign.**
- `PageHeader`: eyebrow "Your work", serif "Review queue", the lead sentence, and a meta line
  (`12 unreviewed · 3 brands · last 72 h`). "Review next" is the one ivory primary, top right.
- Filters on one bar: status as a segmented control (`tabs tabs-box`) on the left, brands as rounded pills on the
  right. Two different shapes for two different questions.
- The list sits in one `bg-base-200` card, rows separated by hairlines, `h-16` kept. Left column: brand name
  and "specialist · time". Middle: customer snippet (muted) over reply snippet. Right: severity dot + soft score
  pill + a check when read; unreviewed shows a small hollow ring and "To review" in muted text rather than a pill.
- Pager: "← Newer / Older →" ghost buttons around "Page 2 of 4".
- "Caught up" becomes a soft success banner with a check icon.

**Out.** Sorting, search, bulk actions.

## 2. Technical plan

`QueueView.tsx`, `QueueFilters.tsx`, `QueueRow.tsx` (keep `ROW_HEIGHT`), `QueueSkeleton.tsx`,
`ReviewNextButton.tsx` (add `ArrowRight`). URL stays the only state.

## 3. Verify by hand

Every filter link keeps the other filter; `?brand=` still validated by middleware; empty states for: no brands,
page past the end, brand filter, caught up, reviewed-empty.

## 4. Review checklist

`aria-current` on active filters; the row is still a single link; skeleton rows match `h-16`.
