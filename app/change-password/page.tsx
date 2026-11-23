import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { ChangePasswordForm } from "@/components/change-password-form";

async function ChangePasswordContent() {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  return (
    <ChangePasswordForm
      displayName={profile.display_name}
      forced={profile.must_change_password}
    />
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}
