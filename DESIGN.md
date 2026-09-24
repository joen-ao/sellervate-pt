# Design

A dark, quiet tool for reading a lot of text fast: warm graphite, in the spirit of Claude and Notion in dark
mode. One daisyUI theme, `sellervate-qa`, in `app/globals.css`. Rationale and per-view decisions:
`specs/redesign/` (R0 foundations, R1–R7 one per view).

**Surfaces are told apart by tone, not lines.** Warm near-black (hue 75), four steps:
`sunken` (sidebar, report stage) < `base-100` (canvas) < `base-200` (cards, panels, message bubbles) <
`base-300` (hover, selected, hairlines). Borders only where tone can't do it (list dividers, table rows).

**Colour means one thing each.** Use tokens only, never a raw hex in `app/` or `components/`.
- `primary` is **ivory**, not a hue: the one action per screen (Review next, Save and next, Got it, Import, Print).
- `accent` (clay) is the brand mark and nothing else.
- `success` (sage): score 4–5, read. `warning` (amber): score 1–3, minor, a falling average, a file to fix.
- `error` (red): **critical only**: "this can cost the account". Not for a failed load, not for a low score.
  A failure of the tool is a neutral `ErrorCard`.
- Status pills are soft (`Pill`, `badge-soft`): they tint, they don't fill.

**Type.** Source Serif 4 for page titles and big figures (`font-serif`, 500, tight tracking); Inter for
everything else. Scale 12/14/16/20/28; body reading text `leading-relaxed`. Section label: `SectionLabel`
(12px, uppercase, 0.08em tracking, `/50`).

**Shape.** `rounded-box` 0.75rem for cards, `rounded-field` 0.5rem for inputs and segmented controls. No shadows
except the report sheet on its stage.

**Building blocks** (`components/`): `PageHeader` (eyebrow, serif title, one-sentence lead, meta, actions),
`Panel`, `SectionLabel`, `Avatar`, `BrandMark`, `Pill`, `SeverityDot`, `EmptyState`, `ErrorCard`, `StatePage`.

**States.** Every route has `loading.tsx` (a `Skeleton` shaped like the page), `error.tsx` (`ErrorCard` with a
retry), an `EmptyState` with a real sentence and a next step, and `StatePage` for 403/404.

**Shell.** Signed in: a `sunken` sidebar (daisyUI drawer, fixed from `lg`, a menu button below it): brand mark
on top; what is waiting for you (a count chip on Review queue / My feedback); for leads, each brand, the active
one unfolding Trends, Client report, Import replies; at the foot, who you are with a Switch person button.
Signed out: the person picker, two role cards, each role's job said once. Every landing page opens with
`PageHeader`. Icons: `lucide-react`, 16px, stroke 1.75.

**Client report.** The only light surface: a sheet with the `sellervate-print` theme on a dark stage, like a
document preview. Only the sheet prints.
