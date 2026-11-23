import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppShell } from "@/components/app-shell";
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
    <AppShell
      profile={profile}
      semesters={bundle.semesters}
      activeSemesterId={bundle.activeSemester?.id ?? null}
    >
      <SectionWeeklyView
        semester={bundle.activeSemester}
        sections={bundle.sections}
        entries={bundle.entries}
        currentUserId={profile.id}
        isAdmin={profile.role === "admin"}
      />
    </AppShell>
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
