import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminProfileChangeRequests,
  getScheduleBundle,
} from "@/lib/data";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppShell } from "@/components/app-shell";
import { AdminDashboard } from "@/components/admin-dashboard";
import { PageSkeleton } from "@/components/page-skeleton";

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  const [adminProfile, params] = await Promise.all([
    requireAdmin(),
    searchParams,
  ]);
  const bundle = await getScheduleBundle(params.semester);
  const requestsBundle = await getAdminProfileChangeRequests(bundle.profiles);

  return (
    <AppShell
      profile={adminProfile}
      semesters={bundle.semesters}
      activeSemesterId={bundle.activeSemester?.id ?? null}
      visibilityGroups={bundle.visibilityGroups}
    >
      <AdminDashboard
        currentAdminId={adminProfile.id}
        semesters={bundle.semesters}
        activeSemester={bundle.activeSemester}
        sections={bundle.sections}
        entries={bundle.entries}
        profiles={bundle.profiles}
        visibilityGroups={bundle.visibilityGroups}
        profileRequests={requestsBundle.requests}
        requestsMigrationRequired={requestsBundle.migrationRequired}
        hasServiceRoleKey={isSupabaseAdminConfigured()}
      />
    </AppShell>
  );
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminContent
        searchParams={props.searchParams as Promise<{ semester?: string }>}
      />
    </Suspense>
  );
}
