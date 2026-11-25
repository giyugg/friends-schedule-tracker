import { Suspense } from "react";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/layout/setup-required-card";
import { HomeIntro } from "@/components/layout/home-intro";

async function HomeContent() {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  const profile = await getCurrentProfile();

  return (
    <HomeIntro
      isSignedIn={Boolean(profile)}
      displayName={profile?.display_name}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeIntro isSignedIn={false} />}>
      <HomeContent />
    </Suspense>
  );
}
