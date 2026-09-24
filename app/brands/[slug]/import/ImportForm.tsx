'use client';
import { useActionState, useEffect } from 'react';
import { useSetPendingCounts } from '@/components/shell/PendingCounts';
import { importCsv, type ImportState } from './actions';

export function ImportForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importCsv.bind(null, slug), null);
  const setCounts = useSetPendingCounts();
  // New replies change the sidebar's unreviewed counts; the action returns them.
  useEffect(() => { if (state?.pending) setCounts(state.pending); }, [state, setCounts]);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">CSV file</span>
          <input type="file" name="file" accept=".csv,text/csv" required
            className="file-input file-input-bordered" />
        </label>
        <button type="submit" className="btn btn-neutral" disabled={pending}>
          {pending ? 'Importing…' : 'Import'}
        </button>
      </form>

      {state?.error && (
        <div role="alert" className="alert alert-error alert-soft">{state.error}</div>
      )}

      {state?.result && (
        <section aria-live="polite" className="flex flex-col gap-3 rounded-box border border-base-300 p-4">
          <h2 className="font-medium">Imported {state.fileName}</h2>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <Count label="new replies" n={state.result.inserted} />
            <Count label="already here, left as they were" n={state.result.duplicates} />
            <Count label="new unmatched" n={state.result.unmatched} />
          </dl>
          {state.result.unmatchedEmails.length > 0 && (
            <div className="text-sm">
              <p className="text-base-content/70">
                No person with these emails, so their rows were kept aside, not imported:
              </p>
              <ul className="mt-1 list-inside list-disc font-mono">
                {state.result.unmatchedEmails.map(e => <li key={e}>{e}</li>)}
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
    <div>
      <dd className="text-2xl font-semibold tabular-nums">{n}</dd>
      <dt className="text-xs text-base-content/60">{label}</dt>
    </div>
  );
}
