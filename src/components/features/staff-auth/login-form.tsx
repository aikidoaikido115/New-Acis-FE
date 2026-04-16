"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/auth.service";
import { getAuthErrorMessage } from "@/lib/error-messages";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title?: string; message: string } | null>(null);

  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const isEmail = formData.usernameOrEmail.includes("@");

      const credentials = {
        ...(isEmail
          ? { email: formData.usernameOrEmail }
          : { username: formData.usernameOrEmail }),
        password: formData.password,
        remember: rememberMe };

      const userData = await authService.login(credentials);
      
      // Redirect based on role (now using mapped role)
      const normalizedRole = userData.role_name?.toLowerCase();
      
      switch (normalizedRole) {
        case "nurse":
          router.push("/dashboard");
          break;
        case "kitchen":
          router.push("/manage-meal");
          break;
        case "relative":
          router.push("/relative/dashboard");
          break;
        default:
          router.push("/dashboard");
          break;
      }
    } catch (err) {
      const friendlyError = getAuthErrorMessage(err);
      setError(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[440px] mx-auto">
      <h2 className="text-headline-5 font-bold mb-8 text-gray-800">เข้าสู่ระบบ</h2>

      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                {error.title && (
                  <p className="font-semibold text-body-small mb-1">{error.title}</p>
                )}
                <p className="text-body-small">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-body-small font-normal text-gray-700">
            ชื่อผู้ใช้หรืออีเมล<span className="text-red-500">*</span>
          </label>
          <Input
            name="usernameOrEmail"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            placeholder="ชื่อผู้ใช้หรืออีเมล"
            type="text"
            className="h-11 border-gray-300 bg-[rgba(245,245,245,1)] text-overline text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-body-small font-normal text-gray-700">
            รหัสผ่าน<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="รหัสผ่าน"
              type={showPassword ? "text" : "password"}
              className="h-11 border-gray-300 pr-10 bg-[rgba(245,245,245,1)] text-overline text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isLoading}
          />
          <label
            htmlFor="remember"
            className="text-overline text-[rgba(103,103,103,1)] cursor-pointer select-none"
          >
            จดจำฉันไว้
          </label>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            className="w-full bg-[#4A8B6A] hover:bg-[#3d7357] text-white h-12 text-body-large font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2 pt-0">
          <div className="w-full text-right">
            <Link
              href="/forgot-password"
              className="text-body-small text-[#4A90E2] hover:text-[#3a7bc8] hover:underline transition-colors"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <div className="text-body-small text-gray-600">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="text-[#4A8B6A] font-medium underline hover:text-[#3d7357] transition-colors"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}