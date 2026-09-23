# P4 · Helpdesk ingestion
Branch `feat/ingestion` · Migration `0006_ingest.sql` · Est. 90 min · Depends on 01

## 1. Product
"Eventually this should pull the replies out of the helpdesk on its own. Not now. Just do not make it impossible later." V1 left `source`/`external_id`/`channel` and `unique(source, external_id)`. This walks through the door.

- `ingest_sources` per brand: kind `csv | gorgias | zendesk`, non-secret config, hashed bearer token.
- `POST /api/ingest/[sourceId]` with a normalised payload; upsert on `(source, external_id)`; unknown specialist email → `replies_unmatched`, never dropped.
- One real adapter: **CSV upload** at `/brands/[slug]/import` (lead). Gorgias/Zendesk are documented field mappings, not code.
- Machine identity: bearer per source, not a user cookie. First non-human principal in the app — a paragraph in DECISIONS.
- Payload can never write into another brand: `brand_id` comes from the source row.
- Out: OAuth, polling, two-way sync, attachments.

## 2. Technical plan

### Migration `0006_ingest.sql`
```sql
create table if not exists ingest_sources (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  kind text not null check (kind in ('csv','gorgias','zendesk')),
  name text not null,
  config jsonb not null default '{}',
  token_hash text,                       -- sha256 of bearer; null for csv (UI-only)
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists replies_unmatched (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references ingest_sources(id) on delete cascade,
  external_id text not null,
  payload jsonb not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (source_id, external_id)
);
alter table ingest_sources enable row level security; alter table ingest_sources force row level security;
create policy ingest_sources_lead on ingest_sources for all
  using ((select current_app_role())='team_lead' and is_brand_member(brand_id))
  with check ((select current_app_role())='team_lead' and is_brand_member(brand_id));
alter table replies_unmatched enable row level security; alter table replies_unmatched force row level security;
create policy replies_unmatched_lead on replies_unmatched for select
  using (exists (select 1 from ingest_sources s where s.id = source_id and is_brand_member(s.brand_id)));
```
`replies.source` stays `text`; convention `source = ingest_sources.id::text` for ingested rows, `'seed'` for seed. Add `replies.ingested_at timestamptz` (nullable) in the same migration.

### Payload schema (`lib/validation/ingest.ts`)
```ts
export const IngestItem = z.object({
  external_id: z.string().min(1).max(200),
  specialist_email: z.string().email(),
  customer_message: z.string().min(1).max(20000),
  reply_text: z.string().min(1).max(20000),
  sent_at: z.string().datetime(),
  channel: z.enum(['email','amazon','shopify','walmart']).default('email'),
});
export const IngestBatch = z.array(IngestItem).min(1).max(500);
```

### `lib/data/ingest.ts`
```ts
export async function ingestBatch(sourceId: string, items: IngestItem[], principal: { kind:'token' } | { kind:'user'; userId: string }) {
  const { data: src } = await admin.from('ingest_sources').select('id, brand_id, kind').eq('id', sourceId).maybeSingle();
  if (!src) throw new NotFoundError('Source');
  if (principal.kind === 'user') { await requireRole('team_lead'); await assertBrandMember(principal.userId, src.brand_id); }
  const emails = [...new Set(items.map(i => i.specialist_email))];
  const { data: people } = await admin.from('profiles').select('id, email').in('email', emails);
  const byEmail = new Map(people?.map(p => [p.email, p.id]));
  const ok = [], bad = [];
  for (const it of items) {
    const sid = byEmail.get(it.specialist_email);
    if (!sid) { bad.push({ source_id: src.id, external_id: it.external_id, payload: it, reason: 'unknown_specialist' }); continue; }
    ok.push({ brand_id: src.brand_id, specialist_id: sid, customer_message: it.customer_message, reply_text: it.reply_text,
              sent_at: it.sent_at, channel: it.channel, source: src.id, external_id: it.external_id, ingested_at: new Date().toISOString() });
  }
  if (ok.length)  await admin.from('replies').upsert(ok,  { onConflict: 'source,external_id', ignoreDuplicates: true });
  if (bad.length) await admin.from('replies_unmatched').upsert(bad, { onConflict: 'source_id,external_id', ignoreDuplicates: true });
  await admin.from('ingest_sources').update({ last_synced_at: new Date().toISOString() }).eq('id', src.id);
  return { inserted: ok.length, unmatched: bad.length };
}
```
Membership of the specialist in the brand is **not** enforced here on purpose (a helpdesk may show a reply by someone not yet in `brand_members`); the row lands, the lead sees it, and the gap is visible. Write that down.

### Route `app/api/ingest/[sourceId]/route.ts`
Bearer → `sha256` → compare with `token_hash` (constant-time). Rate limit not needed locally. Reject if source `kind='csv'` (UI-only). Respond `{inserted, unmatched}`.

### CSV import `app/brands/[slug]/import/page.tsx` + action
`<input type=file accept=.csv>`; parse with `papaparse` server-side (dynamic import) → map columns `external_id,specialist_email,customer_message,reply_text,sent_at,channel` → `IngestBatch.parse` → `ingestBatch(src.id, items, {kind:'user', userId})`. Result page shows counts and lists unmatched emails. Sample file at `docs/import-sample.csv`.

Seed `seed/ingest.sql`: one csv source per brand; one gorgias source for Voltaire with `token_hash = sha256('voltaire-dev-token')`, documented in README.

## 3. Verify by hand
```bash
curl -s -X POST localhost:3000/api/ingest/$VOLTAIRE_SRC -H "Authorization: Bearer voltaire-dev-token" -H 'content-type: application/json' --data @docs/ingest-sample.json   # {"inserted":3,"unmatched":1}
# again → {"inserted":0,"unmatched":0}
curl -s -X POST localhost:3000/api/ingest/$KRAFT_SRC -H "Authorization: Bearer voltaire-dev-token" ...  # 403
```
UI: import `docs/import-sample.csv` twice for Kraft&Co as Marta → 10 then 0 new; as Nuria → 403.

## 4. Review checklist
- `brand_id` taken from the source row, never from payload?
- Token compared constant-time; hash stored, not token?
- Upsert idempotent (`ignoreDuplicates`) — re-import does not overwrite edited seed rows?
- `papaparse` imported server-side only?
- New tables have RLS?
