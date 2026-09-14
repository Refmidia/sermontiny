import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const STATIC_QR = 'public/images/sermontiny/pix-qr.png';

export async function staticPixQrDataUrl() {
  const path = join(process.cwd(), STATIC_QR);
  if (!existsSync(path)) return null;
  const buffer = await readFile(path);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}
