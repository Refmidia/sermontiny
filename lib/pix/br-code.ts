import { onlyDigits } from '@/lib/format';

const CRC_POLY = 0x1021;

export function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (let i = 0; i < value.length; i += 1) {
    crc ^= value.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ CRC_POLY) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function sanitizePixText(value: string, max: number) {
  return stripDiacritics(value)
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, max);
}

export function sanitizePixTxid(value: string) {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 25);
  return cleaned || '***';
}

export function normalizePixKey(raw: string) {
  const key = raw.trim();
  if (!key) return '';
  if (key.includes('@')) return key.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    return key.toLowerCase();
  }

  const digits = onlyDigits(key);
  if (digits.length === 14) return digits;
  if (digits.length === 11) return digits;
  if (digits.length === 13 && digits.startsWith('55')) return `+${digits}`;
  if (digits.length === 12 && digits.startsWith('55')) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return digits;
  return key;
}

export function formatPixKeyLabel(raw: string) {
  const key = raw.trim();
  if (!key) return '';
  if (key.includes('@')) return key.toLowerCase();
  const digits = onlyDigits(key);
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if (digits.length === 11 && digits[2] === '9') {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return key;
}

export function buildPixBrCode(input: {
  key: string;
  merchantName: string;
  merchantCity: string;
  amountCents?: number;
  txid?: string;
}) {
  const key = normalizePixKey(input.key);
  if (!key) return null;

  const merchantAccount = emv('00', 'br.gov.bcb.pix') + emv('01', key);
  const amount =
    typeof input.amountCents === 'number' && input.amountCents > 0
      ? (input.amountCents / 100).toFixed(2)
      : null;

  let payload = [
    emv('00', '01'),
    emv('01', '11'),
    emv('26', merchantAccount),
    emv('52', '0000'),
    emv('53', '986'),
    amount ? emv('54', amount) : '',
    emv('58', 'BR'),
    emv('59', sanitizePixText(input.merchantName, 25) || 'SERMONTINY'),
    emv('60', sanitizePixText(input.merchantCity, 15) || 'TARUMA'),
    emv('62', emv('05', sanitizePixTxid(input.txid ?? '***'))),
  ].join('');

  payload += '6304';
  payload += crc16Ccitt(payload);
  return payload;
}

export function isValidPixPayload(payload: string) {
  if (!payload.startsWith('000201') || payload.length < 20) return false;
  const body = payload.slice(0, -4);
  const crc = payload.slice(-4);
  return crc16Ccitt(body) === crc;
}
