import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "./config";

export function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local to manage accounts."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
