import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions';
import { renderQuotePdfBuffer } from '@/lib/pdf/quote-file';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user.permissions, 'quotes.read')) {
    return NextResponse.json({ error: 'Faça login para abrir o PDF.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const download = new URL(request.url).searchParams.get('download') === '1';
    const { buffer, fileName } = await renderQuotePdfBuffer(id);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Não foi possível gerar o PDF.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { generateQuotePdf } = await import('@/app/actions/documents');
  const { id } = await params;
  const result = await generateQuotePdf(id, true);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
