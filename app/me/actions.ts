'use server';
import { revalidatePath } from 'next/cache';
import { forbidden, notFound } from 'next/navigation';
import { z } from 'zod';
import { acknowledgeReview } from '@/lib/data/my-reviews';
import { getPendingCounts } from '@/lib/data/shell';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

// z.guid(), not z.uuid(): zod 4's uuid rejects the fixed seed ids.
const AckInput = z.object({ reviewId: z.guid() });

// Returns the sidebar's fresh counts: after an ack the card updates, but the
// root layout (where the count lives) is not reliably repainted.
export async function ackAction(formData: FormData): Promise<{ pending: Record<string, number> }> {
  const parsed = AckInput.safeParse({ reviewId: formData.get('reviewId') });
  if (!parsed.success) notFound();
  try {
    await acknowledgeReview(parsed.data.reviewId);
  } catch (e: unknown) {
    if (e instanceof ForbiddenError) forbidden();
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  revalidatePath('/', 'layout');
  return { pending: await getPendingCounts() };
}
