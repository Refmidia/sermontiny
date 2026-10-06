import { pdf, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer | Uint8Array | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export async function renderPdfBuffer(document: ReactElement<DocumentProps>) {
  try {
    const blob = await pdf(document).toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    if (buffer.length > 80) return buffer;
  } catch {
    // Alguns ambientes Node não completam o toBlob(); tenta o stream nativo.
  }

  const buffer = await streamToBuffer(await pdf(document).toBuffer());
  if (buffer.length < 80) {
    throw new Error('O gerador de PDF retornou um arquivo vazio.');
  }
  return buffer;
}
