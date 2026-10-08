import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2/promise';
import { getPool } from '@/lib/db/pool';

export type AuthUser = { id: string; email: string; last_sign_in_at: string | null; created_at: string };

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    'SELECT id, email, password_hash, last_sign_in_at, created_at FROM auth_users WHERE email = ? LIMIT 1',
    [email.trim().toLowerCase()],
  );
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, String(row.password_hash)))) return null;
  await getPool().query('UPDATE auth_users SET last_sign_in_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [row.id]);
  return { id: row.id, email: row.email, last_sign_in_at: row.last_sign_in_at, created_at: row.created_at };
}

export async function listAuthUsers(): Promise<AuthUser[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    'SELECT id, email, last_sign_in_at, created_at FROM auth_users ORDER BY created_at',
  );
  return rows as AuthUser[];
}

/** Cria o login e o perfil inativo, como fazia o gatilho `handle_new_user`. */
export async function createAuthUser(email: string, password: string, fullName: string) {
  const normalized = email.trim().toLowerCase();
  const pool = getPool();
  const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM auth_users WHERE email = ? LIMIT 1', [normalized]);
  if (existing.length) throw new Error('Já existe um usuário com este e-mail.');

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('INSERT INTO auth_users (id, email, password_hash) VALUES (?, ?, ?)', [
      id,
      normalized,
      passwordHash,
    ]);
    await connection.query(
      `INSERT INTO profiles (id, full_name, role_id, is_active)
       VALUES (?, ?, (SELECT id FROM roles WHERE slug = 'viewer'), 0)`,
      [id, fullName || normalized.split('@')[0]],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
  return { id, email: normalized };
}

export async function updateAuthPassword(userId: string, password: string) {
  const passwordHash = await hashPassword(password);
  await getPool().query('UPDATE auth_users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}
