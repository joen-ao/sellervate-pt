import Link from 'next/link';
import { runPage } from '@/lib/page';
import { getBrandReport, NOTE_MAX, parsePeriod } from '@/lib/data/report';
import { EmptyState } from '@/components/EmptyState';
import { TrendChart } from '../_components/TrendChart';
import { ReportHeader, periodLabel } from './_components/ReportHeader';
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
          action={<Link href={`/brands/${slug}/report`} className="btn btn-sm">Last 90 days</Link>} />
      </Sheet>
    );
  }

  const r = await runPage(() => getBrandReport(slug, period.data));
  const note = r.workingOn;

  return (
    <Sheet>
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

// The light print theme is forced on the whole route, screen included (print.css).
function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="sellervate-print" className="report-root min-h-screen bg-base-100 text-base-content">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-8">{children}</main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-base-content/70">{title}</h2>
      {children}
    </section>
  );
}
