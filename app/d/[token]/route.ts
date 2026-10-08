import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/admin';
import { isDatabaseConfigured } from '@/lib/db/pool';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isDatabaseConfigured()) {
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

  const { data: file, error } = await admin.storage.from('documents').download(data.storage_path);
  if (error || !file) {
    return NextResponse.json({ error: 'Não foi possível abrir o documento.' }, { status: 500 });
  }
  const fileName = String(data.file_name || 'documento.pdf').replace(/["\r\n]/g, '');
  return new NextResponse(Buffer.from(await file.arrayBuffer()), {
    headers: {
      'Content-Type': file.type || 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
