import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { sumReceivedByQuoteIds } from '@/app/actions/quote-payments';
import { QuotesBoard, type QuoteBoardRow } from '@/components/admin/quotes-board';

export const dynamic = 'force-dynamic';

const FULL_SELECT = `
  id, number, title, status, created_at, customer_id,
  customers(
    id, legal_name, phone, whatsapp_ddi, whatsapp_number,
    street, number, complement, district, city, state, zip
  ),
  customer_units(name, street, number, district, city, state, zip),
  quote_versions:current_version_id(total_cents, version_number, valid_until),
  quote_payments(amount_cents, deleted_at),
  contracts(id, deleted_at)
`;

const FALLBACK_SELECT = `
  id, number, title, status, created_at, customer_id,
  customers(
    id, legal_name, phone, whatsapp_ddi, whatsapp_number,
    street, number, complement, district, city, state, zip
  ),
  customer_units(name, street, number, district, city, state, zip),
  quote_versions:current_version_id(total_cents, version_number, valid_until),
  contracts(id, deleted_at)
`;

export default async function QuotesPage() {
  const user = await requirePermission('quotes.read');
  const canWrite = user.permissions.includes('quotes.write');
  const canConvert = user.permissions.includes('contracts.write');
  const canDelete = user.permissions.includes('quotes.delete');
  const supabase = await createClient();

  let data: QuoteBoardRow[] = [];
  let usedFallback = false;
  try {
    const full = await supabase
      .from('quotes')
      .select(FULL_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!full.error) {
      data = (full.data ?? []) as QuoteBoardRow[];
    } else {
      usedFallback = true;
      const fallback = await supabase
        .from('quotes')
        .select(FALLBACK_SELECT)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      data = (fallback.data ?? []) as QuoteBoardRow[];
    }
  } catch {
    data = [];
  }

  if (usedFallback && data.length > 0) {
    const { totals } = await sumReceivedByQuoteIds(data.map((row) => row.id));
    data = data.map((row) => ({
      ...row,
      quote_payments: [
        {
          amount_cents: totals[row.id] || 0,
          deleted_at: null,
        },
      ],
    }));
  }

  return <QuotesBoard data={data} canWrite={canWrite} canConvert={canConvert} canDelete={canDelete} />;
}
