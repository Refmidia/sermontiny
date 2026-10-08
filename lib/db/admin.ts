import { createDbClient } from '@/lib/db/client';

export function createAdminClient() {
  return createDbClient();
}
