import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppShell } from "@/components/app-shell";
import { DailyGridView } from "@/components/daily-grid-view";
import { PageSkeleton } from "@/components/page-skeleton";

async function DailyContent({
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
      <DailyGridView
        semester={bundle.activeSemester}
        sections={bundle.sections}
        entries={bundle.entries}
        currentUserId={profile.id}
        isAdmin={profile.role === "admin"}
      />
    </AppShell>
  );
}

export default function DailyPage(props: PageProps<"/daily">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DailyContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
