import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { getGradesBundle } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { GradesView } from "@/components/grades-view";
import { ContentSkeleton } from "@/components/page-skeleton";

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
    <GradesView
      initialTerms={bundle.gradeTerms}
      migrationRequired={bundle.migrationRequired}
    />
  );
}

export default function GradesPage(props: PageProps<"/grades">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <GradesContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
