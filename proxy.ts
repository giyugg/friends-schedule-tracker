import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  PERSISTENT_COOKIE_MAX_AGE,
  STAY_LOGGED_IN_COOKIE,
} from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const stayLoggedIn =
    request.cookies.get(STAY_LOGGED_IN_COOKIE)?.value === "1";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const isClearing = !value || options?.maxAge === 0;
            if (isClearing) {
              supabaseResponse.cookies.set(name, value, options);
              return;
            }
            if (stayLoggedIn) {
              supabaseResponse.cookies.set(name, value, {
                ...options,
                maxAge: PERSISTENT_COOKIE_MAX_AGE,
              });
            } else {
              const sessionOptions = { ...options };
              delete sessionOptions.maxAge;
              delete sessionOptions.expires;
              supabaseResponse.cookies.set(name, value, sessionOptions);
            }
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isHomeRoute = pathname === "/";
  const isLoginRoute = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (!user) {
    if (!isLoginRoute && !isHomeRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Only query profiles in proxy when needed for early routing decisions.
  // Authenticated app routes enforce must_change_password inside app/(app)/layout.tsx.
  if (isLoginRoute || isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", user.id)
      .single();

    const mustChange = profile?.must_change_password ?? false;
    const isAdmin = profile?.role === "admin";

    if (isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = mustChange ? "/change-password" : "/daily";
      return NextResponse.redirect(url);
    }

    if (isAdminRoute && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/daily";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
