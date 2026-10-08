/** Comprime e redimensiona imagens no navegador (sem dependência extra). */

const SOURCE_MAX_BYTES = 25 * 1024 * 1024;

type CompressOptions = {
  maxEdge: number;
  quality: number;
  type: 'image/jpeg' | 'image/webp';
};

export async function compressImageFile(file: File, { maxEdge, quality, type }: CompressOptions): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie uma imagem (JPG, PNG ou WebP).');
  }
  if (file.size > SOURCE_MAX_BYTES) {
    throw new Error('A foto deve ter no máximo 25 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Não foi possível processar a imagem.');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // Safari antigo não gera WebP e devolve PNG.
  if (blob && blob.type !== type) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  }
  if (!blob) throw new Error('Não foi possível comprimir a imagem.');

  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const base = file.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${base}.${extension}`, { type: blob.type, lastModified: Date.now() });
}

export function compressAvatarFile(file: File) {
  return compressImageFile(file, { maxEdge: 256, quality: 0.82, type: 'image/jpeg' });
}

export function compressEquipmentPhoto(file: File) {
  return compressImageFile(file, { maxEdge: 1600, quality: 0.8, type: 'image/webp' });
}
