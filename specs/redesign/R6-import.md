# R6 · Import replies (`/brands/[slug]/import`)

## 1. Product

**Now.** A paragraph of column names in inline `<code>`, a bare file input and a button; results as three
centred numbers.

**Redesign.**
- `PageHeader` with eyebrow "← {brand}" link, serif "Import replies", the idempotency sentence.
- One `bg-base-200` card: a dashed drop area (`border-dashed border-base-300`, upload icon, the native file
  input styled `file-input-ghost`) and the Import button (neutral; the page's primary is the import itself, so
  ivory `btn-primary`).
- "Expected columns" as a row of mono chips, then the format notes and last-import time in muted text.
- Result: a card with a success check and "Imported file.csv", three tiles (new / already here / unmatched),
  unmatched emails as mono chips. Errors: soft warning alert (a bad file is the user's to fix, not critical).

**Out.** Drag-and-drop JS, preview of rows.

## 2. Technical plan

`import/page.tsx`, `import/ImportForm.tsx`, `import/loading.tsx`. The action and `useActionState` flow unchanged.

## 3. Verify by hand

Import the sample twice: second run shows 0 new, N already here; sidebar count updates after the first.

## 4. Review checklist

`required` and `accept` kept on the input; the error alert is not red.
