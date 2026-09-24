import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader, SectionLabel } from '@/components/PageHeader';
import { runPage } from '@/lib/page';
import { getCsvImportSource } from '@/lib/data/ingest';
import { ImportForm } from './ImportForm';

const COLUMNS = ['external_id', 'specialist_email', 'customer_message', 'reply_text', 'sent_at', 'channel'];

// Leads of the brand only: the parent layout and getCsvImportSource both check.
export default async function ImportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { brand, source } = await runPage(() => getCsvImportSource(slug));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow={
          <Link href={`/brands/${brand.slug}`} className="flex w-fit items-center gap-1.5 normal-case tracking-normal transition-colors hover:text-base-content">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden /> {brand.name}
          </Link>
        }
        title="Import replies"
        lead={<>Replies that already went out, from a helpdesk export. Rows are keyed by <Code>external_id</Code>: importing the same file again adds nothing and changes nothing.</>}
      />

      {source ? (
        <>
          <ImportForm slug={brand.slug} />
          <section className="flex flex-col gap-3">
            <SectionLabel>Expected columns</SectionLabel>
            <ul className="flex flex-wrap gap-1.5">
              {COLUMNS.map(c => <li key={c}><Code>{c}</Code></li>)}
            </ul>
            <p className="text-sm leading-relaxed text-base-content/55">
              <Code>sent_at</Code> is ISO 8601; <Code>channel</Code> is email, amazon, shopify or walmart
              (empty means email). Example: <Code>docs/import-sample.csv</Code>.
              {source.last_synced_at && <> Last import {new Date(source.last_synced_at).toLocaleString('en-GB')}.</>}
            </p>
          </section>
        </>
      ) : (
        <EmptyState title={`${brand.name} has no CSV source yet.`}
          body="An ingest source of kind csv has to exist for this brand before anyone can upload." />
      )}
    </main>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-[0.3rem] bg-base-300/70 px-1.5 py-0.5 font-mono text-[0.8em] text-base-content/85">{children}</code>;
}
