import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { runPage } from '@/lib/page';
import { getCsvImportSource } from '@/lib/data/ingest';
import { ImportForm } from './ImportForm';

// Leads of the brand only: the parent layout and getCsvImportSource both check.
export default async function ImportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { brand, source } = await runPage(() => getCsvImportSource(slug));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <header>
        <Link href={`/brands/${brand.slug}`} className="text-sm text-base-content/60 hover:underline">
          ← {brand.name}
        </Link>
        <h1 className="text-2xl font-semibold">Import replies</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Replies that already went out, from a helpdesk export. Rows are keyed by{' '}
          <code>external_id</code>: importing the same file again adds nothing and changes nothing.
        </p>
      </header>

      {source ? (
        <>
          <p className="text-sm text-base-content/70">
            Columns: <code>external_id, specialist_email, customer_message, reply_text, sent_at, channel</code>.
            {' '}<code>sent_at</code> is ISO 8601; <code>channel</code> is email, amazon, shopify or walmart
            (empty means email). Example: <code>docs/import-sample.csv</code>.
            {source.last_synced_at && <> Last import {new Date(source.last_synced_at).toLocaleString('en-GB')}.</>}
          </p>
          <ImportForm slug={brand.slug} />
        </>
      ) : (
        <EmptyState title={`${brand.name} has no CSV source yet.`}
          body="An ingest source of kind csv has to exist for this brand before anyone can upload." />
      )}
    </main>
  );
}
