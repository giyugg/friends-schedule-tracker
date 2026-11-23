import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequiredCard />;
  }

  return <LoginForm />;
}
