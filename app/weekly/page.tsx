import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppNav } from "@/components/app-nav";
import { SectionWeeklyView } from "@/components/section-weekly-view";
import { PageSkeleton } from "@/components/page-skeleton";

async function WeeklyContent({
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
        <SectionWeeklyView
          semester={bundle.activeSemester}
          sections={bundle.sections}
          entries={bundle.entries}
          currentUserId={profile.id}
          isAdmin={profile.role === "admin"}
        />
      </main>
    </div>
  );
}

export default function WeeklyPage(props: PageProps<"/weekly">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WeeklyContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
