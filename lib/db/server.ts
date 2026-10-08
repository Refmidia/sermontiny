import { cookies } from 'next/headers';
import { SESSION_COOKIE, readSessionToken } from '@/lib/auth/token';
import { createDbClient } from '@/lib/db/client';

/** Cliente do painel: as permissões são conferidas nas actions/páginas antes de cada consulta. */
export async function createClient() {
  const cookieStore = await cookies();
  const session = await readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  return createDbClient({ actorId: session?.sub ?? null });
}
