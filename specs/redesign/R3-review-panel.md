# R3 · Review panel (`/reviews/[replyId]`)

## 1. Product

**Now.** Two columns: the exchange (two boxes) and a form card. The exchange does not read as a conversation;
the form's score buttons are outlined `btn-lg` squares that look like five separate actions.

**Redesign.**
- Left, a thread: back link "← Review queue", serif brand name, meta line (channel · specialist · sent). The
  guidelines collapse sits under it as a quiet `bg-base-200/60` panel with a book icon. Then two messages,
  each with an avatar disc and name line: the customer on `bg-base-200`, the specialist's reply on
  `bg-base-300/50`, both `rounded-box`, generous line height (`leading-relaxed`) for long reading.
- Right, a sticky `bg-base-200` panel titled "Your review":
  - Score: one segmented row of five, selected = ivory ring and lighter fill; hint "keys 1–5" on the right of the
    label.
  - Severity: segmented None / Minor / Critical. Only a *selected* Critical turns red.
  - Categories: soft rounded toggles.
  - Comment: textarea on `bg-base-100`.
  - Footer: ghost "Save" + ivory "Save and next".
- Read-only review: same panel, a large score figure, severity pill, category pills, the comment, "Back to queue".

**Out.** Editing a saved review (immutable in V1).

## 2. Technical plan

`page.tsx` (grid unchanged: `lg:grid-cols-[minmax(0,1fr)_26rem]`), `Exchange.tsx`, `GuidelinesPanel.tsx`,
`ReviewForm.tsx` (markup only: state, submit and keyboard logic untouched), `ReviewReadOnly.tsx`, `loading.tsx`.

## 3. Verify by hand

Keys 1–5; Save stays on page and shows read-only; Save and next moves on; validation error keeps inputs; no-JS
submit still posts.

## 4. Review checklist

Radios still `sr-only` inside labels with `has-focus-visible` outline; red only on selected Critical and its hint.
