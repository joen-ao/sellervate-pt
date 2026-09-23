# P1 · Calibration between team leads
Branch `feat/calibration` · Migration `0003_calibration.sql` · Est. 90 min · Depends on 04

## 1. Product
"Marta covers four of the six, Nuria the rest, so neither sees the whole picture." Two leads scoring the same reply differently means the number shown to a brand is Marta's taste, not a standard. Calibration makes the scale visible.

- Any lead who is a member can flag a reply **Send to calibration** from the queue or the review panel.
- Queue gets a `calibration` status filter: flagged replies I have not reviewed yet.
- `/calibration`: replies with ≥2 reviews, side by side (score, severity, categories, comment per lead), sorted by score delta desc, then by severity mismatch.
- No arbitration, no "correct" answer in V2. Specialists never see this page; `/me` shows the **most recent** review only (documented simplification).
- Out: blind review (hiding the first review from the second), cross-brand calibration sets.

## 2. Technical plan

### Migration `0003_calibration.sql`
```sql
alter table replies add column if not exists calibration boolean not null default false;
alter table replies add column if not exists calibration_requested_by uuid references profiles(id);
create index if not exists replies_calibration_idx on replies (brand_id) where calibration;

-- RLS: leads may flip the flag on member-brand replies
drop policy if exists replies_update_calibration on replies;
create policy replies_update_calibration on replies for update
  using ((select current_app_role()) = 'team_lead' and is_brand_member(brand_id))
  with check ((select current_app_role()) = 'team_lead' and is_brand_member(brand_id));

create or replace function calibration_pairs(p_brand_ids uuid[])
returns table (reply_id uuid, brand_id uuid, sent_at timestamptz, review_count int, score_delta int, severity_mismatch boolean)
language sql stable as $$
  select r.id, r.brand_id, r.sent_at, count(v.*)::int,
         (max(v.score) - min(v.score))::int,
         count(distinct v.severity) > 1
  from replies r join reviews v on v.reply_id = r.id
  where r.brand_id = any(p_brand_ids)
  group by r.id having count(v.*) >= 2
  order by 5 desc, 6 desc, r.sent_at desc;
$$;
```
Seed `seed/calibration.sql`: Nuria added as second lead on Kraft&Co (`brand_members`), flags 201 and 203, and reviews both (201: score 4 vs Marta's 3; 203: 5 vs 5). Marta reviews Lume? No — keep Marta off Lume so her isolation case stays intact.

### Files
```
lib/data/calibration.ts        # flagForCalibration(replyId), listCalibrationPairs(), getCalibrationDetail(replyId)
app/calibration/page.tsx loading.tsx error.tsx
app/calibration/[replyId]/page.tsx
app/queue: add status 'calibration' to QueueStatus + filter chip (touches 03's file: coordinate — do it after 03 merges)
app/reviews/[replyId]/_components/CalibrationToggle.tsx  # server action form
```

### DAL sketch
```ts
export async function flagForCalibration(replyId: string, on: boolean) {
  const u = await requireRole('team_lead');
  const { data: r } = await admin.from('replies').select('id, brand_id').eq('id', replyId).maybeSingle();
  if (!r) throw new NotFoundError('Reply');
  await assertBrandMember(u.id, r.brand_id);
  await admin.from('replies').update({ calibration: on, calibration_requested_by: on ? u.id : null }).eq('id', replyId);
}
export async function listCalibrationPairs() {
  const u = await requireRole('team_lead');
  const ids = await getMemberBrandIds(u.id);
  const { data } = await admin.rpc('calibration_pairs', { p_brand_ids: ids });
  // hydrate brand names + both reviews via one query on reviews with reviewer names
}
```
Queue: `status === 'calibration'` → `.eq('calibration', true)` and "not reviewed by me" (`reviews.reviewer_id != me` or no review by me — do this as a SQL function `queue_calibration(p_user, p_brand_ids)` if PostgREST embedding is awkward).

### UI
- `/calibration`: table — brand, sent, Δscore (big, amber ≥2, red ≥3), severity mismatch badge, reviewers → row link to detail.
- Detail: the exchange on the left (reuse `Exchange`), two `ReviewReadOnly` cards side by side with reviewer names, delta callout.
- Toggle on review panel: "Send to calibration" / "In calibration ✓".
- Empty: "No calibration pairs yet. Flag a reply and ask another lead to review it."

## 3. Verify by hand
- Marta flags 202; Nuria (now on Kraft&Co) sees it under `?status=calibration`, reviews it; `/calibration` shows 202 with Δ.
- Δ sort correct; severity mismatch badge appears where severities differ.
- Nuria's `/calibration` shows only Kraft&Co + Lume pairs; Marta's excludes Lume.
- Dani `/me` for 201 shows one review (most recent) and the page is unchanged otherwise.

## 4. Review checklist
- Update policy on `replies` scoped to leads + membership; specialists cannot flip the flag via API?
- New column indexed partially, not fully?
- Queue change did not weaken the 03 membership check?
