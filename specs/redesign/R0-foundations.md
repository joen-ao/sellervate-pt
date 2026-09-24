# R0 · Foundations: warm graphite

Branch `feat/dark-redesign`. No migration, no DAL change: every file touched is under `app/**` (UI only),
`components/`, `app/globals.css` and `DESIGN.md`. Specs R1–R7 each redesign one view on top of this one.

## 1. Product

**Why.** The old theme was dark but cold (blue-grey, oklch hue 260) with an indigo primary; surfaces were
told apart by hairlines alone, so every screen read as one flat sheet of boxes. Leads spend hours reading
customer text here. The target is the calm of Claude and Notion in dark mode: warm near-black, surfaces
separated by *tone* more than by lines, a serif for page titles, and colour that almost never appears.

**Rules that stay** (DESIGN.md): colour means one thing each; red is critical only; a tool failure is neutral;
one primary action per screen; every list has empty, loading and error states.

**Out.** A light theme, a theme switcher, new features, copy rewrites beyond a label here and there.

## 2. Technical plan

### Tokens (`app/globals.css`, theme `sellervate-qa`)

| Token | Value | Use |
|---|---|---|
| `--color-sunken` (new, `@theme`) | `oklch(18.5% 0.004 75)` | sidebar, report stage |
| `base-100` | `oklch(21.5% 0.004 75)` | canvas |
| `base-200` | `oklch(25% 0.005 75)` | cards, message bubbles, table header |
| `base-300` | `oklch(31% 0.006 75)` | hairlines, hover, selected nav |
| `base-content` | `oklch(93% 0.01 85)` | ivory text |
| `primary` | `oklch(92% 0.015 85)` on `oklch(20% 0.005 75)` | the one action: an ivory button |
| `accent` | `oklch(68% 0.12 45)` | the brand mark only |
| `success` | `oklch(74% 0.1 150)` | score 4–5, read |
| `warning` | `oklch(81% 0.11 80)` | score 1–3, minor, falling |
| `error` | `oklch(65% 0.19 25)` | critical only |
| radii | box 0.75rem, field 0.5rem, selector 0.5rem | softer than before |

Primary becomes ivory, not a hue: a coloured primary would compete with the four status colours, and the
clay accent sits too close to red to carry actions. Contrast: ivory on `base-100` ≈ 14:1; `/60` text ≈ 6:1.

### Type

- `Source_Serif_4` via `next/font` (400/500/600) → `--font-serif`. Page titles only: `font-serif text-[1.75rem]
  font-medium tracking-tight`. Inter stays for everything else.
- Section labels: `text-xs font-medium uppercase tracking-[0.08em] text-base-content/50`.

### Shared components

- `components/PageHeader.tsx` (new): `eyebrow?`, `title`, `lead`, `meta?`, `actions?`. Every landing page uses it.
- `Pill`: soft badges (`badge-soft`) so a status tints instead of shouting; neutral = `bg-base-300`.
- `EmptyState`: `bg-base-200/60` panel with an icon disc instead of a dashed box.
- `ErrorCard`: `bg-base-200` with an `AlertCircle` in neutral; still never red.
- `StatePage`: serif title, code as a small mono chip.

### Shell (`components/shell/*`)

- Sidebar on `bg-sunken`, no right border. Top: brand mark (clay square + "Sellervate QA"). Middle: nav groups.
  Bottom: the person (avatar, name, role) with Switch person as an icon link beside it, like Claude/Notion's
  account footer.
- `SidebarLink`: active = `bg-base-300/70`, hover = `bg-base-300/40`; counts become a small rounded chip.
- Mobile header: `bg-base-100/85 backdrop-blur`.

## 3. Verify by hand

- `npm run typecheck && npm run lint && npm run build`.
- Each role's landing page renders with the new sidebar; counts still move after Save / Got it / Import.
- No raw hex in `app/` or `components/` (`rg '#[0-9a-fA-F]{3,6}' app components` finds only print.css comments).

## 4. Review checklist

- Red appears only for critical. Primary appears once per screen.
- No page changed a DAL call, an action or an access check.
