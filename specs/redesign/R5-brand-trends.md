# R5 · Brand trends (`/brands/[slug]`)

## 1. Product

**Now.** Bordered stat boxes, a chart floating on the canvas, two lists and a bare table. Sections are
separated by whitespace only, so the page reads as one long column.

**Redesign.**
- `PageHeader`: eyebrow "Brand", serif brand name, lead sentence, meta "Last 30 days vs the 30 before", actions:
  ghost "Import replies", neutral "Client report".
- Stat tiles on `bg-base-200`: label, big figure with `/ 5` suffix, delta line with an arrow icon
  (`TrendingUp/Down`), tones as before (red only for more criticals).
- Chart in a `bg-base-200` card. Bars in `base-content/25`, the latest week in ivory `primary`, so "now" pops
  without a hue; gridlines dashed `base-300`.
- Two cards side by side: "What we keep getting wrong" (bars in `base-content/50` on `base-300` track) and
  "Critical events" (severity dot, date, specialist, comment clamped to 2 lines, row hover).
- Specialist table in a card: header row on `bg-base-300/40`, right-aligned numbers, critical count red if > 0.

**Out.** New metrics, date range picker (report owns that).

## 2. Technical plan

`page.tsx`, `StatCards.tsx`, `TrendChart.tsx` (latest-week highlight), `CategoryList.tsx`, `CriticalList.tsx`,
`SpecialistTable.tsx`, `loading.tsx`. A local `Card` wrapper in `page.tsx`.

## 3. Verify by hand

Brand with reviews and brand with none (empty state with "Review … replies"); chart titles on hover.

## 4. Review checklist

Chart remains an SVG with `role="img"` and label; no new data fetched.
