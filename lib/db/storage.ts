import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { toDbError, type DbError } from '@/lib/db/query';

export const PUBLIC_BUCKETS = new Set(['logos', 'equipment', 'certificates', 'site']);
const KNOWN_BUCKETS = ['logos', 'equipment', 'certificates', 'site', 'documents', 'avatars'];

type UploadBody = Blob | ArrayBuffer | ArrayBufferView | Buffer | string;
type UploadOptions = { contentType?: string; upsert?: boolean; cacheControl?: string };

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  json: 'application/json',
};

function guessMime(path: string) {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

async function toBuffer(body: UploadBody): Promise<{ buffer: Buffer; type?: string }> {
  if (typeof body === 'string') return { buffer: Buffer.from(body) };
  if (Buffer.isBuffer(body)) return { buffer: body };
  if (body instanceof ArrayBuffer) return { buffer: Buffer.from(body) };
  if (ArrayBuffer.isView(body)) return { buffer: Buffer.from(body.buffer, body.byteOffset, body.byteLength) };
  return { buffer: Buffer.from(await body.arrayBuffer()), type: body.type || undefined };
}

function signingSecret() {
  return process.env.AUTH_SECRET?.trim() || process.env.MYSQL_PASSWORD || 'sermontiny';
}

function signature(bucket: string, path: string, expires: number) {
  return createHmac('sha256', signingSecret()).update(`${bucket}/${path}:${expires}`).digest('base64url');
}

export function verifyStorageSignature(bucket: string, path: string, expires: number, provided: string) {
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = Buffer.from(signature(bucket, path, expires));
  const given = Buffer.from(provided);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export function storageObjectUrl(bucket: string, path: string) {
  return `/api/storage/${encodeURIComponent(bucket)}/${encodePath(path)}`;
}

function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export async function readStorageObject(pool: Pool, bucket: string, path: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT content, content_type, size, updated_at FROM storage_objects WHERE bucket = ? AND path = ? LIMIT 1',
    [bucket, path],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    content: row.content as Buffer,
    contentType: String(row.content_type),
    size: Number(row.size),
    updatedAt: String(row.updated_at),
  };
}

class BucketApi {
  constructor(
    private readonly pool: Pool,
    private readonly bucket: string,
  ) {}

  async upload(path: string, body: UploadBody, options: UploadOptions = {}) {
    try {
      const { buffer, type } = await toBuffer(body);
      const contentType = options.contentType || type || guessMime(path);
      const sql = options.upsert
        ? `INSERT INTO storage_objects (bucket, path, content, content_type, size) VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE content = VALUES(content), content_type = VALUES(content_type), size = VALUES(size)`
        : 'INSERT INTO storage_objects (bucket, path, content, content_type, size) VALUES (?, ?, ?, ?, ?)';
      await this.pool.query(sql, [this.bucket, path, buffer, contentType, buffer.length]);
      return { data: { path, fullPath: `${this.bucket}/${path}` }, error: null as DbError | null };
    } catch (error) {
      const dbError = toDbError(error);
      if (dbError.code === '23505') dbError.message = 'O arquivo já existe.';
      return { data: null, error: dbError };
    }
  }

  async download(path: string) {
    try {
      const object = await readStorageObject(this.pool, this.bucket, path);
      if (!object) return { data: null, error: { message: 'Arquivo não encontrado.', code: '404' } as DbError };
      const blob = new Blob([new Uint8Array(object.content)], { type: object.contentType });
      return { data: blob, error: null as DbError | null };
    } catch (error) {
      return { data: null, error: toDbError(error) };
    }
  }

  async remove(paths: string[]) {
    try {
      if (paths.length) {
        await this.pool.query('DELETE FROM storage_objects WHERE bucket = ? AND path IN (?)', [this.bucket, paths]);
      }
      return { data: paths.map((name) => ({ name })), error: null as DbError | null };
    } catch (error) {
      return { data: null, error: toDbError(error) };
    }
  }

  async createSignedUrl(path: string, expiresInSeconds: number) {
    const expires = Date.now() + expiresInSeconds * 1000;
    const signedUrl = `${siteOrigin()}${storageObjectUrl(this.bucket, path)}?exp=${expires}&sig=${signature(this.bucket, path, expires)}`;
    return { data: { signedUrl }, error: null as DbError | null };
  }

  getPublicUrl(path: string) {
    return { data: { publicUrl: storageObjectUrl(this.bucket, path) } };
  }
}

export function createStorageApi(pool: Pool) {
  return {
    from: (bucket: string) => new BucketApi(pool, bucket),
    listBuckets: async () => ({
      data: KNOWN_BUCKETS.map((name) => ({ id: name, name, public: PUBLIC_BUCKETS.has(name) })),
      error: null as DbError | null,
    }),
    createBucket: async (name: string) => ({ data: { name }, error: null as DbError | null }),
  };
}
