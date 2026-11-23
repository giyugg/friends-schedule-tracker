"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import {
  changePasswordAction,
  logoutAction,
  type AuthActionState,
} from "@/app/actions/auth";

const initialState: AuthActionState = {};

export function ChangePasswordForm({
  displayName,
  forced,
}: {
  displayName: string;
  forced: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50/70 via-slate-50 to-amber-50/60 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-lg shadow-slate-200/40 dark:shadow-none">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {forced ? `Welcome, ${displayName}!` : "Change Password"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {forced
              ? "Please set your own private password before viewing schedules."
              : "Choose a new password of at least 8 characters."}
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
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900/50 transition"
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900/50 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-60 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Saving password…" : "Save New Password"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {!forced ? (
            <Link
              href="/daily"
              className="hover:text-slate-900 dark:hover:text-slate-200 underline underline-offset-2"
            >
              ← Back to schedules
            </Link>
          ) : (
            <span>Required on first sign-in</span>
          )}

          <form action={logoutAction}>
            <button
              type="submit"
              className="hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
