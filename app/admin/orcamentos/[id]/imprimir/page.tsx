import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/db/server';
import { getCompanySettings } from '@/lib/data/company';
import { buildQuoteDocument, withQuotePix } from '@/lib/pdf/quote-document';
import { QuotePrintView } from '@/components/admin/quote-print-view';
import { QuotePrintExport } from '@/components/admin/quote-print-export';
import { QuotePreviewActions } from '@/components/admin/quote-preview-actions';
import type { Customer, QuoteItem, QuoteVersion } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orçamento',
  robots: { index: false, follow: false },
};

export default async function QuoteDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('quotes.read');
  const { id } = await params;
  const db = await createClient();
  const settings = await getCompanySettings();
  const { data: quote } = await db
    .from('quotes')
    .select('*, customers(*), customer_units(*), quote_versions:current_version_id(*)')
    .eq('id', id)
    .maybeSingle();
  const version = Array.isArray(quote?.quote_versions) ? quote?.quote_versions[0] : quote?.quote_versions;
  const customer = Array.isArray(quote?.customers) ? quote?.customers[0] : quote?.customers;
  const unit = Array.isArray(quote?.customer_units) ? quote?.customer_units[0] : quote?.customer_units;
  if (!quote || !version || !customer) notFound();
  const { data: items } = await db.from('quote_items').select('*').eq('quote_version_id', version.id).order('sort_order');

  const doc = await withQuotePix(
    buildQuoteDocument({
      settings,
      number: quote.number,
      version: version as QuoteVersion,
      customer: customer as Customer,
      unitName: unit?.name,
      items: (items ?? []) as QuoteItem[],
    }),
  );

  return (
    <main className="min-h-screen bg-[#E8EAED] px-3 py-8 sm:px-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-[980px] space-y-5 print:max-w-none print:space-y-0">
        <Suspense fallback={null}>
          <QuotePrintExport targetId="quote-print-root" fileName={`${quote.number}.png`} />
        </Suspense>
        <div id="quote-print-root" className="print:m-0">
          <QuotePrintView doc={doc} />
        </div>
        <QuotePreviewActions quoteId={id} quoteNumber={quote.number} targetId="quote-print-root" />
      </div>
    </main>
  );
}
