import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServiceEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getSupabaseServiceEnv()) {
    return new NextResponse('Foto indisponível.', { status: 503 });
  }

  const { id } = await params;
  if (!id) return new NextResponse('Não encontrado.', { status: 404 });

  try {
    const admin = createAdminClient();
    const { data: item } = await admin
      .from('equipment')
      .select('photo_path')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!item?.photo_path) {
      return new NextResponse('Não encontrado.', { status: 404 });
    }

    const { data: file, error } = await admin.storage.from('equipment').download(item.photo_path);
    if (error || !file) {
      return new NextResponse('Não encontrado.', { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type || 'image/jpeg';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Foto indisponível.', { status: 503 });
  }
}
