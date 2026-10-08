import QRCode from 'qrcode';
import { buildPixBrCode, formatPixKeyLabel } from '@/lib/pix/br-code';
import { SITE } from '@/lib/site';
import type { CompanySettings } from '@/types/database';

export const DEFAULT_PIX_KEY = SITE.cnpj;

export type QuotePix = {
  keyLabel: string | null;
  qrDataUrl: string;
};

export async function resolveQuotePix(
  settings: CompanySettings,
  options: { amountCents?: number; txid?: string } = {},
): Promise<QuotePix | null> {
  const key = settings.pix_key?.trim() || DEFAULT_PIX_KEY;
  const payload = buildPixBrCode({
    key,
    merchantName: settings.trade_name || settings.legal_name || SITE.shortName,
    merchantCity: settings.city || SITE.address.city,
    amountCents: options.amountCents,
    txid: options.txid,
  });
  if (!payload) return null;
  const qrDataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 320, errorCorrectionLevel: 'M' });
  return { keyLabel: formatPixKeyLabel(key), qrDataUrl };
}
