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
import { SetupRequiredCard } from "@/components/layout/setup-required-card";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { ContentSkeleton } from "@/components/layout/page-skeleton";
import { isAdminTab } from "@/lib/types";

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string; tab?: string }>;
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
  const initialTab = isAdminTab(params.tab) ? params.tab : undefined;

  return (
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
      initialTab={initialTab}
    />
  );
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <AdminContent
        searchParams={
          props.searchParams as Promise<{ semester?: string; tab?: string }>
        }
      />
    </Suspense>
  );
}
