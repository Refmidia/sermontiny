/* eslint-disable @typescript-eslint/no-explicit-any -- linhas sem esquema tipado, como no cliente anterior */
import { randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export type DbError = { message: string; code?: string; details?: string };
export type DbResult<T = any> = { data: T; error: DbError | null; count: number | null };
type Row = Record<string, any>;
type Executor = Pool | PoolConnection;

/** Chaves estrangeiras usadas para resolver relações como `customers(*)` ou `alias:coluna(...)`. */
const FOREIGN_KEYS: Record<string, Record<string, string>> = {
  profiles: { role_id: 'roles' },
  role_permissions: { role_id: 'roles', permission_id: 'permissions' },
  customers: { created_by: 'profiles' },
  customer_units: { customer_id: 'customers' },
  customer_contacts: { customer_id: 'customers', unit_id: 'customer_units' },
  equipment: { created_by: 'profiles' },
  equipment_price_history: { equipment_id: 'equipment', changed_by: 'profiles' },
  leads: { equipment_id: 'equipment', assigned_to: 'profiles' },
  quotes: {
    customer_id: 'customers',
    unit_id: 'customer_units',
    contact_id: 'customer_contacts',
    owner_id: 'profiles',
    current_version_id: 'quote_versions',
    created_by: 'profiles',
  },
  quote_versions: { quote_id: 'quotes', created_by: 'profiles' },
  quote_items: { quote_version_id: 'quote_versions', equipment_id: 'equipment' },
  quote_payments: { quote_id: 'quotes', created_by: 'profiles' },
  contracts: {
    quote_id: 'quotes',
    quote_version_id: 'quote_versions',
    customer_id: 'customers',
    unit_id: 'customer_units',
    current_version_id: 'contract_versions',
    created_by: 'profiles',
  },
  contract_versions: { contract_id: 'contracts', created_by: 'profiles' },
  contract_clauses: { contract_version_id: 'contract_versions', library_id: 'clause_library' },
  documents: {
    customer_id: 'customers',
    quote_id: 'quotes',
    quote_version_id: 'quote_versions',
    contract_id: 'contracts',
    contract_version_id: 'contract_versions',
    created_by: 'profiles',
  },
  whatsapp_messages: {
    document_id: 'documents',
    quote_id: 'quotes',
    contract_id: 'contracts',
    created_by: 'profiles',
  },
  audit_logs: { actor_id: 'profiles' },
};

const TABLES_WITHOUT_ID = new Set(['role_permissions', 'storage_objects', 'site_services', 'site_media']);
const JSON_COLUMNS: Record<string, string[]> = {
  company_settings: ['phones'],
  audit_logs: ['metadata'],
  site_services: ['highlights', 'applications'],
};
const PRICE_FIELDS = ['daily_cents', 'monthly_cents', 'hourly_cents', 'km_cents', 'min_hours_per_day'];

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

function ident(name: string) {
  if (!IDENTIFIER.test(name)) throw new Error(`Identificador inválido: ${name}`);
  return `\`${name}\``;
}

function toMysqlDateTime(date: Date) {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

function serializeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return toMysqlDateTime(value);
  if (typeof value === 'string' && ISO_DATETIME.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : toMysqlDateTime(date);
  }
  if (Array.isArray(value) || (value !== null && typeof value === 'object' && !Buffer.isBuffer(value))) {
    return JSON.stringify(value);
  }
  return value;
}

function parseJsonColumns(table: string, rows: Row[]) {
  const columns = JSON_COLUMNS[table];
  if (!columns) return;
  for (const row of rows) {
    for (const column of columns) {
      const raw = row[column];
      if (typeof raw !== 'string') continue;
      try {
        row[column] = JSON.parse(raw);
      } catch {
        row[column] = column === 'metadata' ? {} : [];
      }
    }
  }
}

export function toDbError(error: unknown): DbError {
  const err = error as { message?: string; code?: string; sqlMessage?: string };
  const code =
    err?.code === 'ER_DUP_ENTRY'
      ? '23505'
      : err?.code === 'ER_NO_SUCH_TABLE'
        ? '42P01'
        : err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.code === 'ER_ROW_IS_REFERENCED_2'
          ? '23503'
          : err?.code;
  return { message: err?.sqlMessage || err?.message || 'Erro no banco de dados.', code };
}

type SelectNode =
  | { kind: 'star' }
  | { kind: 'column'; name: string; alias: string }
  | { kind: 'relation'; alias: string; target: string; children: SelectNode[] };

function splitTopLevel(input: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of input) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function parseSelect(input: string): SelectNode[] {
  return splitTopLevel(input.replace(/\s+/g, ' ')).map((part): SelectNode => {
    if (part === '*') return { kind: 'star' };
    const open = part.indexOf('(');
    if (open >= 0) {
      const head = part.slice(0, open).trim().replace(/!inner$/, '');
      const body = part.slice(open + 1, part.lastIndexOf(')'));
      const [alias, target] = head.includes(':') ? head.split(':').map((s) => s.trim()) : [head, head];
      return { kind: 'relation', alias, target, children: parseSelect(body) };
    }
    const [alias, name] = part.includes(':') ? part.split(':').map((s) => s.trim()) : [part, part];
    return { kind: 'column', name, alias };
  });
}

type Relation =
  | { type: 'one'; table: string; localColumn: string }
  | { type: 'many'; table: string; foreignColumn: string };

function resolveRelation(parent: string, target: string): Relation {
  const parentKeys = FOREIGN_KEYS[parent] ?? {};
  if (parentKeys[target]) return { type: 'one', table: parentKeys[target], localColumn: target };
  const localColumn = Object.keys(parentKeys).find((column) => parentKeys[column] === target);
  if (localColumn) return { type: 'one', table: target, localColumn };
  const childKeys = FOREIGN_KEYS[target] ?? {};
  const foreignColumn = Object.keys(childKeys).find((column) => childKeys[column] === parent);
  if (foreignColumn) return { type: 'many', table: target, foreignColumn };
  throw new Error(`Relação desconhecida entre ${parent} e ${target}.`);
}

type Where = { sql: string; params: unknown[] };

async function loadRows(
  db: Executor,
  table: string,
  nodes: SelectNode[],
  where: Where,
  tail = '',
  tailParams: unknown[] = [],
  requiredColumns: string[] = [],
): Promise<Row[]> {
  const hasStar = nodes.some((node) => node.kind === 'star');
  const relations = nodes
    .filter((node): node is Extract<SelectNode, { kind: 'relation' }> => node.kind === 'relation')
    .map((node) => ({ node, relation: resolveRelation(table, node.target) }));

  const requested = nodes.filter((node): node is Extract<SelectNode, { kind: 'column' }> => node.kind === 'column');
  const helperColumns = new Set(requiredColumns);
  for (const { relation } of relations) {
    helperColumns.add(relation.type === 'one' ? relation.localColumn : 'id');
  }

  let columnSql: string;
  const extras: string[] = [];
  if (hasStar) {
    columnSql = '*';
  } else {
    const names = new Set(requested.map((node) => node.name));
    const pieces = requested.map((node) =>
      node.alias === node.name ? ident(node.name) : `${ident(node.name)} AS ${ident(node.alias)}`,
    );
    for (const column of helperColumns) {
      if (!names.has(column)) {
        pieces.push(ident(column));
        extras.push(column);
      }
    }
    columnSql = pieces.length ? pieces.join(', ') : ident('id');
    if (!pieces.length) extras.push('id');
  }

  const sql = `SELECT ${columnSql} FROM ${ident(table)}${where.sql ? ` WHERE ${where.sql}` : ''}${tail}`;
  const [result] = await db.query<RowDataPacket[]>(sql, [...where.params, ...tailParams]);
  const rows = result as Row[];
  parseJsonColumns(table, rows);

  for (const { node, relation } of relations) {
    if (relation.type === 'one') {
      const keys = [...new Set(rows.map((row) => row[relation.localColumn]).filter((v) => v != null))];
      const children = keys.length
        ? await loadRows(db, relation.table, node.children, { sql: `${ident('id')} IN (?)`, params: [keys] }, '', [], ['id'])
        : [];
      const byId = new Map(children.map((child) => [child.id, child]));
      const stripId = !node.children.some((c) => c.kind === 'star' || (c.kind === 'column' && c.alias === 'id'));
      for (const row of rows) {
        const child = byId.get(row[relation.localColumn]);
        if (child && stripId) {
          const rest = { ...child };
          delete rest.id;
          row[node.alias] = rest;
        } else {
          row[node.alias] = child ?? null;
        }
      }
    } else {
      const ids = [...new Set(rows.map((row) => row.id).filter((v) => v != null))];
      const children = ids.length
        ? await loadRows(
            db,
            relation.table,
            node.children,
            { sql: `${ident(relation.foreignColumn)} IN (?)`, params: [ids] },
            '',
            [],
            [relation.foreignColumn],
          )
        : [];
      const keepForeign = node.children.some(
        (c) => c.kind === 'star' || (c.kind === 'column' && c.alias === relation.foreignColumn),
      );
      const grouped = new Map<unknown, Row[]>();
      for (const child of children) {
        const key = child[relation.foreignColumn];
        if (!keepForeign) delete child[relation.foreignColumn];
        const list = grouped.get(key) ?? [];
        list.push(child);
        grouped.set(key, list);
      }
      for (const row of rows) row[node.alias] = grouped.get(row.id) ?? [];
    }
  }

  const strip = extras.filter((column) => !requiredColumns.includes(column));
  if (strip.length) {
    for (const row of rows) for (const column of strip) delete row[column];
  }
  return rows;
}

type Filter = { column: string; op: 'eq' | 'is' | 'in'; value: unknown };
type Order = { column: string; ascending: boolean; nullsFirst?: boolean };
type Action = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

export type QueryContext = { actorId?: string | null };

export class QueryBuilder<T = any[]> implements PromiseLike<DbResult<T>> {
  private action: Action = 'select';
  private selectColumns = '*';
  private returning: string | null = null;
  private countRequested = false;
  private headOnly = false;
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitCount: number | null = null;
  private singleMode: 'single' | 'maybe' | null = null;
  private payload: Row[] = [];
  private onConflict: string | null = null;

  constructor(
    private readonly db: Executor,
    private readonly table: string,
    private readonly context: QueryContext = {},
  ) {
    ident(table);
  }

  select(columns = '*', options: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean } = {}) {
    if (this.action === 'select') {
      this.selectColumns = columns;
      this.countRequested = Boolean(options.count);
      this.headOnly = Boolean(options.head);
    } else {
      this.returning = columns;
    }
    return this;
  }

  insert(values: Row | Row[]) {
    this.action = 'insert';
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  upsert(values: Row | Row[], options: { onConflict?: string } = {}) {
    this.action = 'upsert';
    this.payload = Array.isArray(values) ? values : [values];
    this.onConflict = options.onConflict ?? null;
    return this;
  }

  update(values: Row) {
    this.action = 'update';
    this.payload = [values];
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: value === null ? 'is' : 'eq', value });
    return this;
  }

  is(column: string, value: null | boolean) {
    this.filters.push({ column, op: 'is', value });
    return this;
  }

  in(column: string, values: readonly unknown[]) {
    this.filters.push({ column, op: 'in', value: [...values] });
    return this;
  }

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) {
    this.orders.push({ column, ascending: options.ascending ?? true, nullsFirst: options.nullsFirst });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this as unknown as QueryBuilder<any>;
  }

  maybeSingle() {
    this.singleMode = 'maybe';
    return this as unknown as QueryBuilder<any>;
  }

  then<R1 = DbResult<T>, R2 = never>(
    onfulfilled?: ((value: DbResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private where(): Where {
    const parts: string[] = [];
    const params: unknown[] = [];
    for (const filter of this.filters) {
      const column = ident(filter.column);
      if (filter.op === 'is') {
        if (filter.value === null) parts.push(`${column} IS NULL`);
        else {
          parts.push(`${column} = ?`);
          params.push(filter.value ? 1 : 0);
        }
      } else if (filter.op === 'in') {
        const list = filter.value as unknown[];
        if (!list.length) parts.push('1 = 0');
        else {
          parts.push(`${column} IN (?)`);
          params.push(list.map(serializeValue));
        }
      } else {
        parts.push(`${column} = ?`);
        params.push(typeof filter.value === 'boolean' ? (filter.value ? 1 : 0) : serializeValue(filter.value));
      }
    }
    return { sql: parts.join(' AND '), params };
  }

  private tail(): { sql: string; params: unknown[] } {
    let sql = '';
    if (this.orders.length) {
      sql += ` ORDER BY ${this.orders
        .map(({ column, ascending, nullsFirst }) => {
          const nullsLast = nullsFirst === undefined ? ascending : !nullsFirst;
          return `${ident(column)} IS NULL ${nullsLast ? 'ASC' : 'DESC'}, ${ident(column)} ${ascending ? 'ASC' : 'DESC'}`;
        })
        .join(', ')}`;
    }
    const limit = this.limitCount ?? (this.singleMode ? 2 : null);
    if (limit !== null) sql += ` LIMIT ${Math.max(0, Math.floor(limit))}`;
    return { sql, params: [] };
  }

  private finish(rows: Row[] | null, count: number | null = null): DbResult<any> {
    if (this.singleMode && rows) {
      if (rows.length === 1) return { data: rows[0], error: null, count };
      if (rows.length === 0 && this.singleMode === 'maybe') return { data: null, error: null, count };
      return {
        data: null,
        error: { message: 'Registro não encontrado ou duplicado.', code: 'PGRST116' },
        count,
      };
    }
    return { data: rows, error: null, count };
  }

  private async execute(): Promise<DbResult<T>> {
    try {
      switch (this.action) {
        case 'select':
          return (await this.runSelect()) as DbResult<T>;
        case 'insert':
        case 'upsert':
          return (await this.runInsert()) as DbResult<T>;
        case 'update':
          return (await this.runUpdate()) as DbResult<T>;
        case 'delete':
          return (await this.runDelete()) as DbResult<T>;
      }
    } catch (error) {
      return { data: null as T, error: toDbError(error), count: null };
    }
  }

  private async runSelect() {
    const where = this.where();
    let count: number | null = null;
    if (this.countRequested) {
      const [rows] = await this.db.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM ${ident(this.table)}${where.sql ? ` WHERE ${where.sql}` : ''}`,
        where.params,
      );
      count = Number(rows[0]?.total ?? 0);
      if (this.headOnly) return { data: null, error: null, count };
    }
    const tail = this.tail();
    const rows = await loadRows(this.db, this.table, parseSelect(this.selectColumns), where, tail.sql, tail.params);
    return this.finish(rows, count);
  }

  private async reload(ids: unknown[]) {
    if (!this.returning) return this.finish(null);
    if (!ids.length) return this.finish([]);
    const rows = await loadRows(this.db, this.table, parseSelect(this.returning), {
      sql: `${ident('id')} IN (?)`,
      params: [ids],
    });
    return this.finish(rows);
  }

  private async runInsert() {
    const hasId = !TABLES_WITHOUT_ID.has(this.table);
    const rows: Row[] = this.payload.map((row) => (hasId && !row.id ? { id: randomUUID(), ...row } : { ...row }));
    if (!rows.length) return this.finish([]);
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const params: unknown[] = [];
    const values = rows
      .map(
        (row) =>
          `(${columns
            .map((column) => {
              if (!(column in row) || row[column] === undefined) return 'DEFAULT';
              params.push(serializeValue(row[column]));
              return '?';
            })
            .join(', ')})`,
      )
      .join(', ');

    let sql = `INSERT INTO ${ident(this.table)} (${columns.map(ident).join(', ')}) VALUES ${values}`;
    if (this.action === 'upsert') {
      const conflict = new Set((this.onConflict ?? 'id').split(',').map((c) => c.trim()));
      const updatable = columns.filter((column) => !conflict.has(column) && column !== 'id');
      const assignments = updatable.length
        ? updatable.map((column) => `${ident(column)} = VALUES(${ident(column)})`).join(', ')
        : `${ident(columns[0])} = ${ident(columns[0])}`;
      sql += ` ON DUPLICATE KEY UPDATE ${assignments}`;
    }
    await this.db.query<ResultSetHeader>(sql, params);

    if (this.table === 'equipment') {
      for (const row of rows) {
        if (this.action === 'insert' || PRICE_FIELDS.some((field) => field in row)) {
          await this.recordPriceHistory(row.id);
        }
      }
    }

    return this.reload(hasId ? rows.map((row) => row.id) : []);
  }

  private async matchingIds() {
    const where = this.where();
    const [rows] = await this.db.query<RowDataPacket[]>(
      `SELECT ${ident('id')} FROM ${ident(this.table)}${where.sql ? ` WHERE ${where.sql}` : ''}`,
      where.params,
    );
    return rows.map((row) => row.id as string);
  }

  private async runUpdate() {
    if (!this.filters.length) throw new Error('Atualização sem filtro bloqueada.');
    const values = this.payload[0] ?? {};
    const columns = Object.keys(values).filter((column) => values[column] !== undefined);
    const tracksPrices = this.table === 'equipment' && PRICE_FIELDS.some((field) => columns.includes(field));
    const ids = this.returning || tracksPrices ? await this.matchingIds() : [];
    let before = new Map<string, Row>();
    if (tracksPrices && ids.length) {
      const [rows] = await this.db.query<RowDataPacket[]>(
        `SELECT id, ${PRICE_FIELDS.map(ident).join(', ')} FROM equipment WHERE id IN (?)`,
        [ids],
      );
      before = new Map(rows.map((row) => [row.id as string, row as Row]));
    }

    if (columns.length) {
      const where = this.where();
      const assignments = columns.map((column) => `${ident(column)} = ?`).join(', ');
      await this.db.query<ResultSetHeader>(`UPDATE ${ident(this.table)} SET ${assignments} WHERE ${where.sql}`, [
        ...columns.map((column) => serializeValue(values[column])),
        ...where.params,
      ]);
    }

    if (tracksPrices) {
      for (const id of ids) {
        const previous = before.get(id);
        const changed = PRICE_FIELDS.some(
          (field) => field in values && Number(values[field]) !== Number(previous?.[field]),
        );
        if (changed) await this.recordPriceHistory(id);
      }
    }

    return this.reload(ids);
  }

  private async runDelete() {
    if (!this.filters.length) throw new Error('Exclusão sem filtro bloqueada.');
    const ids = this.returning ? await this.matchingIds() : [];
    const where = this.where();
    await this.db.query<ResultSetHeader>(`DELETE FROM ${ident(this.table)} WHERE ${where.sql}`, where.params);
    return this.returning ? this.finish(ids.map((id) => ({ id }))) : this.finish(null);
  }

  private async recordPriceHistory(equipmentId: string) {
    await this.db.query(
      'UPDATE equipment_price_history SET valid_to = CURRENT_TIMESTAMP(3) WHERE equipment_id = ? AND valid_to IS NULL',
      [equipmentId],
    );
    await this.db.query(
      `INSERT INTO equipment_price_history
         (id, equipment_id, daily_cents, monthly_cents, hourly_cents, km_cents, min_hours_per_day, changed_by)
       SELECT ?, id, daily_cents, monthly_cents, hourly_cents, km_cents, min_hours_per_day, ?
       FROM equipment WHERE id = ?`,
      [randomUUID(), this.context.actorId ?? null, equipmentId],
    );
  }
}

/** Mesmo comportamento da antiga função `next_document_number` do Postgres. */
export async function nextDocumentNumber(pool: Pool, kind: string): Promise<string> {
  if (kind !== 'quote' && kind !== 'contract') throw new Error('Tipo de documento inválido.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM company_settings WHERE id = '00000000-0000-0000-0000-000000000001' FOR UPDATE",
    );
    const settings = rows[0];
    if (!settings) throw new Error('Configurações da empresa não encontradas.');
    const year = new Date().getUTCFullYear();
    if (Number(settings.numbering_year) !== year) {
      await connection.query(
        'UPDATE company_settings SET numbering_year = ?, quote_next_seq = 1, contract_next_seq = 1 WHERE id = ?',
        [year, settings.id],
      );
      settings.quote_next_seq = 1;
      settings.contract_next_seq = 1;
    }
    const seqColumn = kind === 'quote' ? 'quote_next_seq' : 'contract_next_seq';
    const seq = Number(settings[seqColumn]);
    const prefix = String(kind === 'quote' ? settings.quote_prefix : settings.contract_prefix);
    await connection.query(`UPDATE company_settings SET ${seqColumn} = ${seqColumn} + 1 WHERE id = ?`, [settings.id]);
    await connection.commit();
    return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
}
