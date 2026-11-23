"use client";

import { useActionState, useState } from "react";
import { CalendarDays, Eye, EyeOff, Loader2, Moon, Sun } from "lucide-react";
import { loginAction, type AuthActionState } from "@/app/actions/auth";
import { useTheme } from "./theme-provider";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50/70 via-slate-50 to-amber-50/60 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 relative">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute top-5 right-5 h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>

      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-8 shadow-lg shadow-slate-200/40 dark:shadow-none">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="h-12 w-12 rounded-2xl bg-[#F19C99]/35 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-[#9E2A26] dark:text-[#FDE8E8] mb-3">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule TBA</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in with the account created by your admin
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300">
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@ms.bulsu.edu.ph"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              name="stayLoggedIn"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-rose-500 focus:ring-rose-400 cursor-pointer"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Stay logged in
              </span>{" "}
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Keep me signed in for 30 days on this device. Leave unchecked to
                sign out when you close the browser.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-60 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Need an account or forgot your password? Ask the group admin.
        </p>
      </div>
    </div>
  );
}
