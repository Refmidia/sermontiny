import { describe, expect, it } from 'vitest';
import { fallbackCompanySettings } from '@/lib/data/company';
import { resolveQuotePix } from '@/lib/pix/quote-pix';

describe('quote pix', () => {
  it('generates a QR for the default CNPJ Pix key', async () => {
    const pix = await resolveQuotePix(fallbackCompanySettings(), 2440000, 'ORC-2026-0005');
    expect(pix?.keyLabel).toBe('16.592.847/0001-72');
    expect(pix?.qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect((pix?.qrDataUrl.length ?? 0) > 800).toBe(true);
  });

  it('keeps a custom Pix key when it is saved in settings', async () => {
    const pix = await resolveQuotePix(
      { ...fallbackCompanySettings(), pix_key: 'comercial@sermontinymontagens.com.br' },
      2440000,
      'ORC-2026-0005',
    );
    expect(pix?.keyLabel).toBe('comercial@sermontinymontagens.com.br');
  });
});
