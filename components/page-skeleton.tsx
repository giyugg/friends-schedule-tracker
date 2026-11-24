export function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:block w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-3">
        <div className="h-9 w-36 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="h-8 w-full rounded-xl bg-slate-200/60 dark:bg-slate-800/70 animate-pulse mt-6" />
        <div className="h-8 w-full rounded-xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        <div className="h-8 w-full rounded-xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="h-10 w-80 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="h-[65vh] w-full rounded-2xl bg-slate-200/50 dark:bg-slate-900 animate-pulse" />
      </div>
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
          <div className="h-4 w-80 max-w-full rounded-lg bg-slate-200/50 dark:bg-slate-800/60" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-slate-200/60 dark:bg-slate-800/70" />
      </div>
      <div className="h-[60vh] w-full rounded-2xl bg-slate-200/45 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60" />
    </div>
  );
}
