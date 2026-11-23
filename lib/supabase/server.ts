import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  PERSISTENT_COOKIE_MAX_AGE,
  STAY_LOGGED_IN_COOKIE,
} from "./config";

export async function createClient(stayLoggedInOverride?: boolean) {
  const cookieStore = await cookies();
  const stayLoggedIn =
    stayLoggedInOverride ??
    cookieStore.get(STAY_LOGGED_IN_COOKIE)?.value === "1";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const isClearing = !value || options?.maxAge === 0;
              if (isClearing) {
                cookieStore.set(name, value, options);
                return;
              }

              if (stayLoggedIn) {
                cookieStore.set(name, value, {
                  ...options,
                  maxAge: PERSISTENT_COOKIE_MAX_AGE,
                });
              } else {
                // Session cookie: expires when the browser closes
                const sessionOptions = { ...options };
                delete sessionOptions.maxAge;
                delete sessionOptions.expires;
                cookieStore.set(name, value, sessionOptions);
              }
            });
          } catch {
            // setAll called from a Server Component where cookies are read-only.
            // proxy.ts handles refreshing session cookies on navigation.
          }
        },
      },
    }
  );
}
