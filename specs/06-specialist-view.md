# 06 · Specialist view
Branch `feat/specialist-view` · No migration · Est. 25 min · Wave 2

## 1. Product
"A specialist should see their own scores and whatever I wrote on them. Not everybody else's." Living proof of the isolation rule, and the smallest possible coaching loop: **Got it** marks the comment as read.

- Route `/me`: specialist only; leads → `/queue`.
- Summary (30 d): reviews received, avg, critical count — own only.
- List, newest first: brand, date, score pill, severity badge, category chips, lead's full comment, reviewer name; expand → customer message + reply.
- **Got it** per review → `acknowledged_at`. After: "Read on {date}".
- Unreviewed own replies not listed.
- Out: replying to feedback, seeing brand averages, seeing anyone else.

## 2. Technical plan

### Files
```
lib/data/my-reviews.ts          # separate file from reviews.ts to avoid merge conflicts with 04
app/me/page.tsx  loading.tsx  error.tsx  actions.ts
app/me/_components/{MySummary,MyReviewCard,AckButton}.tsx
app/api/me/reviews/route.ts     # curl-verifiable isolation
```

### `lib/data/my-reviews.ts`
```ts
export type MyReview = {
  id: string; replyId: string; brandName: string; brandSlug: string; reviewerName: string;
  score: number; severity: Severity; categories: FailureCategory[]; comment: string;
  createdAt: string; acknowledgedAt: string | null;
  customerMessage: string; replyText: string; sentAt: string;
};

export async function listMyReviews(): Promise<{ items: MyReview[]; summary: { n: number; avg: number | null; critical: number } }> {
  const u = await requireRole('specialist');
  const { data, error } = await admin.from('reviews')
    .select(`id, reply_id, score, severity, categories, comment, created_at, acknowledged_at,
             profiles!reviews_reviewer_id_fkey!inner(full_name),
             replies!inner(specialist_id, customer_message, reply_text, sent_at, brands!inner(name, slug))`)
    .eq('replies.specialist_id', u.id)            // the isolation line: in SQL, on the joined table
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const items = data.map(/* flatten */);
  const recent = items.filter(i => Date.parse(i.createdAt) > Date.now() - 30*864e5);
  const summary = { n: recent.length,
    avg: recent.length ? +(recent.reduce((s,i)=>s+i.score,0)/recent.length).toFixed(2) : null,
    critical: recent.filter(i => i.severity==='critical').length };
  return { items, summary };
}

export async function acknowledgeReview(reviewId: string): Promise<void> {
  const u = await requireRole('specialist');
  // ownership check in the same statement: update only if the review's reply is mine
  const { data, error } = await admin.from('reviews')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('id', reviewId).is('acknowledged_at', null)
    .in('reply_id', admin.from('replies').select('id').eq('specialist_id', u.id) as any) // if unsupported, do two queries: load review→reply→specialist_id, assert, then update
    .select('id');
  if (error) throw error;
  if (!data?.length) {
    // distinguish 403 from 'already acked' with one more read
    const { data: r } = await admin.from('reviews').select('reply_id, acknowledged_at, replies!inner(specialist_id)').eq('id', reviewId).maybeSingle();
    if (!r) throw new NotFoundError('Review');
    if (r.replies.specialist_id !== u.id) throw new ForbiddenError('Not your review');
    // already acknowledged → idempotent, fine
  }
}
```
Summary over 30 days is computed from ≤100 already-owned rows; acceptable in JS because the rows are already isolated in SQL and the set is tiny. Note that in DECISIONS as a deliberate exception.

### `actions.ts`
```ts
'use server';
export async function ackAction(formData: FormData) {
  const id = z.string().uuid().parse(formData.get('reviewId'));
  try { await acknowledgeReview(id); } catch (e) { if (e instanceof ForbiddenError) forbidden(); throw e; }
  revalidatePath('/me'); revalidatePath('/queue');
}
```

### `app/api/me/reviews/route.ts`
`GET` → `handle(() => listMyReviews())`. Lets the evaluator prove with curl that Dani's payload contains only his `specialist` id.

### Components
- `MySummary`: three small stats; critical shown in `--color-critical` only when > 0.
- `MyReviewCard`: header (brand tag, date, pill, severity badge), chips, comment in a quoted block with reviewer name, `<details>` "See the exchange" → customer message + reply, footer: `<AckButton/>` or "Read on {date}".
- `AckButton`: `<form action={ackAction}><input type=hidden name=reviewId/><button>Got it</button></form>`; `useFormStatus` for pending.
- Empty: "No feedback yet. When Marta or Nuria review one of your replies it shows up here." (names come from the specialist's lead members — or keep generic "your team lead" to avoid a query; generic is fine).

## 3. Verify by hand
- Dani: sees 101 (critical, no ack → button), 102 (acked → "Read on"), 104, 105, 202, 205; **not** 201/203/204/206 (Iker's).
- Click Got it on 101 → "Read on today"; `/queue` as Marta shows the check on 101.
- `curl localhost:3000/api/me/reviews -H "Cookie: app_user=$DANI" | jq '[.items[].replyId] | length'` → 6.
- `curl -X POST` the ack with Iker's review id as Dani → forbidden (or via UI: craft the form). Expect 403.
- `/me` as Marta → `/queue`.

## 4. Review checklist
- Is `specialist_id = me` a SQL filter on the joined table, not a JS filter?
- Does `acknowledgeReview` verify ownership before/within the update? Is it idempotent?
- Any brand-level aggregate leaking into the specialist page?
- Does the API route reuse the DAL?
