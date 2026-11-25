import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/layout/setup-required-card";
import { DailyGridView } from "@/components/schedule/daily-grid-view";
import { ContentSkeleton } from "@/components/layout/page-skeleton";

async function DailyContent({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string; preset?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  const [profile, params] = await Promise.all([
    requireProfile(),
    searchParams,
  ]);
  const bundle = await getScheduleBundle(params.semester);
  const visibleGroups =
    profile.role === "admin"
      ? bundle.visibilityGroups
      : bundle.visibilityGroups.filter((g) => g.memberIds.includes(profile.id));

  return (
    <DailyGridView
      key={`${bundle.activeSemester?.id ?? "none"}:${params.preset ?? ""}`}
      semester={bundle.activeSemester}
      sections={bundle.sections}
      entries={bundle.entries}
      currentUserId={profile.id}
      isAdmin={profile.role === "admin"}
      groups={visibleGroups}
      initialGroupPresetId={params.preset}
    />
  );
}

export default function DailyPage(props: PageProps<"/daily">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <DailyContent
        searchParams={
          props.searchParams as Promise<{ semester?: string; preset?: string }>
        }
      />
    </Suspense>
  );
}
