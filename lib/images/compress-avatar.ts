/** Comprime e redimensiona avatar no navegador (sem dependência extra). */

const MAX_EDGE = 256;
const JPEG_QUALITY = 0.82;

export async function compressAvatarFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie uma imagem (JPG, PNG ou WebP).');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('A foto deve ter no máximo 8 MB antes da compressão.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
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

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
  });
  if (!blob) throw new Error('Não foi possível comprimir a imagem.');

  const base = file.name.replace(/\.[^.]+$/, '') || 'avatar';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}
