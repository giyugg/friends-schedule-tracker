import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/layout/setup-required-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  return <LoginForm />;
}
