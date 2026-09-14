import { formatPixKeyLabel } from '@/lib/pix/br-code';
import { staticPixQrDataUrl } from '@/lib/pix/qr';
import type { CompanySettings } from '@/types/database';

export const DEFAULT_PIX_KEY = '16.592.847/0001-72';

export type QuotePix = {
  keyLabel: string | null;
  qrDataUrl: string;
};

export async function resolveQuotePix(settings: CompanySettings): Promise<QuotePix | null> {
  const qrDataUrl = await staticPixQrDataUrl();
  if (!qrDataUrl) return null;
  const key = settings.pix_key?.trim() || DEFAULT_PIX_KEY;
  return {
    keyLabel: formatPixKeyLabel(key),
    qrDataUrl,
  };
}
