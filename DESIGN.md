# Design

A dark, quiet tool for reading a lot of text fast. One daisyUI theme, `sellervate-qa`, in `app/globals.css`.

**Colour means one thing each.** Use daisyUI tokens only, never a raw hex in `app/` or `components/`.
- `base-100 / 200 / 300`: canvas, raised surface, hairline. Almost everything is these.
- `primary` (indigo, oklch 62% 0.16 275): actions only. One primary button per screen.
- `success` (oklch 70% 0.14 150): score 4–5, acknowledged.
- `warning` (oklch 78% 0.14 80): score 1–3, minor severity, a falling average, a form field to fix.
- `error` (red, oklch 62% 0.20 25): **critical only**: "this can cost the account". Nowhere else,
  not for a failed load, not for a low score. A failure of the tool is a neutral `alert` (`ErrorCard`).

**Type.** Inter via `next/font`. Scale 12/14/16/20/28 = `text-xs/sm/base/xl/2xl`; weights 400/500/600.
Page title `text-2xl font-semibold`; section label `text-sm uppercase text-base-content/60`.

**Shape.** `rounded-box` 0.5rem for cards, `rounded-field` 0.375rem for inputs. Hairline borders, no shadows
except the floating user switcher.

**States.** Every route has `loading.tsx` (a `Skeleton` shaped like the page), `error.tsx` (`ErrorCard` with a
retry), an `EmptyState` with a real sentence and a next step, and `StatePage` for 403/404.
