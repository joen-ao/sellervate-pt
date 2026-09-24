# R1 · Persona picker (`/switch-needed`)

## 1. Product

**Now.** A centred column, two bordered lists of people. Works, but reads like a settings page, and signed-out
visitors see no product identity at all.

**Redesign.** A sign-in screen: brand mark and a serif "Who are you today?" on top, then the two roles as two
side-by-side cards on `lg` (stacked below). Each card: role title, the job in one sentence, and the people as
roomy rows (avatar, name, brands) with a quiet "Continue →" that brightens on hover. The current person gets a
"You are here" soft pill. Signed in, the page sits inside the shell and keeps the same cards.

**Out.** Real authentication; search; avatars from images.

## 2. Technical plan

- `app/switch-needed/page.tsx`: wider column (`max-w-4xl`), brand mark when signed out, `PageHeader`-style heading.
- `components/PersonaPicker.tsx`: `grid lg:grid-cols-2 gap-4`; each group is a `bg-base-200 rounded-box` card;
  rows are `rounded-field hover:bg-base-300/50` buttons; still one `<form method="post" action="/switch">`.
- `app/switch-needed/loading.tsx`: two card skeletons.

## 3. Verify by hand

Signed out and signed in (via "Switch person"); keyboard Tab reaches every person; no-JS POST still switches.

## 4. Review checklist

Still a plain form POST; no client component added; `aria-current` on the current person kept.
