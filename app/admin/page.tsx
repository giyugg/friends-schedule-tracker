import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getScheduleBundle } from "@/lib/data";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppNav } from "@/components/app-nav";
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

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav
        profile={adminProfile}
        semesters={bundle.semesters}
        activeSemesterId={bundle.activeSemester?.id ?? null}
      />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5">
        <AdminDashboard
          currentAdminId={adminProfile.id}
          semesters={bundle.semesters}
          activeSemester={bundle.activeSemester}
          sections={bundle.sections}
          entries={bundle.entries}
          profiles={bundle.profiles}
          hasServiceRoleKey={isSupabaseAdminConfigured()}
        />
      </main>
    </div>
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
