import Link from 'next/link';
import { runPage } from '@/lib/page';
import { getBrandReport, NOTE_MAX, parsePeriod } from '@/lib/data/report';
import { EmptyState } from '@/components/EmptyState';
import { TrendChart } from '../_components/TrendChart';
import { ReportHeader, ReportToolbar, periodLabel } from './_components/ReportHeader';
import { ReportNumbers } from './_components/ReportNumbers';
import { ImprovedList } from './_components/ImprovedList';
import { WorkingOnForm } from './_components/WorkingOnForm';
import './print.css';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Access (lead + member) is checked by ../layout.tsx before this renders, and
// again by the DAL. The report is client-facing: nothing here names a person.
export default async function ReportPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const period = parsePeriod(one(sp.from), one(sp.to));

  if (!period.success) {
    return (
      <Sheet>
        <EmptyState title="That period can't be reported on."
          body={period.error.issues[0]?.message ?? 'Use two dates, from before to.'}
          action={<Link href={`/brands/${slug}/report`} className="btn btn-sm btn-neutral">Last 90 days</Link>} />
      </Sheet>
    );
  }

  const r = await runPage(() => getBrandReport(slug, period.data));
  const note = r.workingOn;

  return (
    <Sheet toolbar={<ReportToolbar brand={r.brand} period={r.period} />}>
      <ReportHeader brand={r.brand} period={r.period} />
      {r.current.n === 0 ? (
        <EmptyState title="No reviews in this period." body="Pick a different period above." />
      ) : (
        <>
          <ReportNumbers current={r.current} />
          <Section title="Average quality per week">
            <TrendChart weeks={r.weekly} />
          </Section>
          <div className="grid gap-8 sm:grid-cols-2">
            <Section title="Top three things we improved">
              <ImprovedList items={r.improved} hasPreviousPeriod={r.hasPreviousPeriod} />
            </Section>
            <Section title="What we are working on">
              <p className="hidden whitespace-pre-line text-sm print:block">{note.text || '—'}</p>
              <WorkingOnForm key={`${r.period.from}:${r.period.to}`} slug={r.brand.slug} period={r.period}
                note={note} carriedLabel={note.carriedFrom && periodLabel(note.carriedFrom)} max={NOTE_MAX} />
            </Section>
          </div>
        </>
      )}
    </Sheet>
  );
}

// A document preview: the app stays dark, the report is a light sheet on a
// sunken stage. Only the sheet (.report-root) carries the print theme, and only
// the sheet prints (print.css).
function Sheet({ toolbar, children }: { toolbar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="report-stage min-h-screen bg-sunken px-4 pb-16 sm:px-8">
      {toolbar ?? <div className="h-10 print:hidden" />}
      <div data-theme="sellervate-print"
        className="report-root mx-auto max-w-4xl overflow-hidden rounded-box bg-base-100 text-base-content shadow-2xl shadow-black/50">
        <main className="flex flex-col gap-10 px-6 py-10 sm:px-12 sm:py-12">{children}</main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-base-content/60">{title}</h2>
      {children}
    </section>
  );
}
