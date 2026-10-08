import { createDbClient } from '@/lib/db/client';
import { isDatabaseConfigured } from '@/lib/db/pool';

const PUBLIC_READ_TIMEOUT_MS = 4000;
const FAILURE_COOLDOWN_MS = 60_000;

let lastFailureAt = 0;

/** Depois de uma falha, o site público pula o banco por um minuto em vez de esperar o timeout de novo. */
export async function withPublicReadBreaker<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  if (Date.now() - lastFailureAt < FAILURE_COOLDOWN_MS) return fallback;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Tempo esgotado ao consultar o banco.')), PUBLIC_READ_TIMEOUT_MS);
    });
    return await Promise.race([load(), timeout]);
  } catch {
    lastFailureAt = Date.now();
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

/** Cliente sem cookies para dados do site público. */
export function createPublicReader() {
  if (!isDatabaseConfigured()) return null;
  return createDbClient();
}
