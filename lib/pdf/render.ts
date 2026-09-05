import { pdf, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

export async function renderPdfBuffer(document: ReactElement<DocumentProps>) {
  const instance = pdf(document);
  const blob = await instance.toBlob();
  return Buffer.from(await blob.arrayBuffer());
}
