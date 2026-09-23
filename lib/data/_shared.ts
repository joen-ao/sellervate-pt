export const REPLY_COLUMNS =
  'id, brand_id, specialist_id, customer_message, reply_text, sent_at, channel, source, external_id' as const;
export const REVIEW_COLUMNS =
  'id, reply_id, reviewer_id, score, severity, categories, comment, created_at, acknowledged_at' as const;
export const PAGE_SIZE = 25;
export const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
