import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getGroupDashboardBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { GroupDashboardView } from "@/components/group-dashboard-view";
import { ContentSkeleton } from "@/components/page-skeleton";

async function GroupDashboardContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ semester?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  const [profile, resolvedParams, resolvedSearch] = await Promise.all([
    requireProfile(),
    params,
    searchParams,
  ]);

  const bundle = await getGroupDashboardBundle(
    resolvedParams.id,
    resolvedSearch.semester
  );

  if (!bundle) {
    notFound();
  }

  return (
    <GroupDashboardView
      group={bundle.group}
      semester={bundle.activeSemester}
      semesterParam={resolvedSearch.semester ?? null}
      members={bundle.members}
      sections={bundle.sections}
      entries={bundle.entries}
      currentUserId={profile.id}
      isAdmin={profile.role === "admin"}
    />
  );
}

export default function GroupDashboardPage(props: PageProps<"/groups/[id]">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <GroupDashboardContent
        params={props.params}
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
