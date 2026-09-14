import { buildPixBrCode, formatPixKeyLabel } from '@/lib/pix/br-code';
import { pixQrDataUrl, staticPixQrDataUrl } from '@/lib/pix/qr';
import type { CompanySettings } from '@/types/database';

export const DEFAULT_PIX_KEY = '16.592.847/0001-72';

export type QuotePix = {
  keyLabel: string | null;
  qrDataUrl: string;
};

export async function resolveQuotePix(
  settings: CompanySettings,
  totalCents: number,
  quoteNumber: string,
): Promise<QuotePix | null> {
  const key = settings.pix_key?.trim() || DEFAULT_PIX_KEY;
  const payload = buildPixBrCode({
    key,
    merchantName: settings.trade_name || settings.legal_name,
    merchantCity: settings.city ?? 'Taruma',
    amountCents: totalCents,
    txid: quoteNumber,
  });

  if (payload) {
    return {
      keyLabel: formatPixKeyLabel(key),
      qrDataUrl: await pixQrDataUrl(payload),
    };
  }

  const fallback = await staticPixQrDataUrl();
  if (!fallback) return null;
  return { keyLabel: formatPixKeyLabel(key), qrDataUrl: fallback };
}
