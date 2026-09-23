import { handle } from '@/app/api/_lib/respond';
import { listBrandReplies } from '@/lib/data/replies';

// 200 / 403 / 404 from the cookie alone; the query and the membership check live in the DAL.
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handle(async () => listBrandReplies((await params).slug));
}
