'use client';
import { useActionState } from 'react';
import type { Period, WorkingOn } from '@/lib/data/report';
import { saveWorkingOnAction, type WorkingOnState } from '../actions';

type Props = { slug: string; period: Period; note: WorkingOn; carriedLabel: string | null; max: number };

// Screen only: the printed report shows the saved text instead (see page.tsx).
export function WorkingOnForm({ slug, period, note, carriedLabel, max }: Props) {
  const [state, action, pending] = useActionState<WorkingOnState, FormData>(saveWorkingOnAction, null);
  return (
    <form action={action} className="flex flex-col gap-2 print:hidden">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="from" value={period.from} />
      <input type="hidden" name="to" value={period.to} />
      <textarea name="workingOn" defaultValue={note.text} maxLength={max} rows={6}
        aria-label="What we are working on" placeholder="What the team is focusing on next period…"
        className="textarea w-full" />
      {carriedLabel && (
        <p className="text-xs text-base-content/60">
          Carried over from the note for {carriedLabel}. Save to keep it for this period.
        </p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-sm btn-neutral" disabled={pending}>
          {pending ? 'Saving…' : 'Save note'}
        </button>
        <p role="status" className="text-sm">
          {state?.ok === true && <span className="text-success">Saved.</span>}
          {state?.ok === false && <span className="text-error">{state.error}</span>}
        </p>
      </div>
    </form>
  );
}
