import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getGradesBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppShell } from "@/components/app-shell";
import { GradesView } from "@/components/grades-view";
import { PageSkeleton } from "@/components/page-skeleton";

async function GradesContent({
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
  const bundle = await getGradesBundle(profile.id, params.semester);

  return (
    <AppShell
      profile={profile}
      semesters={bundle.semesters}
      activeSemesterId={bundle.activeSemester?.id ?? null}
      visibilityGroups={bundle.visibilityGroups}
    >
      <GradesView
        initialTerms={bundle.gradeTerms}
        migrationRequired={bundle.migrationRequired}
      />
    </AppShell>
  );
}

export default function GradesPage(props: PageProps<"/grades">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GradesContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
