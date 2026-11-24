import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getProfileBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { ProfileView } from "@/components/profile-view";
import { ContentSkeleton } from "@/components/page-skeleton";

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
