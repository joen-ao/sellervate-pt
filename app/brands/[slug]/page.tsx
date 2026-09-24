import Link from 'next/link';
import { runPage } from '@/lib/page';
import { getBrandStats, WINDOW_DAYS } from '@/lib/data/brand-stats';
import { StatCards } from './_components/StatCards';
import { TrendChart } from './_components/TrendChart';
import { CategoryList } from './_components/CategoryList';
import { CriticalList } from './_components/CriticalList';
import { SpecialistTable } from './_components/SpecialistTable';
import { EmptyState } from '@/components/EmptyState';

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { brand, stats } = await runPage(() => getBrandStats(slug));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{brand.name}</h1>
          <p className="max-w-prose text-base-content/70">
            How {brand.name} replies are scoring, what keeps going wrong, and the critical errors to act on.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Link href={`/brands/${brand.slug}/report`} className="btn btn-sm">Client report</Link>
            <Link href={`/brands/${brand.slug}/import`} className="btn btn-sm btn-ghost">Import replies</Link>
          </div>
          <p className="text-sm text-base-content/60">Last {WINDOW_DAYS} days vs the {WINDOW_DAYS} before</p>
        </div>
      </header>

      {stats.current.n === 0 ? (
        <EmptyState title={`No reviews for ${brand.name} in the last ${WINDOW_DAYS} days.`}
          body="Reviews from the queue show up here."
          action={<Link href={`/queue?brand=${brand.slug}`} className="btn btn-sm">Review {brand.name} replies</Link>} />
      ) : (
        <>
          <StatCards current={stats.current} previous={stats.previous} />
          <Section title="Average score per week">
            <TrendChart weeks={stats.weekly} />
          </Section>
          <div className="grid gap-8 md:grid-cols-2">
            <Section title="What we keep getting wrong">
              <CategoryList items={stats.categories} />
            </Section>
            <Section title="Critical events">
              <CriticalList events={stats.criticalEvents} />
            </Section>
          </div>
          <Section title="By specialist">
            <SpecialistTable rows={stats.bySpecialist} />
          </Section>
        </>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-base-content/60">{title}</h2>
      {children}
    </section>
  );
}
