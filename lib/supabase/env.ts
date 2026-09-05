export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getSupabaseServiceEnv() {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!publicEnv || !serviceRoleKey) return null;
  return { ...publicEnv, serviceRoleKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv() !== null;
}
