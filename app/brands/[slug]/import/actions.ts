'use server';
import { revalidatePath } from 'next/cache';
import { forbidden, notFound } from 'next/navigation';
import { getCsvImportSource, ingestBatch, type IngestResult } from '@/lib/data/ingest';
import { getPendingCounts } from '@/lib/data/shell';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { IngestBatch } from '@/lib/validation/ingest';

export type ImportState = {
  result?: IngestResult; fileName?: string; error?: string;
  pending?: Record<string, number>; // the sidebar's fresh counts, applied by ImportForm
} | null;

const MAX_BYTES = 2_000_000;
const COLUMNS = ['external_id', 'specialist_email', 'customer_message', 'reply_text', 'sent_at', 'channel'] as const;

export async function importCsv(slug: string, _prev: ImportState, formData: FormData): Promise<ImportState> {
  try {
    // Access first: nothing in the file is read for someone who may not import.
    const { source } = await getCsvImportSource(slug);
    if (!source) return { error: 'This brand has no CSV source configured.' };

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) return { error: 'Choose a .csv file first.' };
    if (file.size > MAX_BYTES) return { error: 'File is over 2 MB. Split it and import in parts.' };

    // Server-side only, loaded when an import actually happens.
    const { default: Papa } = await import('papaparse');
    const parsedCsv = Papa.parse<Record<string, string>>(await file.text(), {
      header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim().toLowerCase(),
    });
    const missing = COLUMNS.filter(c => c !== 'channel' && !parsedCsv.meta.fields?.includes(c));
    if (missing.length) return { error: `Missing column(s): ${missing.join(', ')}.` };

    const rows = parsedCsv.data.map(r => Object.fromEntries(
      COLUMNS.map(c => [c, r[c]?.trim() || undefined]),   // empty channel → schema default
    ));
    const batch = IngestBatch.safeParse(rows);
    if (!batch.success) {
      const i = batch.error.issues[0];
      const [row, field] = i.path;
      // +2: header line, and rows are 1-based for the person reading the file
      const where = typeof row === 'number' ? `Row ${row + 2}${field ? `, ${String(field)}` : ''}: ` : '';
      return { error: `${where}${i.message}` };
    }

    const result = await ingestBatch(source.id, batch.data, { kind: 'user' });
    revalidatePath('/', 'layout');
    return { result, fileName: file.name, pending: await getPendingCounts() };
  } catch (e: unknown) {
    if (e instanceof ForbiddenError) forbidden();
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
}
