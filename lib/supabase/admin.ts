import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceEnv } from '@/lib/supabase/env';

export function createAdminClient() {
  const env = getSupabaseServiceEnv();
  if (!env) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  }
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
