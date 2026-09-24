'use client';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPendingCounts } from '@/components/shell/PendingCounts';
import { CATEGORY_LABEL, FAILURE_CATEGORIES, type FailureCategory, type Severity } from '@/lib/types';
import { submitReview, type ActionState } from '../actions';
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
  // action={dispatch} is the no-JS path. With JS, onSubmit calls the action itself
  // so a plain Save can hand the sidebar its fresh counts the moment it returns.
  const [actionState, dispatch, actionPending] = useActionState(submitReview, null);
  const [jsState, setJsState] = useState<ActionState | null>(null);
  const [jsPending, startSubmit] = useTransition();
  const state = jsState ?? actionState;
  const pending = actionPending || jsPending;
  const router = useRouter();
  const setCounts = useSetPendingCounts();
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
    startSubmit(async () => {
      const result = await submitReview(state, data); // Save and next redirects from inside
      if (result?.saved) {
        setCounts(result.saved);
        // A navigation, not refresh(): a new URL makes Next fetch the page, which
        // now shows the read-only review. refresh() did not reliably swap it.
        router.replace(`/reviews/${replyId}?saved=1`);
        return;
      }
      setJsState(result);
    });
  };
  const toggle = (c: FailureCategory) =>
    setCategories(cs => (cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]));

  // Segmented options: selected is a lighter fill with an ivory ring, never a colour,
  // except a selected Critical, which is the one red thing on the page.
  const seg = (on: boolean, critical = false) => [
    'flex h-10 cursor-pointer items-center justify-center rounded-[0.4rem] text-sm font-medium transition-colors has-focus-visible:outline-2',
    on
      ? critical ? 'bg-error text-error-content' : 'bg-base-300 text-base-content ring-1 ring-base-content/40'
      : 'text-base-content/60 hover:bg-base-300/50 hover:text-base-content',
  ].join(' ');

  return (
    <form action={dispatch} onSubmit={onSubmit} className="flex flex-col gap-6 rounded-box bg-base-200 p-6">
      <input type="hidden" name="replyId" value={replyId} />
      <h2 className="text-base font-semibold">Your review</h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 flex w-full justify-between text-sm font-medium">
          Score <span className="font-normal text-base-content/40">keys 1–5</span>
        </legend>
        <div className="grid grid-cols-5 gap-1 rounded-field bg-base-100/70 p-1">
          {SCORES.map(n => (
            <label key={n} className={`${seg(score === n)} tabular-nums`}>
              <input type="radio" name="score" value={n} className="sr-only"
                checked={score === n} onChange={() => setScore(n)} />
              {n}
            </label>
          ))}
        </div>
        <FieldError errors={errors?.score} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Severity</legend>
        <div className="grid grid-cols-3 gap-1 rounded-field bg-base-100/70 p-1">
          {SEVERITIES.map(s => (
            <label key={s.value} className={seg(severity === s.value, s.value === 'critical')}>
              <input type="radio" name="severity" value={s.value} className="sr-only"
                checked={severity === s.value} onChange={() => setSeverity(s.value)} />
              {s.label}
            </label>
          ))}
        </div>
        <p className={`text-xs leading-relaxed ${severity === 'critical' ? 'text-error' : 'text-base-content/50'}`}>
          Critical: factual or procedure error. This is the one that costs accounts.
        </p>
        <FieldError errors={errors?.severity} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">What went wrong</legend>
        <div className="flex flex-wrap gap-1.5">
          {FAILURE_CATEGORIES.map(c => (
            <label key={c} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors has-focus-visible:outline-2 ${
              categories.includes(c)
                ? 'bg-base-content text-base-100'
                : 'bg-base-300/60 text-base-content/70 hover:bg-base-300 hover:text-base-content'}`}>
              <input type="checkbox" name="categories" value={c} className="sr-only"
                checked={categories.includes(c)} onChange={() => toggle(c)} />
              {CATEGORY_LABEL[c]}
            </label>
          ))}
        </div>
        <FieldError errors={errors?.categories} />
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Comment <span className="font-normal text-base-content/40">optional</span></span>
        <textarea name="comment" rows={4} maxLength={2000}
          className="textarea w-full border-transparent bg-base-100/70 leading-relaxed focus:border-base-content/30"
          placeholder={`What would you tell ${specialistFirstName} about this one?`}
          value={comment} onChange={e => setComment(e.target.value)} />
        <FieldError errors={errors?.comment} />
      </label>

      {state?.formError && <ErrorCard compact title={state.formError} />}
      <Buttons pending={pending} />
    </form>
  );
}

function Buttons({ pending }: { pending: boolean }) {
  return (
    <div className="flex justify-end gap-2 border-t border-base-300/70 pt-5">
      <button type="submit" className="btn btn-ghost" disabled={pending}>Save</button>
      <button type="submit" name="andNext" value="1" className="btn btn-primary" disabled={pending}>
        {pending && <span className="loading loading-spinner loading-xs" />}
        Save and next
      </button>
    </div>
  );
}
