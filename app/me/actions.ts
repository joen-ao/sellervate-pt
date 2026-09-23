'use server';
import { revalidatePath } from 'next/cache';
import { forbidden, notFound } from 'next/navigation';
import { z } from 'zod';
import { acknowledgeReview } from '@/lib/data/my-reviews';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

// z.guid(), not z.uuid(): zod 4's uuid rejects the fixed seed ids.
const AckInput = z.object({ reviewId: z.guid() });

export async function ackAction(formData: FormData) {
  const parsed = AckInput.safeParse({ reviewId: formData.get('reviewId') });
  if (!parsed.success) notFound();
  try {
    await acknowledgeReview(parsed.data.reviewId);
  } catch (e: unknown) {
    if (e instanceof ForbiddenError) forbidden();
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  revalidatePath('/me');
  revalidatePath('/queue');
}
