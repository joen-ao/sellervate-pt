# 03 · Review queue
Branch `feat/review-queue` · No migration · Est. 45 min · Wave 2

## 1. Product
Marta opens the tool Monday, sees what her specialists sent yesterday, and gets through five fast. "Review next" is the sampling mechanism: the lead never has to choose.

- Route `/queue`, team lead only; specialists → `/me`.
- Default window last 48 h; filters: brand (member brands), status (`unreviewed` default | `reviewed` | `all`); `?page=`.
- Row: brand tag, specialist, relative time, first 120 chars of customer message and reply, status pill (score + red dot if critical, check if acknowledged).
- Counter "12 unreviewed · 2 brands".
- Out: search, bulk actions, assignment, keyboard nav (only if time remains at the end).

## 2. Technical plan

### Files
```
lib/data/replies.ts
app/queue/page.tsx  loading.tsx  error.tsx
app/queue/_components/QueueFilters.tsx   # server component, links not state
app/queue/_components/QueueRow.tsx
app/queue/_components/ReviewNextButton.tsx
components/{Pill,SeverityDot,EmptyState,ErrorCard,Skeleton}.tsx  (create if missing)
```

### `lib/data/replies.ts`
```ts
import 'server-only';
import { admin } from '@/lib/supabase/admin';
import { requireRole, requireUser } from '@/lib/current-user';
import { getMemberBrandIds, resolveMemberBrand } from './membership';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { PAGE_SIZE, hoursAgo } from './_shared';

export type QueueStatus = 'unreviewed' | 'reviewed' | 'all';
export type QueueFilter = { brandSlug?: string; status: QueueStatus; page: number; windowHours?: number };

export type QueueItem = {
  id: string; brandName: string; brandSlug: string; specialistName: string;
  sentAt: string; customerSnippet: string; replySnippet: string;
  review: null | { score: number; severity: 'none'|'minor'|'critical'; acknowledgedAt: string | null };
};

export async function listQueue(f: QueueFilter): Promise<{ items: QueueItem[]; total: number; unreviewedTotal: number; brandCount: number }> {
  const u = await requireRole('team_lead');
  const memberIds = await getMemberBrandIds(u.id);
  if (memberIds.length === 0) return { items: [], total: 0, unreviewedTotal: 0, brandCount: 0 };

  const brandIds = f.brandSlug
    ? [(await resolveMemberBrand(u.id, f.brandSlug)).id]   // 403/404 if outside membership
    : memberIds;

  const from = (f.page - 1) * PAGE_SIZE;
  let q = admin.from('replies')
    .select(`id, sent_at, customer_message, reply_text,
             brands!inner(name, slug), profiles!replies_specialist_id_fkey!inner(full_name),
             reviews!left(score, severity, acknowledged_at, reviewer_id)`, { count: 'exact' })
    .in('brand_id', brandIds)
    .gte('sent_at', hoursAgo(f.windowHours ?? 48))
    .order('sent_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  // status filter must be in SQL: use the reviewer-scoped "has review" via a filter on the joined table
  if (f.status === 'unreviewed') q = q.is('reviews', null);
  if (f.status === 'reviewed')   q = q.not('reviews', 'is', null);
  // NOTE: PostgREST null-filter on an embedded resource requires the `!left` join above.

  const { data, error, count } = await q;
  if (error) throw error;

  const unreviewed = await admin.from('replies').select('id', { count: 'exact', head: true })
    .in('brand_id', brandIds).gte('sent_at', hoursAgo(f.windowHours ?? 48)).is('reviews', null);

  return {
    items: data.map(r => ({
      id: r.id, brandName: r.brands.name, brandSlug: r.brands.slug,
      specialistName: r.profiles.full_name, sentAt: r.sent_at,
      customerSnippet: r.customer_message.slice(0, 120), replySnippet: r.reply_text.slice(0, 120),
      review: r.reviews[0] ? { score: r.reviews[0].score, severity: r.reviews[0].severity, acknowledgedAt: r.reviews[0].acknowledged_at } : null,
    })),
    total: count ?? 0, unreviewedTotal: unreviewed.count ?? 0, brandCount: brandIds.length,
  };
}

// Oldest unreviewed in the lead's brands (optionally one brand). Null → caught up.
export async function nextUnreviewedReplyId(brandSlug?: string): Promise<string | null> {
  const u = await requireRole('team_lead');
  const memberIds = await getMemberBrandIds(u.id);
  const brandIds = brandSlug ? [(await resolveMemberBrand(u.id, brandSlug)).id] : memberIds;
  const { data } = await admin.from('replies').select('id, reviews!left(id)')
    .in('brand_id', brandIds).is('reviews', null)
    .order('sent_at', { ascending: true }).limit(1).maybeSingle();
  return data?.id ?? null;
}
```
If the embedded-null filter fights PostgREST, fall back to a SQL function `queue_items(p_brand_ids uuid[], p_status text, p_since timestamptz, p_limit int, p_offset int)` in migration slot `0001b` — no: keep `0001` untouched; add it as `supabase/migrations/0001_1_queue_fn.sql` only if needed and say so in the PR. The DAL signature does not change either way.

### `app/queue/page.tsx` (server component)
```ts
export default async function QueuePage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  return runPage(async () => {
    const sp = await searchParams;
    const status = (['unreviewed','reviewed','all'] as const).includes(sp.status as any) ? sp.status as QueueStatus : 'unreviewed';
    const page = Math.max(1, Number(sp.page ?? 1) || 1);
    const u = await requireRole('team_lead');           // specialists: redirect('/me') before this
    const brands = await listMemberBrands(u.id);         // small helper in membership.ts: id,name,slug
    const data = await listQueue({ brandSlug: sp.brand, status, page });
    return <QueueView brands={brands} data={data} filter={{ brand: sp.brand, status, page }} />;
  });
}
```
Role redirect: `if ((await getCurrentUser())?.role === 'specialist') redirect('/me')` at the top.

### Components
- `QueueFilters`: brand chips as `<Link href={{ pathname:'/queue', query:{...} }}>`; status segmented control same way. No client state.
- `ReviewNextButton`: `<form action={goNext}>` where `goNext` is a server action calling `nextUnreviewedReplyId(brandSlug)` then `redirect('/reviews/'+id)` or `redirect('/queue?caught_up=1')`.
- `QueueRow`: `<Link href={/reviews/${id}}>` whole row; right side `<Pill score/>` + `<SeverityDot/>` + ack check.
- `loading.tsx`: 8 skeleton rows, same height (`h-16`) as `QueueRow`.
- `error.tsx`: client component with `reset()` → `<ErrorCard title="Couldn't load the queue" onRetry={reset}/>`.
- Empty states inside `QueueView`:
  - no unreviewed: `EmptyState` "You're caught up." + subtitle listing brand names + link to `?status=reviewed`.
  - brand filter empty: "No replies from {brand} in the last 48 h."

### Formatting
`lib/format.ts`: `relativeTime(iso)` → "yesterday 16:42" / "today 09:10" / "3 days ago". Deterministic, no library.

## 3. Verify by hand
- Marta: `/queue` shows Voltaire + Kraft&Co rows only; counter says 7 unreviewed; "Review next" opens reply 107 (oldest unreviewed yesterday).
- Nuria: only Lume; 2 unreviewed.
- `/queue?brand=lume` as Marta → forbidden page. `/queue?brand=nope` → not found.
- `/queue` as Dani → lands on `/me`.
- `/queue?status=reviewed`: rows show pills; reply 101 shows red dot; 102 shows ack check.
- Kill the DB (`supabase stop`) and reload → error card with retry, not a white page.

## 4. Review checklist
- Is the 48 h boundary computed server-side from `Date.now()`, not in the browser?
- Brand filter validated through `resolveMemberBrand` **before** the query? Any `.in('brand_id', …)` built from a param?
- Any client-side `.filter()` on rows? Any `useState` for filters?
- Are the join names in `.select()` correct against `database.types.ts` (the specialist FK name in particular)?
- Skeleton row height equals real row height?
