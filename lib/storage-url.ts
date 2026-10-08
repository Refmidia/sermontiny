export function equipmentPhotoSrc(item: { id: string; photo_path?: string | null }) {
  if (!item.photo_path) return null;
  return `/api/media/equipment/${item.id}?v=${encodeURIComponent(item.photo_path)}`;
}

export function publicStorageUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `/api/storage/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
}
