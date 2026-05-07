import { Suspense } from "react";
import { AppLogo } from "@/components/shared/branding/staff-app-logo";
import { LoginForm } from "@/components/features/staff-auth/login-form";

export default function LoginPage() {
  return (
    <>
      <AppLogo />

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}