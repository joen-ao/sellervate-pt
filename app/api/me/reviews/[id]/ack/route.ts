import { z } from 'zod';
import { handle } from '@/app/api/_lib/respond';
import { acknowledgeReview } from '@/lib/data/my-reviews';
import { NotFoundError } from '@/lib/errors';

// curl twin of the "Got it" server action, so the ownership check can be
// tested without hand-crafting a server-action request.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    // z.guid(), not z.uuid(): zod 4's uuid rejects the fixed seed ids.
    const id = z.guid().safeParse((await params).id);
    if (!id.success) throw new NotFoundError('Review');
    await acknowledgeReview(id.data);
    return { ok: true };
  });
}
