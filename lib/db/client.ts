import { getPool } from '@/lib/db/pool';
import { nextDocumentNumber, QueryBuilder, toDbError, type DbError, type QueryContext } from '@/lib/db/query';
import { createStorageApi } from '@/lib/db/storage';

export function createDbClient(context: QueryContext = {}) {
  const pool = getPool();
  return {
    from: (table: string) => new QueryBuilder(pool, table, context),
    async rpc(name: string, args: Record<string, unknown> = {}) {
      try {
        if (name !== 'next_document_number') throw new Error(`Função desconhecida: ${name}`);
        const data = await nextDocumentNumber(pool, String(args.doc_kind ?? ''));
        return { data, error: null as DbError | null };
      } catch (error) {
        return { data: null, error: toDbError(error) };
      }
    },
    storage: createStorageApi(pool),
  };
}

export type DbClient = ReturnType<typeof createDbClient>;
