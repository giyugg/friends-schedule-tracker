export const STAY_LOGGED_IN_COOKIE = "cof_stay_logged_in";
export const PERSISTENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const BOOTSTRAP_ADMIN_EMAIL = "2025009221@ms.bulsu.edu.ph";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
