'use server';
import { revalidatePath } from 'next/cache';
import { forbidden, notFound } from 'next/navigation';
import { z } from 'zod';
import { NOTE_MAX, PeriodInput, saveWorkingOn } from '@/lib/data/report';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export type WorkingOnState = { ok: true; savedAt: string } | { ok: false; error: string } | null;

// slug and period only name the resource; who may write is decided by the DAL.
const Input = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  period: PeriodInput,
  workingOn: z.string().trim().max(NOTE_MAX, `Keep it under ${NOTE_MAX} characters.`),
});

export async function saveWorkingOnAction(_prev: WorkingOnState, formData: FormData): Promise<WorkingOnState> {
  const parsed = Input.safeParse({
    slug: formData.get('slug'),
    period: { from: formData.get('from'), to: formData.get('to') },
    workingOn: formData.get('workingOn') ?? '',
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const { slug, period, workingOn } = parsed.data;
  try {
    await saveWorkingOn(slug, period, workingOn);
  } catch (e: unknown) {
    if (e instanceof ForbiddenError) forbidden();
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  revalidatePath(`/brands/${slug}/report`);
  return { ok: true, savedAt: new Date().toISOString() };
}
