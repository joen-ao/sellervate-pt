import Link from 'next/link';
import { runPage } from '@/lib/page';
import { getBrandStats, WINDOW_DAYS } from '@/lib/data/brand-stats';
import { StatCards } from './_components/StatCards';
import { TrendChart } from './_components/TrendChart';
import { CategoryList } from './_components/CategoryList';
import { CriticalList } from './_components/CriticalList';
import { SpecialistTable } from './_components/SpecialistTable';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader, SectionLabel } from '@/components/PageHeader';

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { brand, stats } = await runPage(() => getBrandStats(slug));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Brand"
        title={brand.name}
        lead={`How ${brand.name} replies are scoring, what keeps going wrong, and the critical errors to act on.`}
        meta={`Last ${WINDOW_DAYS} days vs the ${WINDOW_DAYS} before`}
        actions={<>
          <Link href={`/brands/${brand.slug}/import`} className="btn btn-sm btn-ghost">Import replies</Link>
          <Link href={`/brands/${brand.slug}/report`} className="btn btn-sm btn-neutral">Client report</Link>
        </>}
      />

      {stats.current.n === 0 ? (
        <EmptyState title={`No reviews for ${brand.name} in the last ${WINDOW_DAYS} days.`}
          body="Reviews from the queue show up here."
          action={<Link href={`/queue?brand=${brand.slug}`} className="btn btn-sm btn-neutral">Review {brand.name} replies</Link>} />
      ) : (
        <>
          <StatCards current={stats.current} previous={stats.previous} />
          <Card title="Average score per week">
            <TrendChart weeks={stats.weekly} />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="What we keep getting wrong">
              <CategoryList items={stats.categories} />
            </Card>
            <Card title="Critical events">
              <CriticalList events={stats.criticalEvents} />
            </Card>
          </div>
          <Card title="By specialist" flush>
            <SpecialistTable rows={stats.bySpecialist} />
          </Card>
        </>
      )}
    </main>
  );
}

// flush: the content runs to the card's edges (a table), only the title is padded.
function Card({ title, flush, children }: { title: string; flush?: boolean; children: React.ReactNode }) {
  return (
    <section className={`flex flex-col gap-4 overflow-hidden rounded-box bg-base-200 ${flush ? 'pt-5' : 'p-5'}`}>
      <div className={flush ? 'px-5' : undefined}><SectionLabel>{title}</SectionLabel></div>
      {children}
    </section>
  );
}
