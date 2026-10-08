import { formatCep, formatCnpj, formatCpf, formatDateBr, onlyDigits } from '@/lib/format';
import { companyAddress } from '@/lib/data/company';
import { resolveQuotePix } from '@/lib/pix/quote-pix';
import type { CompanySettings, Customer, QuoteItem, QuoteVersion } from '@/types/database';

export type QuoteDocumentModel = {
  settings: CompanySettings;
  companyAddress: string;
  number: string;
  version: number;
  issuedAt: string;
  issuedTime: string;
  validUntil?: string | null;
  title: string;
  scope?: string | null;
  notes?: string | null;
  paymentTerms?: string | null;
  paymentDeadline?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  customerName: string;
  customerTradeName?: string | null;
  customerDocument: string;
  customerDocumentLabel: string;
  customerAddress: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  unitName?: string | null;
  items: Array<Pick<QuoteItem, 'description' | 'unit' | 'quantity' | 'unit_price_cents' | 'discount_cents' | 'surcharge_cents' | 'subtotal_cents'>>;
  subtotalCents: number;
  discountCents: number;
  surchargeCents: number;
  taxCents: number;
  totalCents: number;
  totalExtenso: string;
  pixKeyLabel?: string | null;
  pixQrSrc?: string | null;
};

function parseIssued(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { date: formatDateBr(value), time: '' };
  }
  return {
    date: new Intl.DateTimeFormat('pt-BR').format(date),
    time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date),
  };
}

export function formatDocumentLabel(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 14) return `CNPJ ${formatCnpj(digits)}`;
  if (digits.length === 11) return `CPF ${formatCpf(digits)}`;
  return `Documento ${value}`;
}

export function customerAddress(customer: Pick<Customer, 'street' | 'number' | 'district' | 'city' | 'state' | 'zip'>) {
  return [
    customer.street,
    customer.number,
    customer.district,
    customer.city && customer.state ? `${customer.city}/${customer.state}` : customer.city,
    customer.zip ? `CEP ${formatCep(customer.zip)}` : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export function buildQuoteDocument(input: {
  settings: CompanySettings;
  number: string;
  version: QuoteVersion;
  customer: Customer;
  unitName?: string | null;
  items: QuoteItem[];
}): QuoteDocumentModel {
  const { settings, version, customer } = input;
  const issued = parseIssued(version.issued_at);
  return {
    settings,
    companyAddress: companyAddress(settings),
    number: input.number,
    version: version.version_number,
    issuedAt: issued.date,
    issuedTime: issued.time,
    validUntil: version.valid_until ? formatDateBr(version.valid_until) : null,
    title: version.title,
    scope: version.scope,
    notes: version.customer_notes,
    paymentTerms: version.payment_terms,
    paymentDeadline: version.payment_deadline,
    startDate: version.start_date ? formatDateBr(version.start_date) : null,
    endDate: version.end_date ? formatDateBr(version.end_date) : null,
    customerName: customer.legal_name,
    customerTradeName: customer.trade_name,
    customerDocument: customer.document,
    customerDocumentLabel: formatDocumentLabel(customer.document),
    customerAddress: customerAddress(customer),
    customerEmail: customer.email,
    customerPhone: customer.phone,
    unitName: input.unitName,
    items: input.items,
    subtotalCents: version.subtotal_cents,
    discountCents: version.discount_cents,
    surchargeCents: version.surcharge_cents,
    taxCents: version.tax_cents,
    totalCents: version.total_cents,
    totalExtenso: version.total_extenso,
  };
}

export async function withQuotePix(doc: QuoteDocumentModel): Promise<QuoteDocumentModel> {
  const pix = await resolveQuotePix(doc.settings, { amountCents: doc.totalCents, txid: doc.number });
  if (!pix) return doc;
  return { ...doc, pixKeyLabel: pix.keyLabel, pixQrSrc: pix.qrDataUrl };
}
