import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { FreeTimeView } from "@/components/free-time-view";
import { ContentSkeleton } from "@/components/page-skeleton";

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
  const visibleGroups =
    profile.role === "admin"
      ? bundle.visibilityGroups
      : bundle.visibilityGroups.filter((g) => g.memberIds.includes(profile.id));

  return (
    <FreeTimeView
      semester={bundle.activeSemester}
      sections={bundle.sections}
      entries={bundle.entries}
      groups={visibleGroups}
    />
  );
}

export default function FreeTimePage(props: PageProps<"/free-time">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <FreeTimeContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
