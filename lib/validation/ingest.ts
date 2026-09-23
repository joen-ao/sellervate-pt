import { z } from 'zod';

// The normalised shape every adapter maps to: the CSV upload today, a Gorgias
// or Zendesk mapper later (docs/ingestion.md). brand_id is deliberately absent:
// it comes from the source row, never from the payload.
export const IngestItem = z.object({
  external_id: z.string().min(1).max(200),
  specialist_email: z.email(),
  customer_message: z.string().min(1).max(20000),
  reply_text: z.string().min(1).max(20000),
  sent_at: z.iso.datetime({ offset: true }),
  channel: z.enum(['email', 'amazon', 'shopify', 'walmart']).default('email'),
});
export type IngestItem = z.infer<typeof IngestItem>;

export const IngestBatch = z.array(IngestItem).min(1).max(500);

// z.guid(), not z.uuid(): the fixed seed ids have no version nibble.
export const SourceId = z.guid();
