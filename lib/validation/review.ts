import { z } from 'zod';
import { FAILURE_CATEGORIES } from '@/lib/types';

// z.guid(), not z.uuid(): zod 4's uuid() rejects the fixed seed ids
// (00000000-0000-0000-0000-0000000000NN), which have no version nibble.
export const ReplyId = z.guid();

const SCORE_MSG = 'Pick a score from 1 to 5.';

export const ReviewInput = z.object({
  replyId: ReplyId,
  score: z.coerce.number({ error: SCORE_MSG }).int(SCORE_MSG).min(1, SCORE_MSG).max(5, SCORE_MSG),
  severity: z.enum(['none', 'minor', 'critical'], { error: 'Pick a severity.' }),
  categories: z.array(z.enum(FAILURE_CATEGORIES)).max(6).default([]),
  comment: z.string().trim().max(2000).default(''),
  andNext: z.coerce.boolean().default(false),
}).refine(v => v.severity !== 'critical' || v.categories.length > 0, {
  // mirrors the DB constraint critical_needs_category; the DB stays the backstop
  path: ['categories'], message: 'Say which kind of critical error.',
});
export type ReviewInput = z.infer<typeof ReviewInput>;
