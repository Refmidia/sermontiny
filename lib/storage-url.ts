export function equipmentPhotoSrc(item: { id: string; photo_path?: string | null }) {
  if (!item.photo_path) return null;
  return `/api/media/equipment/${item.id}`;
}

export function publicStorageUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
