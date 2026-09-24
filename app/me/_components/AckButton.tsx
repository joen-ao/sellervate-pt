'use client';
import { useFormStatus } from 'react-dom';
import { useSetPendingCounts } from '@/components/shell/PendingCounts';
import { ackAction } from '../actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
      {pending ? 'Saving…' : 'Got it'}
    </button>
  );
}

// Only the review id crosses the wire; who is acknowledging comes from the cookie.
// The action hands back the sidebar's real counts, so the unread number drops at
// once instead of on the next reload.
export function AckButton({ reviewId }: { reviewId: string }) {
  const setCounts = useSetPendingCounts();
  return (
    <form action={async (data: FormData) => setCounts((await ackAction(data)).pending)}>
      <input type="hidden" name="reviewId" value={reviewId} />
      <Submit />
    </form>
  );
}
