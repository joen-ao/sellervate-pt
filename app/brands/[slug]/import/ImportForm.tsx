'use client';
import { useActionState, useEffect } from 'react';
import { CircleAlert, CircleCheck, Upload } from 'lucide-react';
import { useSetPendingCounts } from '@/components/shell/PendingCounts';
import { importCsv, type ImportState } from './actions';

export function ImportForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importCsv.bind(null, slug), null);
  const setCounts = useSetPendingCounts();
  // New replies change the sidebar's unreviewed counts; the action returns them.
  useEffect(() => { if (state?.pending) setCounts(state.pending); }, [state, setCounts]);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4 rounded-box bg-base-200 p-5">
        <label className="flex flex-col items-center gap-3 rounded-field border border-dashed border-base-content/20 px-6 py-8 text-center transition-colors hover:border-base-content/35">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-base-300 text-base-content/60">
            <Upload size={18} strokeWidth={1.75} />
          </span>
          <span className="text-sm font-medium">CSV file</span>
          <input type="file" name="file" accept=".csv,text/csv" required
            className="file-input file-input-sm file-input-ghost w-full max-w-xs" />
        </label>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending && <span className="loading loading-spinner loading-xs" />}
            {pending ? 'Importing…' : 'Import'}
          </button>
        </div>
      </form>

      {/* A bad file is the user's to fix, not a critical: warning, never red. */}
      {state?.error && (
        <div role="alert" className="flex items-center gap-2.5 rounded-box bg-warning/10 px-4 py-3 text-sm text-warning">
          <CircleAlert size={16} strokeWidth={1.75} aria-hidden className="shrink-0" /> {state.error}
        </div>
      )}

      {state?.result && (
        <section aria-live="polite" className="flex flex-col gap-4 rounded-box bg-base-200 p-5">
          <h2 className="flex items-center gap-2 font-medium">
            <CircleCheck size={16} strokeWidth={1.75} aria-hidden className="text-success" /> Imported {state.fileName}
          </h2>
          <dl className="grid gap-3 sm:grid-cols-3">
            <Count label="new replies" n={state.result.inserted} />
            <Count label="already here, left as they were" n={state.result.duplicates} />
            <Count label="new unmatched" n={state.result.unmatched} />
          </dl>
          {state.result.unmatchedEmails.length > 0 && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-base-content/60">
                No person with these emails, so their rows were kept aside, not imported:
              </p>
              <ul className="flex flex-wrap gap-1.5 font-mono text-xs">
                {state.result.unmatchedEmails.map(e => <li key={e} className="rounded-[0.3rem] bg-base-300/70 px-1.5 py-0.5">{e}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Count({ label, n }: { label: string; n: number }) {
  return (
    <div className="flex flex-col-reverse gap-1 rounded-field bg-base-100/60 px-4 py-3">
      <dt className="text-xs text-base-content/50">{label}</dt>
      <dd className="font-serif text-2xl font-medium tabular-nums">{n}</dd>
    </div>
  );
}
