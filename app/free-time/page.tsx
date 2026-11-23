import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppNav } from "@/components/app-nav";
import { FreeTimeView } from "@/components/free-time-view";
import { PageSkeleton } from "@/components/page-skeleton";

async function FreeTimeContent({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  const [profile, params] = await Promise.all([
    requireProfile(),
    searchParams,
  ]);
  const bundle = await getScheduleBundle(params.semester);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav
        profile={profile}
        semesters={bundle.semesters}
        activeSemesterId={bundle.activeSemester?.id ?? null}
      />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5">
        <FreeTimeView
          semester={bundle.activeSemester}
          sections={bundle.sections}
          entries={bundle.entries}
        />
      </main>
    </div>
  );
}

export default function FreeTimePage(props: PageProps<"/free-time">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FreeTimeContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
