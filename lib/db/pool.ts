import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

export function getMysqlEnv() {
  const host = process.env.MYSQL_HOST?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const database = process.env.MYSQL_DATABASE?.trim();
  const password = process.env.MYSQL_PASSWORD ?? '';
  if (!host || !user || !database) return null;
  return {
    host,
    port: Number(process.env.MYSQL_PORT || 3306),
    user,
    password,
    database,
  };
}

export function isDatabaseConfigured() {
  return getMysqlEnv() !== null;
}

function toIsoDateTime(value: string) {
  return `${value.replace(' ', 'T')}${value.includes('.') ? '' : '.000'}Z`;
}

const typeCast: PoolOptions['typeCast'] = (field, next) => {
  if (field.type === 'TINY' && field.length === 1) {
    const value = field.string();
    return value === null ? null : value === '1';
  }
  if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
    const value = field.string();
    return value === null ? null : toIsoDateTime(value);
  }
  if (field.type === 'DATE') {
    return field.string();
  }
  return next();
};

const globalForPool = globalThis as unknown as { __sermontinyPool?: Pool };

export function getPool(): Pool {
  if (globalForPool.__sermontinyPool) return globalForPool.__sermontinyPool;
  const env = getMysqlEnv();
  if (!env) throw new Error('Banco de dados não configurado (MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE).');

  const pool = mysql.createPool({
    ...env,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    connectTimeout: 8_000,
    enableKeepAlive: true,
    charset: 'utf8mb4',
    timezone: 'Z',
    dateStrings: true,
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
    typeCast,
  });
  pool.pool.on('connection', (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });
  globalForPool.__sermontinyPool = pool;
  return pool;
}
