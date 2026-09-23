import { handle } from '@/app/api/_lib/respond';
import { listMyReviews } from '@/lib/data/my-reviews';

// Same DAL as /me: lets anyone prove with curl that a specialist's payload
// holds only reviews on their own replies. Leads get 403.
export async function GET() {
  return handle(() => listMyReviews());
}
