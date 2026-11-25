import { Suspense, type ReactNode } from "react";
import { requireProfile } from "@/lib/auth";
import { getPendingProfileRequestsCount, getShellData } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/layout/setup-required-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/layout/page-skeleton";

async function AppShellLoader({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  const [profile, shell] = await Promise.all([
    requireProfile(),
    getShellData(),
  ]);

  const pendingProfileRequestsCount =
    profile.role === "admin" ? await getPendingProfileRequestsCount() : 0;

  return (
    <AppShell
      profile={profile}
      semesters={shell.semesters}
      visibilityGroups={shell.visibilityGroups}
      pendingProfileRequestsCount={pendingProfileRequestsCount}
    >
      {children}
    </AppShell>
  );
}

export default function AuthenticatedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AppShellLoader>{children}</AppShellLoader>
    </Suspense>
  );
}
