# R7 · Client report (`/brands/[slug]/report`) and state pages

## 1. Product

**Now.** The light print theme is forced on the whole route, screen included, so the one dark app flashes to
white when you open the report, and the screen-only controls sit on the paper.

**Redesign.** A document preview, like a doc opened in Notion or an artifact in Claude:
- The route stays dark. A toolbar on the canvas holds "← {brand} (internal view)", the From/To form, Update and
  the ivory "Print / Save as PDF".
- Below it, the report is a white sheet (`data-theme="sellervate-print"`, `.report-root`), A4-ish width, rounded,
  on a `bg-sunken` stage. What prints is exactly the sheet (print.css already hides everything outside it).
- On paper: brand in serif, period line, the Sellervate wordmark; figures, chart, improved list, "What we are
  working on" as before.

**State pages** (403, 404, route errors, empty lists): serif titles, neutral icon discs, `bg-base-200` panels.

**Out.** PDF generation on the server; changing the report's content.

## 2. Technical plan

- `report/page.tsx`: `Sheet` becomes stage + paper; toolbar rendered outside `.report-root`.
- `report/_components/ReportHeader.tsx` split into `ReportToolbar` (screen) and `ReportHeader` (paper).
- `report/print.css`: unchanged selectors; `.report-root` loses its rounding/shadow in print.
- State pages need nothing here: `StatePage`, `EmptyState` and `ErrorCard` changed in R0 (first PR).

## 3. Verify by hand

Print preview shows only the sheet, no toolbar, no sidebar; invalid period shows the empty state on the sheet.

## 4. Review checklist

Nothing on the sheet names a person; `print:hidden` still on the note form.
