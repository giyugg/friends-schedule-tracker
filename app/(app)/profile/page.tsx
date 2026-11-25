import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getProfileBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/layout/setup-required-card";
import { ProfileView } from "@/components/profile/profile-view";
import { ContentSkeleton } from "@/components/layout/page-skeleton";

async function ProfileContent({
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
  const bundle = await getProfileBundle(profile.id, params.semester);

  return (
    <ProfileView
      profile={profile}
      activeSemester={bundle.activeSemester}
      userSection={bundle.userSection}
      sectionEntries={bundle.sectionEntries}
      visibleProfiles={bundle.visibleProfiles}
      visibleSections={bundle.visibleSections}
      visibleEntries={bundle.visibleEntries}
      visibilityGroups={bundle.visibilityGroups}
      gradeTerms={bundle.gradeTerms}
      gradesMigrationRequired={bundle.gradesMigrationRequired}
      changeRequests={bundle.changeRequests}
      requestsMigrationRequired={bundle.requestsMigrationRequired}
    />
  );
}

export default function ProfilePage(props: PageProps<"/profile">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProfileContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
