import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error('Supabase não configurado.');
  }
  return createBrowserClient(env.url, env.anonKey);
}
