import { AppLogoRelative } from "@/components/shared/branding/relative-app-logo";
import { LoginFormRelative } from "@/components/features/relative/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] flex flex-col gap-6">
        <AppLogoRelative />
        <LoginFormRelative />
      </div>
    </div>
  );
}