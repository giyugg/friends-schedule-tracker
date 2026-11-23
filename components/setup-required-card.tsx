import { Database, KeyRound, ShieldCheck } from "lucide-react";

export function SetupRequiredCard() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Supabase Setup Required
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              COF Schedules is ready—just connect your Supabase project.
            </p>
          </div>
        </div>

        <ol className="space-y-4 text-sm text-slate-700 dark:text-slate-300 mt-6">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Create a free Supabase project & run the schema
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Open <strong>SQL Editor</strong> in Supabase, paste{" "}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                  supabase/schema.sql
                </code>
                , and click <strong>Run</strong>.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                Copy your API keys into{" "}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                  .env.local
                </code>
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Copy <code className="font-mono text-xs">.env.example</code> to{" "}
                <code className="font-mono text-xs">.env.local</code> and fill
                in{" "}
                <code className="font-mono text-xs">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>
                ,{" "}
                <code className="font-mono text-xs">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>
                , and{" "}
                <code className="font-mono text-xs">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>
                .
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Create your Admin account
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                In Supabase <strong>Authentication → Users → Add user</strong>,
                create{" "}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                  2025009221@ms.bulsu.edu.ph
                </code>{" "}
                (check <em>Auto Confirm User</em>). The trigger automatically
                promotes it to <strong>Admin</strong>.
              </p>
            </div>
          </li>
        </ol>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          See <code className="font-mono">README.md</code> for the full step-by-step guide, then restart the dev server.
        </div>
      </div>
    </div>
  );
}
