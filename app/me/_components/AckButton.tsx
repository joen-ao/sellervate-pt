'use client';
import { useFormStatus } from 'react-dom';
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
export function AckButton({ reviewId }: { reviewId: string }) {
  return (
    <form action={ackAction}>
      <input type="hidden" name="reviewId" value={reviewId} />
      <Submit />
    </form>
  );
}
