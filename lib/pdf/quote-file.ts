import { createClient } from '@/lib/supabase/server';
import { getCompanySettings } from '@/lib/data/company';
import { renderPdfBuffer } from '@/lib/pdf/render';
import { QuotePdf } from '@/lib/pdf/quote-pdf';
import { buildQuoteDocument, withQuotePix } from '@/lib/pdf/quote-document';
import type { Customer, QuoteItem, QuoteVersion } from '@/types/database';

export async function renderQuotePdfBuffer(quoteId: string) {
  const supabase = await createClient();
  const settings = await getCompanySettings();
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, customers(*), customer_units(*), quote_versions:current_version_id(*)')
    .eq('id', quoteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const version = Array.isArray(quote?.quote_versions) ? quote?.quote_versions[0] : quote?.quote_versions;
  const customer = Array.isArray(quote?.customers) ? quote?.customers[0] : quote?.customers;
  const unit = Array.isArray(quote?.customer_units) ? quote?.customer_units[0] : quote?.customer_units;
  if (!quote || !version || !customer) {
    throw new Error('Orçamento incompleto para gerar o PDF.');
  }
  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_version_id', version.id);
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
  return {
    buffer: await renderPdfBuffer(QuotePdf(doc)),
    fileName: `${quote.number}-v${version.version_number}.pdf`,
    quote,
    version,
    customer,
  };
}
