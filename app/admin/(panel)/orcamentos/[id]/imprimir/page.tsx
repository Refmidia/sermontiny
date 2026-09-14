import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getCompanySettings } from '@/lib/data/company';
import { buildQuoteDocument, withQuotePix } from '@/lib/pdf/quote-document';
import { QuotePrintView } from '@/components/admin/quote-print-view';
import { PrintButton } from '@/components/admin/print-button';
import type { Customer, QuoteItem, QuoteVersion } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function QuotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('quotes.read');
  const { id } = await params;
  const supabase = await createClient();
  const settings = await getCompanySettings();
  const { data: quote } = await supabase
    .from('quotes')
    .select('*, customers(*), customer_units(*), quote_versions:current_version_id(*)')
    .eq('id', id)
    .maybeSingle();
  const version = Array.isArray(quote?.quote_versions) ? quote?.quote_versions[0] : quote?.quote_versions;
  const customer = Array.isArray(quote?.customers) ? quote?.customers[0] : quote?.customers;
  const unit = Array.isArray(quote?.customer_units) ? quote?.customer_units[0] : quote?.customer_units;
  if (!quote || !version || !customer) notFound();
  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_version_id', version.id).order('sort_order');

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
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
      <QuotePrintView doc={doc} />
    </div>
  );
}
