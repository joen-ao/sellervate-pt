import { ArrowRight } from 'lucide-react';
import { goNext } from '../actions';

// A form, not a link: the target is decided on the server at click time, so
// the lead never picks. The brand travels as a plain field and is re-checked by the DAL.
export function ReviewNextButton({ brandSlug }: { brandSlug?: string }) {
  return (
    <form action={goNext}>
      {brandSlug && <input type="hidden" name="brand" value={brandSlug} />}
      <button type="submit" className="btn btn-primary btn-sm gap-1.5">
        Review next <ArrowRight size={14} strokeWidth={2} aria-hidden />
      </button>
    </form>
  );
}
