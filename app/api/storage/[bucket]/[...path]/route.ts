import { NextResponse } from 'next/server';
import { getPool, isDatabaseConfigured } from '@/lib/db/pool';
import { PUBLIC_BUCKETS, readStorageObject, verifyStorageSignature } from '@/lib/db/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ bucket: string; path: string[] }> }) {
  if (!isDatabaseConfigured()) {
    return new NextResponse('Arquivo indisponível.', { status: 503 });
  }

  const { bucket, path: segments } = await params;
  const path = segments
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join('/');
  const isPublic = PUBLIC_BUCKETS.has(bucket);
  if (!isPublic) {
    const url = new URL(request.url);
    const expires = Number(url.searchParams.get('exp'));
    const signature = url.searchParams.get('sig') ?? '';
    if (!verifyStorageSignature(bucket, path, expires, signature)) {
      return new NextResponse('Link inválido ou expirado.', { status: 403 });
    }
  }

  try {
    const object = await readStorageObject(getPool(), bucket, path);
    if (!object) return new NextResponse('Não encontrado.', { status: 404 });
    return new NextResponse(new Uint8Array(object.content), {
      headers: {
        'Content-Type': object.contentType,
        'Content-Length': String(object.size),
        'Cache-Control': isPublic ? 'public, max-age=3600, stale-while-revalidate=86400' : 'private, no-store',
      },
    });
  } catch {
    return new NextResponse('Arquivo indisponível.', { status: 503 });
  }
}
