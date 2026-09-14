import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';

const PIX_INK = '#071B35';
const STATIC_QR = 'public/images/sermontiny/pix-qr.png';

export async function pixQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 360,
    color: { dark: PIX_INK, light: '#FFFDF6' },
  });
}

export async function staticPixQrDataUrl() {
  const path = join(process.cwd(), STATIC_QR);
  if (!existsSync(path)) return null;
  const buffer = await readFile(path);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}
