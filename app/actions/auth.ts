"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  PERSISTENT_COOKIE_MAX_AGE,
  STAY_LOGGED_IN_COOKIE,
} from "@/lib/supabase/config";

export interface AuthActionState {
  error?: string;
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase is not configured yet. Please set up .env.local first.",
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const stayLoggedIn = formData.get("stayLoggedIn") === "on";

  if (!email || !password) {
    return { error: "Please enter both your email and password." };
  }

  const cookieStore = await cookies();
  if (stayLoggedIn) {
    cookieStore.set(STAY_LOGGED_IN_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: PERSISTENT_COOKIE_MAX_AGE,
    });
  } else {
    cookieStore.set(STAY_LOGGED_IN_COOKIE, "0", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  const supabase = await createClient(stayLoggedIn);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error:
        error?.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error?.message ?? "Unable to sign in. Please try again.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("must_change_password")
    .eq("id", data.user.id)
    .single();

  if (profile?.must_change_password) {
    redirect("/change-password");
  }

  redirect("/");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete(STAY_LOGGED_IN_COOKIE);

  redirect("/login");
}

export async function changePasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error: authError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (authError) {
    return { error: authError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  redirect("/");
}
