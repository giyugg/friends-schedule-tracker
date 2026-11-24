import { Suspense, type ReactNode } from "react";
import { requireProfile } from "@/lib/auth";
import { getShellData } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { AppShell } from "@/components/app-shell";
import { PageSkeleton } from "@/components/page-skeleton";

async function AppShellLoader({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  const [profile, shell] = await Promise.all([
    requireProfile(),
    getShellData(),
  ]);

  return (
    <AppShell
      profile={profile}
      semesters={shell.semesters}
      visibilityGroups={shell.visibilityGroups}
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
