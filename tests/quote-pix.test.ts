import { describe, expect, it } from 'vitest';
import { fallbackCompanySettings } from '@/lib/data/company';
import { resolveQuotePix } from '@/lib/pix/quote-pix';

describe('quote pix', () => {
  it('generates the QR from the Sermontiny CNPJ by default', async () => {
    const pix = await resolveQuotePix(fallbackCompanySettings(), { amountCents: 2440000, txid: 'ORC-2026-0005' });
    expect(pix?.keyLabel).toBe('10.750.978/0001-24');
    expect(pix?.qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect((pix?.qrDataUrl.length ?? 0) > 800).toBe(true);
  });

  it('falls back to the CNPJ when no key is saved', async () => {
    const pix = await resolveQuotePix({ ...fallbackCompanySettings(), pix_key: null });
    expect(pix?.keyLabel).toBe('10.750.978/0001-24');
  });

  it('keeps a custom Pix key when it is saved in settings', async () => {
    const pix = await resolveQuotePix({
      ...fallbackCompanySettings(),
      pix_key: 'comercial@sermontinymontagens.com.br',
    });
    expect(pix?.keyLabel).toBe('comercial@sermontinymontagens.com.br');
  });
});
