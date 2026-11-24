import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getProfileBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppShell } from "@/components/app-shell";
import { ProfileView } from "@/components/profile-view";
import { PageSkeleton } from "@/components/page-skeleton";

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
    <AppShell
      profile={profile}
      semesters={bundle.semesters}
      activeSemesterId={bundle.activeSemester?.id ?? null}
      visibilityGroups={bundle.visibilityGroups}
    >
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
    </AppShell>
  );
}

export default function ProfilePage(props: PageProps<"/profile">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProfileContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
