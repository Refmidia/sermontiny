import { describe, expect, it } from 'vitest';
import {
  buildPixBrCode,
  crc16Ccitt,
  formatPixKeyLabel,
  isValidPixPayload,
  normalizePixKey,
  sanitizePixTxid,
} from '@/lib/pix/br-code';

describe('pix br code', () => {
  it('normalizes CNPJ, e-mail and phone keys', () => {
    expect(normalizePixKey('10.750.978/0001-24')).toBe('10750978000124');
    expect(normalizePixKey('Comercial@Sermontinymontagens.com.br')).toBe(
      'comercial@sermontinymontagens.com.br',
    );
    expect(normalizePixKey('(18) 99999-0000')).toBe('18999990000');
  });

  it('keeps quote numbers usable as txid', () => {
    expect(sanitizePixTxid('ORC-2026-0005')).toBe('ORC20260005');
  });

  it('builds a payload that banks can validate', () => {
    const payload = buildPixBrCode({
      key: 'comercial@sermontinymontagens.com.br',
      merchantName: 'Sermontiny Montagens',
      merchantCity: 'Tarumã',
      amountCents: 2440000,
      txid: 'ORC-2026-0005',
    });
    expect(payload).toBeTruthy();
    expect(payload?.startsWith('000201')).toBe(true);
    expect(payload).toContain('br.gov.bcb.pix');
    expect(payload).toContain('comercial@sermontinymontagens.com.br');
    expect(payload).toContain('24400.00');
    expect(payload).toContain('ORC20260005');
    expect(isValidPixPayload(payload!)).toBe(true);
    expect(payload?.slice(-4)).toBe(crc16Ccitt(payload!.slice(0, -4)));
  });

  it('formats the visible Pix key', () => {
    expect(formatPixKeyLabel('10750978000124')).toBe('10.750.978/0001-24');
    expect(formatPixKeyLabel('16.592.847/0001-72')).toBe('16.592.847/0001-72');
    expect(formatPixKeyLabel('COMERCIAL@SERMONTINYMONTAGENS.COM.BR')).toBe(
      'comercial@sermontinymontagens.com.br',
    );
  });
});
