'use server';
import { revalidatePath } from 'next/cache';
import { forbidden, notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { createReview, nextUnreviewedReplyId } from '@/lib/data/reviews';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { ReviewInput } from '@/lib/validation/review';

export type ActionState = {
  fieldErrors?: Partial<Record<keyof ReviewInput, string[]>>;
  formError?: string;
} | null;

// Typed values live in the form's own state (controlled inputs), so returning an
// error never clears them; the action only reports what went wrong.
export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = ReviewInput.safeParse({
    replyId: formData.get('replyId'),
    score: formData.get('score') ?? undefined,
    severity: formData.get('severity') ?? undefined,
    categories: formData.getAll('categories'),
    comment: formData.get('comment') ?? undefined,
    andNext: formData.get('andNext') === '1',
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  let brandId: string;
  try {
    ({ brandId } = await createReview(parsed.data));
  } catch (e: unknown) {
    if (e instanceof ConflictError) return { formError: 'Already reviewed by you.' };
    if (e instanceof ForbiddenError) forbidden();
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  // redirect() throws, so it stays outside the try/catch above
  revalidatePath('/queue');
  revalidatePath('/me');
  if (parsed.data.andNext) {
    const next = await nextUnreviewedReplyId(brandId);
    redirect(next ? `/reviews/${next}` : '/queue?caught_up=1');
  }
  redirect(`/reviews/${parsed.data.replyId}`);
}
