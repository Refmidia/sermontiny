import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv, getSupabaseServiceEnv } from '@/lib/supabase/env';

const PUBLIC_READ_TIMEOUT_MS = 3000;
const FAILURE_COOLDOWN_MS = 60_000;

let lastFailureAt = 0;

/** Depois de uma falha, o site público pula o banco por um minuto em vez de esperar o timeout de novo. */
export async function withPublicReadBreaker<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  if (Date.now() - lastFailureAt < FAILURE_COOLDOWN_MS) return fallback;
  try {
    return await load();
  } catch {
    lastFailureAt = Date.now();
    return fallback;
  }
}

/** Cliente sem cookies para dados do site público; desiste rápido se o banco não responder. */
export function createPublicReader() {
  const service = getSupabaseServiceEnv();
  const pub = getSupabasePublicEnv();
  const env = service ?? pub;
  if (!env) return null;
  const key = service?.serviceRoleKey ?? pub?.anonKey;
  if (!key) return null;
  return createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const timeout = AbortSignal.timeout(PUBLIC_READ_TIMEOUT_MS);
        const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
        return fetch(input, { ...init, cache: 'no-store', signal });
      },
    },
  });
}
