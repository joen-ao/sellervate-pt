import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { admin } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/current-user';
import { assertBrandMember, resolveMemberBrand } from '@/lib/data/membership';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { IngestItem } from '@/lib/validation/ingest';

// Who is pushing replies in. Two principals, never mixed:
// - 'token': a helpdesk holding a source's bearer. It is checked here, against
//   the source row, so no caller can claim "token" without the token itself.
// - 'user': a lead uploading a CSV. Identity comes from getCurrentUser(), never
//   from the caller of this function.
export type IngestPrincipal = { kind: 'token'; token: string } | { kind: 'user' };

export type IngestResult = {
  inserted: number;        // new replies; re-sent external_ids are not counted
  unmatched: number;       // new rows in replies_unmatched
  duplicates: number;      // matched items that already existed, left untouched
  unmatchedEmails: string[];
};

const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest();

function tokenMatches(token: string, storedHex: string | null): boolean {
  if (!storedHex || !/^[0-9a-f]{64}$/.test(storedHex)) return false;
  // both sides are 32-byte digests, so timingSafeEqual never sees a length mismatch
  return timingSafeEqual(sha256(token), Buffer.from(storedHex, 'hex'));
}

async function authorizeSource(sourceId: string, principal: IngestPrincipal) {
  const { data: src, error } = await admin.from('ingest_sources')
    .select('id, brand_id, kind, token_hash').eq('id', sourceId).maybeSingle();
  if (error) throw error;
  if (!src) throw new NotFoundError('Source');

  if (principal.kind === 'token') {
    // csv sources have no token and are UI-only
    if (src.kind === 'csv' || !tokenMatches(principal.token, src.token_hash)) {
      throw new ForbiddenError('Invalid token for this source');
    }
  } else {
    const u = await requireRole('team_lead');
    await assertBrandMember(u.id, src.brand_id);
    if (src.kind !== 'csv') throw new ForbiddenError('This source accepts API pushes only');
  }
  return { id: src.id, brandId: src.brand_id };
}

// Upsert on (source, external_id) with ignoreDuplicates: a re-sent item never
// overwrites a row that is already there (or its reviews). brand_id always
// comes from the source row. The specialist's brand membership is NOT checked
// on purpose: a helpdesk may show a reply by someone not yet in brand_members;
// the row lands and the gap is visible to the lead (DECISIONS.md).
export async function ingestBatch(
  sourceId: string, items: IngestItem[], principal: IngestPrincipal,
): Promise<IngestResult> {
  const src = await authorizeSource(sourceId, principal);
  const now = new Date().toISOString();

  const emails = [...new Set(items.map(i => i.specialist_email.toLowerCase()))];
  const { data: people, error: pErr } = await admin.from('profiles')
    .select('id, email').in('email', emails);
  if (pErr) throw pErr;
  const byEmail = new Map(people.map(p => [p.email.toLowerCase(), p.id]));

  const ok = [];
  const bad = [];
  for (const it of items) {
    const specialistId = byEmail.get(it.specialist_email.toLowerCase());
    if (!specialistId) {
      bad.push({ source_id: src.id, external_id: it.external_id, payload: it, reason: 'unknown_specialist' });
      continue;
    }
    ok.push({
      brand_id: src.brandId, specialist_id: specialistId,
      customer_message: it.customer_message, reply_text: it.reply_text,
      sent_at: it.sent_at, channel: it.channel,
      source: src.id, external_id: it.external_id, ingested_at: now,
    });
  }

  // .select() after an ignoreDuplicates upsert returns only the rows actually
  // inserted (ON CONFLICT DO NOTHING RETURNING), which is what makes a re-import
  // report 0 instead of the batch size.
  let inserted = 0;
  if (ok.length) {
    const { data, error } = await admin.from('replies')
      .upsert(ok, { onConflict: 'source,external_id', ignoreDuplicates: true }).select('id');
    if (error) throw error;
    inserted = data.length;
  }
  let unmatched = 0;
  if (bad.length) {
    const { data, error } = await admin.from('replies_unmatched')
      .upsert(bad, { onConflict: 'source_id,external_id', ignoreDuplicates: true }).select('id');
    if (error) throw error;
    unmatched = data.length;
  }

  const { error: sErr } = await admin.from('ingest_sources')
    .update({ last_synced_at: now }).eq('id', src.id);
  if (sErr) throw sErr;

  return {
    inserted, unmatched, duplicates: ok.length - inserted,
    unmatchedEmails: [...new Set(bad.map(b => b.payload.specialist_email))],
  };
}

// The import page's read: the brand (lead + member, 404/403 as elsewhere) and
// its CSV source, or null if the brand has none configured.
export async function getCsvImportSource(slug: string) {
  const u = await requireRole('team_lead');
  const brand = await resolveMemberBrand(u.id, slug);
  const { data, error } = await admin.from('ingest_sources')
    .select('id, name, last_synced_at')
    .eq('brand_id', brand.id).eq('kind', 'csv')
    .order('created_at').limit(1).maybeSingle();
  if (error) throw error;
  return { brand: { id: brand.id, name: brand.name, slug: brand.slug }, source: data };
}
