import { createClient as createJsClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { BOOTSTRAP_COOKIE, readBootstrapToken } from '@/lib/auth/bootstrap';
import { getSupabasePublicEnv, getSupabaseServiceEnv } from '@/lib/supabase/env';

export async function createUserClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error('Supabase não configurado.');
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies.
        }
      },
    },
  });
}

export async function createClient() {
  const cookieStore = await cookies();
  const bootstrap = await readBootstrapToken(cookieStore.get(BOOTSTRAP_COOKIE)?.value);
  const service = getSupabaseServiceEnv();
  if (bootstrap && service) {
    return createJsClient(service.url, service.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    });
  }
  return createUserClient();
}
