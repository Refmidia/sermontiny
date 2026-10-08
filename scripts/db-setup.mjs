/**
 * Cria as tabelas no MySQL, aplica os dados iniciais e o administrador do painel.
 * Uso: npm run db:setup   (lê .env.local; pode rodar mais de uma vez)
 */
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const env = { ...process.env };
  const file = join(root, '.env.local');
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || env[match[1]]) continue;
    env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

const env = loadEnv();
const missing = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE', 'MYSQL_PASSWORD'].filter((key) => !env[key]);
if (missing.length) {
  console.error(`Faltam no .env.local: ${missing.join(', ')}`);
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT || 3306),
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  multipleStatements: true,
  charset: 'utf8mb4',
  connectTimeout: 15_000,
});

try {
  const [[version]] = await connection.query('SELECT VERSION() AS version');
  console.log(`Conectado em ${env.MYSQL_HOST} (${version.version}).`);
  await connection.query("SET time_zone = '+00:00'");

  await connection.query(readFileSync(join(root, 'database', 'schema.sql'), 'utf8'));
  console.log('Tabelas criadas/conferidas.');

  await connection.query(readFileSync(join(root, 'database', 'seed.sql'), 'utf8'));
  console.log('Dados iniciais aplicados.');

  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ADMIN_EMAIL/ADMIN_PASSWORD vazios: administrador não foi criado.');
  } else {
    const [[role]] = await connection.query("SELECT id FROM roles WHERE slug = 'administrator'");
    const [[existing]] = await connection.query('SELECT id FROM auth_users WHERE email = ?', [email]);
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = existing?.id ?? randomUUID();
    if (existing) {
      await connection.query('UPDATE auth_users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    } else {
      await connection.query('INSERT INTO auth_users (id, email, password_hash) VALUES (?, ?, ?)', [
        userId,
        email,
        passwordHash,
      ]);
    }
    await connection.query(
      `INSERT INTO profiles (id, full_name, role_id, is_active) VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), is_active = 1, deleted_at = NULL`,
      [userId, env.ADMIN_NAME?.trim() || 'Eduardo Pinheiro', role.id],
    );
    console.log(`Administrador pronto: ${email}`);
  }

  const [[counts]] = await connection.query(
    'SELECT (SELECT COUNT(*) FROM equipment) AS equipment, (SELECT COUNT(*) FROM permissions) AS permissions',
  );
  console.log(`Equipamentos: ${counts.equipment} · Permissões: ${counts.permissions}`);
} catch (error) {
  console.error('Falhou:', error.sqlMessage || error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
