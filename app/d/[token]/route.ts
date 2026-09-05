import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 });
  }
  const { token } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from('documents')
    .select('storage_path, file_name, token_expires_at, deleted_at')
    .eq('access_token', token)
    .maybeSingle();

  if (!data || data.deleted_at) {
    return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 });
  }
  if (data.token_expires_at && new Date(data.token_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Link expirado.' }, { status: 410 });
  }

  const { data: signed, error } = await admin.storage.from('documents').createSignedUrl(data.storage_path, 120);
  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Não foi possível abrir o documento.' }, { status: 500 });
  }
  return NextResponse.redirect(signed.signedUrl);
}
