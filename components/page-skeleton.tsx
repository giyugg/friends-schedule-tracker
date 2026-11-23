export function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 flex items-center justify-between">
        <div className="h-7 w-40 rounded-lg bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="h-8 w-48 rounded-lg bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="max-w-[1600px] w-full mx-auto p-6 space-y-4">
        <div className="h-10 w-80 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="h-[60vh] w-full rounded-2xl bg-slate-200/50 dark:bg-slate-900 animate-pulse" />
      </div>
    </div>
  );
}
