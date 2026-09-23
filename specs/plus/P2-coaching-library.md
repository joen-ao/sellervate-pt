# P2 · Coaching library
Branch `feat/coaching-library` · Migration `0004_exemplars.sql` · Est. 90 min · Depends on 04

## 1. Product
"When somebody new joins we sit them down with the good ones and the bad ones and explain the difference." Every review already holds an example and the why; the library is a filter.

- Review panel: **Use as example** checkbox (lead). Sets `reviews.is_exemplar`.
- `/brands/[slug]/library`: **Good** (exemplar, score ≥4) and **What not to do** (exemplar, score ≤2 or critical). Card = customer message, reply, chips, lead's comment as the "why". Guidelines pinned at top.
- Author names hidden by default; lead toggle "show authors". Specialists with membership can read the library — the one deliberate widening of the specialist rule, anonymised, exemplars only.
- Out: curated ordering, export, comments on examples.

## 2. Technical plan

### Migration `0004_exemplars.sql`
```sql
alter table reviews add column if not exists is_exemplar boolean not null default false;
create index if not exists reviews_exemplar_idx on reviews (reply_id) where is_exemplar;

-- widen specialist read: exemplar replies in member brands, regardless of author
drop policy if exists replies_select_exemplar on replies;
create policy replies_select_exemplar on replies for select
  using (is_brand_member(brand_id)
         and exists (select 1 from reviews v where v.reply_id = id and v.is_exemplar));
-- reviews_select already delegates to replies; exemplar reviews become visible via the new replies policy.
-- lead may set the flag on member-brand reviews
drop policy if exists reviews_update_exemplar on reviews;
create policy reviews_update_exemplar on reviews for update
  using ((select current_app_role()) = 'team_lead'
         and exists (select 1 from replies r where r.id = reply_id and is_brand_member(r.brand_id)))
  with check (true);
```
Careful: `reviews_update_ack` (07) also exists. Postgres ORs permissive policies for the same command, so a specialist could hit the exemplar update path? No — `using` on `reviews_update_exemplar` requires team_lead. But a lead could now update `acknowledged_at`? `with check (true)` allows any column. Tighten: add a trigger `reviews_guard_columns` that raises if a lead changes `acknowledged_at` or a specialist changes anything but `acknowledged_at`. Simple `before update` trigger reading `current_app_role()`. This is the kind of thing worth a sentence in DECISIONS.

Seed `seed/exemplars.sql`: mark 101, 102, 202, 203 as exemplars.

### Files
```
lib/data/library.ts            # listLibrary(slug, { showAuthors }), setExemplar(reviewId, on)
app/brands/[slug]/library/page.tsx loading.tsx error.tsx
app/brands/[slug]/library/_components/{LibraryCard,AuthorToggle}.tsx
app/reviews/[replyId]/_components/ExemplarToggle.tsx
```
`listLibrary`: `requireUser()` (either role) + `resolveMemberBrand`; select reviews `is_exemplar` joined to replies in that brand; split into good/bad in SQL (`case`), return author name only if `showAuthors && role === 'team_lead'`.

Route guard nuance: a specialist hitting `/brands/[slug]` (05) still gets 403; only `/library` under it is open to members. Put the library page's own `requireUser` — do not inherit a layout guard from 05.

### UI
Two columns on wide, tabs on narrow. Card: chips on top, exchange, then a highlighted "Why" block with the comment. Bad column cards carry the severity badge; red only for critical.

## 3. Verify by hand
- Marta marks 104 as exemplar → appears under "What not to do" in Voltaire library.
- Dani opens `/brands/voltaire/library` → sees it, no author names; `/brands/voltaire` → 403 still.
- Iker `/brands/voltaire/library` → 403.
- RLS proof: as Dani, `select count(*) from replies where specialist_id <> dani` → equals number of Voltaire/Kraft&Co exemplars not his (2), not 0 anymore — expected, documented.

## 4. Review checklist
- Column-guard trigger present? Lead cannot change `acknowledged_at`; specialist cannot change `is_exemplar`?
- Author names never in the payload when hidden (not just hidden in JSX)?
- Library page has its own auth, not inherited?
