import { describe, expect, it } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { parseSelect, QueryBuilder } from '@/lib/db/query';

type Call = { sql: string; params: unknown[] };

function fakePool(tables: Record<string, Record<string, unknown>[]>) {
  const calls: Call[] = [];
  const pool = {
    async query(sql: string, params: unknown[] = []) {
      calls.push({ sql, params });
      const table = /FROM `(\w+)`/.exec(sql)?.[1] ?? '';
      let rows = [...(tables[table] ?? [])];
      const inMatch = /WHERE `(\w+)` IN \(\?\)/.exec(sql);
      if (inMatch) {
        const values = params[0] as unknown[];
        rows = rows.filter((row) => values.includes(row[inMatch[1]]));
      }
      const eqMatch = /WHERE `(\w+)` = \?/.exec(sql);
      if (eqMatch) rows = rows.filter((row) => row[eqMatch[1]] === params[0]);
      const list = /^SELECT (.+?) FROM/.exec(sql)?.[1] ?? '*';
      const columns = list === '*' ? null : [...list.matchAll(/`(\w+)`/g)].map((m) => m[1]);
      return [
        rows.map((row) => (columns ? Object.fromEntries(columns.map((c) => [c, row[c]])) : { ...row })),
        [],
      ];
    },
  };
  return { pool: pool as unknown as Pool, calls };
}

describe('parseSelect', () => {
  it('entende relações com alias e coluna', () => {
    expect(parseSelect('id, quote_versions:current_version_id(total_cents), customers(*)')).toEqual([
      { kind: 'column', name: 'id', alias: 'id' },
      {
        kind: 'relation',
        alias: 'quote_versions',
        target: 'current_version_id',
        children: [{ kind: 'column', name: 'total_cents', alias: 'total_cents' }],
      },
      { kind: 'relation', alias: 'customers', target: 'customers', children: [{ kind: 'star' }] },
    ]);
  });
});

describe('QueryBuilder', () => {
  it('resolve muitos-para-um e um-para-muitos', async () => {
    const { pool } = fakePool({
      quotes: [{ id: 'q1', number: 'ORC-1', customer_id: 'c1', current_version_id: 'v1' }],
      customers: [{ id: 'c1', legal_name: 'Cliente' }],
      quote_versions: [{ id: 'v1', total_cents: 500 }],
      quote_payments: [
        { id: 'p1', quote_id: 'q1', amount_cents: 100 },
        { id: 'p2', quote_id: 'q1', amount_cents: 50 },
      ],
    });
    const { data, error } = await new QueryBuilder(pool, 'quotes').select(
      'number, customers(legal_name), quote_versions:current_version_id(total_cents), quote_payments(amount_cents)',
    );
    expect(error).toBeNull();
    expect(data).toEqual([
      {
        number: 'ORC-1',
        customers: { legal_name: 'Cliente' },
        quote_versions: { total_cents: 500 },
        quote_payments: [{ amount_cents: 100 }, { amount_cents: 50 }],
      },
    ]);
  });

  it('single sem linha devolve erro e maybeSingle devolve null', async () => {
    const { pool } = fakePool({ equipment: [] });
    const single = await new QueryBuilder(pool, 'equipment').select('*').eq('id', 'x').single();
    expect(single.error?.code).toBe('PGRST116');
    const maybe = await new QueryBuilder(pool, 'equipment').select('*').eq('id', 'x').maybeSingle();
    expect(maybe).toMatchObject({ data: null, error: null });
  });

  it('insert gera id e converte data ISO para DATETIME', async () => {
    const { pool, calls } = fakePool({});
    await new QueryBuilder(pool, 'profiles').insert({ full_name: 'A', deleted_at: '2026-10-07T12:00:00.000Z' });
    const insert = calls.find((call) => call.sql.startsWith('INSERT'));
    expect(insert?.sql).toContain('INSERT INTO `profiles` (`id`, `full_name`, `deleted_at`)');
    expect(insert?.params[2]).toBe('2026-10-07 12:00:00.000');
    expect(String(insert?.params[0])).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('bloqueia update sem filtro', async () => {
    const { pool } = fakePool({});
    const { error } = await new QueryBuilder(pool, 'customers').update({ status: 'inactive' });
    expect(error?.message).toMatch(/sem filtro/);
  });
});
