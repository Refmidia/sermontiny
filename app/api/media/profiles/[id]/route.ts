import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/admin';
import { isDatabaseConfigured } from '@/lib/db/pool';

export const dynamic = 'force-dynamic';

const CANDIDATES = (id: string, photoPath?: string | null) =>
  [photoPath, `${id}.jpg`, `${id}.jpeg`, `${id}.webp`, `${id}.png`].filter(Boolean) as string[];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) {
    return new NextResponse('Foto indisponível.', { status: 503 });
  }

  const { id } = await params;
  if (!id) return new NextResponse('Não encontrado.', { status: 404 });

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('photo_path')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    const photoPath = profile?.photo_path ?? null;

    for (const path of CANDIDATES(id, photoPath)) {
      const { data: file, error } = await admin.storage.from('avatars').download(path);
      if (error || !file) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const type = file.type || 'image/jpeg';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': type,
          'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
          'Content-Length': String(buffer.byteLength),
        },
      });
    }

    return new NextResponse('Não encontrado.', { status: 404 });
  } catch {
    return new NextResponse('Foto indisponível.', { status: 503 });
  }
}
