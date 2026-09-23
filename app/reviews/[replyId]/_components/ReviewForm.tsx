'use client';
import { startTransition, useActionState, useEffect, useState } from 'react';
import { CATEGORY_LABEL, FAILURE_CATEGORIES, type FailureCategory, type Severity } from '@/lib/types';
import { submitReview } from '../actions';
import { ErrorCard } from '@/components/ErrorCard';

const SCORES = [1, 2, 3, 4, 5] as const;
const SEVERITIES: { value: Severity; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'minor', label: 'Minor' },
  { value: 'critical', label: 'Critical' },
];

const FieldError = ({ errors }: { errors?: string[] }) =>
  errors?.length ? <p className="text-sm text-warning">{errors[0]}</p> : null;

// Inputs are controlled, so a validation error or a conflict never loses what was typed.
// Submitting goes through onSubmit + startTransition rather than letting <form action>
// submit: React resets a form after an action submit, and that reset unchecks the
// controlled radios in the DOM while the buttons still look selected, so a resubmit
// would send no score. action={dispatch} stays for the no-JS path.
export function ReviewForm({ replyId, specialistFirstName }: { replyId: string; specialistFirstName: string }) {
  const [state, dispatch, pending] = useActionState(submitReview, null);
  const [score, setScore] = useState<number | null>(null);
  const [severity, setSeverity] = useState<Severity>('none');
  const [categories, setCategories] = useState<FailureCategory[]>([]);
  const [comment, setComment] = useState('');
  const errors = state?.fieldErrors;

  // Keys 1–5 set the score from anywhere on the page, except while typing text.
  // (A keyboard listener, not data fetching: there is no client-side fetch here.)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('textarea, input:not([type=radio]):not([type=checkbox]), [contenteditable]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey || !/^[1-5]$/.test(e.key)) return;
      setScore(Number(e.key));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(data));
  };
  const toggle = (c: FailureCategory) =>
    setCategories(cs => (cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]));

  return (
    <form action={dispatch} onSubmit={onSubmit} className="card border border-base-300 bg-base-100">
      <div className="card-body gap-5">
        <input type="hidden" name="replyId" value={replyId} />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Score <span className="font-normal text-base-content/60">(keys 1–5)</span></legend>
          <div className="grid grid-cols-5 gap-2">
            {SCORES.map(n => (
              <label key={n} className={`btn btn-lg ${score === n ? 'btn-neutral' : 'btn-outline'} has-focus-visible:outline-2`}>
                <input type="radio" name="score" value={n} className="sr-only"
                  checked={score === n} onChange={() => setScore(n)} />
                {n}
              </label>
            ))}
          </div>
          <FieldError errors={errors?.score} />
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Severity</legend>
          <div className="join w-full">
            {SEVERITIES.map(s => (
              <label key={s.value} className={`btn join-item flex-1 has-focus-visible:outline-2 ${
                severity === s.value ? (s.value === 'critical' ? 'btn-error' : 'btn-neutral') : s.value === 'critical' ? 'btn-outline btn-error' : 'btn-outline'}`}>
                <input type="radio" name="severity" value={s.value} className="sr-only"
                  checked={severity === s.value} onChange={() => setSeverity(s.value)} />
                {s.label}
              </label>
            ))}
          </div>
          <p className={`mt-1 text-sm ${severity === 'critical' ? 'text-error' : 'text-base-content/60'}`}>
            Critical: factual or procedure error. This is the one that costs accounts.
          </p>
          <FieldError errors={errors?.severity} />
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">What went wrong</legend>
          <div className="flex flex-wrap gap-2">
            {FAILURE_CATEGORIES.map(c => (
              <label key={c} className={`btn btn-sm rounded-full has-focus-visible:outline-2 ${categories.includes(c) ? 'btn-neutral' : 'btn-outline'}`}>
                <input type="checkbox" name="categories" value={c} className="sr-only"
                  checked={categories.includes(c)} onChange={() => toggle(c)} />
                {CATEGORY_LABEL[c]}
              </label>
            ))}
          </div>
          <FieldError errors={errors?.categories} />
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Comment <span className="font-normal text-base-content/60">(optional)</span></span>
          <textarea name="comment" rows={4} className="textarea w-full" maxLength={2000}
            placeholder={`What would you tell ${specialistFirstName} about this one?`}
            value={comment} onChange={e => setComment(e.target.value)} />
          <FieldError errors={errors?.comment} />
        </label>

        {state?.formError && <ErrorCard compact title={state.formError} />}
        <Buttons pending={pending} />
      </div>
    </form>
  );
}

function Buttons({ pending }: { pending: boolean }) {
  return (
    <div className="card-actions justify-end">
      <button type="submit" className="btn" disabled={pending}>Save</button>
      <button type="submit" name="andNext" value="1" className="btn btn-primary" disabled={pending}>
        {pending && <span className="loading loading-spinner loading-xs" />}
        Save and next
      </button>
    </div>
  );
}
