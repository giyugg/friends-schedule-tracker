import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/layout/setup-required-card";
import { SectionWeeklyView } from "@/components/schedule/section-weekly-view";
import { ContentSkeleton } from "@/components/layout/page-skeleton";

async function WeeklyContent({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string; section?: string }>;
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
    <SectionWeeklyView
      key={`${bundle.activeSemester?.id ?? "none"}:${params.section ?? ""}`}
      semester={bundle.activeSemester}
      sections={bundle.sections}
      entries={bundle.entries}
      currentUserId={profile.id}
      isAdmin={profile.role === "admin"}
      initialSectionId={params.section}
    />
  );
}

export default function WeeklyPage(props: PageProps<"/weekly">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <WeeklyContent
        searchParams={
          props.searchParams as Promise<{ semester?: string; section?: string }>
        }
      />
    </Suspense>
  );
}
