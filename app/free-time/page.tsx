import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppShell } from "@/components/app-shell";
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
    <AppShell
      profile={profile}
      semesters={bundle.semesters}
      activeSemesterId={bundle.activeSemester?.id ?? null}
    >
      <FreeTimeView
        semester={bundle.activeSemester}
        sections={bundle.sections}
        entries={bundle.entries}
      />
    </AppShell>
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
