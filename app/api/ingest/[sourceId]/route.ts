import { NextResponse } from 'next/server';
import { handle } from '@/app/api/_lib/respond';
import { ingestBatch } from '@/lib/data/ingest';
import { IngestBatch, SourceId } from '@/lib/validation/ingest';

// Machine-to-machine: a helpdesk pushes a normalised batch with its source's
// bearer token. No user cookie is read here. The token is checked in the DAL
// against the source row (hash, constant-time); brand_id comes from that row.
export async function POST(req: Request, { params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await params;
  if (!SourceId.safeParse(sourceId).success) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }
  const token = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') ?? '')?.[1];
  if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }
  const parsed = IngestBatch.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 20)
      .map(i => ({ path: i.path.join('.'), message: i.message }));
    return NextResponse.json({ error: 'Invalid payload', issues }, { status: 400 });
  }

  return handle(async () => {
    const { inserted, unmatched } = await ingestBatch(sourceId, parsed.data, { kind: 'token', token });
    return { inserted, unmatched };
  });
}
