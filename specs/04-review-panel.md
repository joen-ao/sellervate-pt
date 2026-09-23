# 04 · Review panel
Branch `feat/review-panel` · No migration · Est. 60 min · Wave 2

## 1. Product
Where the judgement is recorded. Readable in one glance, submittable in under a minute. The brand guidelines are on screen because that is what the reply is judged against.

- Route `/reviews/[replyId]`: team lead with membership in the reply's brand; else 403. Unknown id → 404.
- Left: brand + channel + specialist + time; collapsible **Brand guidelines**; customer message; reply.
- Right (sticky): score 1–5 (big targets, keys 1–5); severity `none | minor | critical` (red, helper text "Factual or procedure error. This is the one that costs accounts."); category chips with human labels; comment (placeholder "What would you tell {specialist first name} about this one?"); **Save and next** / **Save**.
- Rules: `critical` requires ≥1 category; score required; comment optional; already reviewed by me → read-only card "Reviewed by you on …"; other leads' reviews not shown (P1).
- Out: editing, attachments, second-reviewer view.

## 2. Technical plan

### Files
```
lib/data/reviews.ts             # createReview, getReplyForReview
lib/validation/review.ts        # zod
app/reviews/[replyId]/page.tsx  loading.tsx  error.tsx
app/reviews/[replyId]/actions.ts
app/reviews/[replyId]/_components/{Exchange,GuidelinesPanel,ReviewForm,ReviewReadOnly}.tsx
```

### `lib/validation/review.ts`
```ts
import { z } from 'zod';
import { FAILURE_CATEGORIES } from '@/lib/types';

export const ReviewInput = z.object({
  replyId: z.string().uuid(),
  score: z.coerce.number().int().min(1).max(5),
  severity: z.enum(['none', 'minor', 'critical']),
  categories: z.array(z.enum(FAILURE_CATEGORIES)).max(6).default([]),
  comment: z.string().trim().max(2000).default(''),
  andNext: z.coerce.boolean().default(false),
}).refine(v => v.severity !== 'critical' || v.categories.length > 0, {
  path: ['categories'], message: 'Say which kind of critical error.',
});
export type ReviewInput = z.infer<typeof ReviewInput>;
```
Mirrors the DB check constraint `critical_needs_category`; the form gets the friendly message, the DB is the backstop.

### `lib/data/reviews.ts` (this branch adds; 06 adds `listMyReviews`/`acknowledgeReview` in its own file `lib/data/my-reviews.ts` to avoid conflicts)
```ts
export type ReplyForReview = {
  reply: Pick<Reply, 'id'|'customer_message'|'reply_text'|'sent_at'|'channel'>;
  brand: Pick<Brand, 'id'|'name'|'slug'|'voice_guidelines'>;
  specialist: Pick<Profile, 'id'|'full_name'>;
  myReview: Pick<Review, 'id'|'score'|'severity'|'categories'|'comment'|'created_at'> | null;
};

export async function getReplyForReview(replyId: string): Promise<ReplyForReview> {
  const u = await requireRole('team_lead');
  const { data } = await admin.from('replies')
    .select(`id, customer_message, reply_text, sent_at, channel, brand_id,
             brands!inner(id, name, slug, voice_guidelines),
             profiles!replies_specialist_id_fkey!inner(id, full_name)`)
    .eq('id', replyId).maybeSingle();
  if (!data) throw new NotFoundError('Reply');
  await assertBrandMember(u.id, data.brand_id);           // 403 before anything else is returned
  const { data: mine } = await admin.from('reviews')
    .select('id, score, severity, categories, comment, created_at')
    .eq('reply_id', replyId).eq('reviewer_id', u.id).maybeSingle();
  return { reply: data, brand: data.brands, specialist: data.profiles, myReview: mine ?? null };
}

export async function createReview(input: ReviewInput): Promise<{ id: string }> {
  const u = await requireRole('team_lead');
  const { data: reply } = await admin.from('replies').select('id, brand_id').eq('id', input.replyId).maybeSingle();
  if (!reply) throw new NotFoundError('Reply');
  await assertBrandMember(u.id, reply.brand_id);
  const { data, error } = await admin.from('reviews').insert({
    reply_id: input.replyId, reviewer_id: u.id, score: input.score,
    severity: input.severity, categories: input.categories, comment: input.comment,
  }).select('id').single();
  if (error?.code === '23505') throw new ConflictError('Already reviewed');
  if (error) throw error;
  return data;
}
```

### `app/reviews/[replyId]/actions.ts`
```ts
'use server';
export type ActionState = { fieldErrors?: Record<string,string[]>; formError?: string; values?: Record<string,any> } | null;

export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    replyId: formData.get('replyId'), score: formData.get('score'), severity: formData.get('severity'),
    categories: formData.getAll('categories'), comment: formData.get('comment'), andNext: formData.get('andNext') === '1',
  };
  const parsed = ReviewInput.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  try {
    await createReview(parsed.data);
  } catch (e) {
    if (e instanceof ConflictError) return { formError: 'Already reviewed by you.', values: raw };
    if (e instanceof ForbiddenError) forbidden();
    throw e;
  }
  revalidatePath('/queue'); revalidatePath('/me');
  if (parsed.data.andNext) {
    const next = await nextUnreviewedReplyId();
    redirect(next ? `/reviews/${next}` : '/queue?caught_up=1');
  }
  redirect(`/reviews/${parsed.data.replyId}`);
}
```
Note: `redirect()` throws; it must be outside the try/catch or re-thrown (`isRedirectError`). The agent will get this wrong first time — that is a review comment.

### `ReviewForm.tsx` (client component)
- `useActionState(submitReview, null)`; `useFormStatus` for the pending state on both buttons.
- Score: 5 `<label><input type="radio" name="score" value={n} className="sr-only"/>…` big buttons; `onKeyDown` at form level maps `1`–`5` to the radio when the textarea is not focused.
- Severity: 3 radios styled as segmented control; `critical` uses `--color-critical`.
- Categories: checkboxes `name="categories"` styled as chips; show `fieldErrors.categories` under them.
- Comment: `<textarea name="comment" rows={4}>`; keeps `values.comment` on error.
- Buttons: `Save and next` sets hidden `andNext=1` via `formAction`/`name="andNext"`.
- On `formError` show inline `<ErrorCard compact/>` above the buttons; never lose typed values.

### `page.tsx`
```ts
runPage(async () => {
  const data = await getReplyForReview((await params).replyId);
  return (
    <TwoColumn>
      <Exchange {...data} />                        // left; includes <GuidelinesPanel defaultOpen={false}/>
      {data.myReview ? <ReviewReadOnly review={data.myReview}/> : <ReviewForm replyId={data.reply.id} specialistFirstName=…/>}
    </TwoColumn>
  );
});
```
`GuidelinesPanel` is a `<details>` element, open by default on first review of a brand in this session? No — keep it simple: closed by default, with the first line of the guidelines visible as summary.

### UI
- `loading.tsx`: two-column skeleton (left two text blocks, right a card).
- `error.tsx`: `ErrorCard` with retry.
- Read-only card shows score pill, severity, chips, comment, "Reviewed by you on {date}" and a link "Back to queue".

## 3. Verify by hand
- Marta opens `/reviews/…107`: guidelines collapsed with Voltaire's first line visible; form works with keys 1–5.
- Pick `critical` with no category → inline error under chips, values intact.
- Submit with comment + "Save and next" → lands on 108; `/queue` counter dropped by one.
- Open `/reviews/…101` (already reviewed) → read-only card, no form.
- Reopen 107 → read-only card.
- As Dani, `curl -X POST` the server action is awkward; instead open `/reviews/…101` as Dani → forbidden page. As Nuria open `…101` → forbidden (not a member of Voltaire).
- Unknown id → not found page.

## 4. Review checklist
- Membership assert **before** any reply data is returned and before the insert?
- `categories` typed via `z.enum(FAILURE_CATEGORIES)` — no `z.array(z.string())`?
- Unique violation mapped to a friendly message; other errors still thrown?
- `redirect()` outside try/catch?
- Does the form keep state on validation error? Does "Save and next" degrade to "Save" when nothing is left?
- Any `useEffect` fetching data client-side? (should be none)
