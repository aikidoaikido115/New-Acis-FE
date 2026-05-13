"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/auth.service";
import { getAuthErrorMessage } from "@/lib/error-messages";

function getRelativeLoginErrorMessage(error: unknown): string {
  const normalized = (error as { message?: string } | null)?.message?.toLowerCase() || "";

  if (normalized.includes("invalid resident birthday password")) {
    return "รหัสผ่าน (วันเกิด DDMMYYYY) ไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง";
  }
  if (normalized.includes("ddmmyyyy") || normalized.includes("birthday")) {
    return "รหัสผ่านต้องเป็นวันเดือนปีเกิดในรูปแบบ DDMMYYYY";
  }
  if (normalized.includes("magic link") || normalized.includes("resident_id") || normalized.includes("relative account")) {
    return "ลิงก์เข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่";
  }

  return getAuthErrorMessage(error).message;
}

export function LoginFormRelative() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    password: "",
  });

  const residentIdFromQuery = searchParams.get("resident_id")?.trim() || "";
  const tokenFromQuery = searchParams.get("token")?.trim() || "";
  const storedResidentId = typeof window !== "undefined"
    ? localStorage.getItem("relative_portal_resident_id")?.trim() || ""
    : "";
  const storedToken = typeof window !== "undefined"
    ? localStorage.getItem("relative_portal_token")?.trim() || ""
    : "";

  const effectiveResidentId = residentIdFromQuery || storedResidentId;
  const effectiveToken = tokenFromQuery || storedToken;
  const hasPortalParams = !!(effectiveResidentId || effectiveToken);

  useEffect(() => {
    if (!hasPortalParams) {
      setError("ไม่พบข้อมูลลิงก์สำหรับเข้าสู่ระบบ กรุณากดลิงก์จากระบบเจ้าหน้าที่อีกครั้ง");
    }
  }, [hasPortalParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!hasPortalParams) {
        throw new Error("resident_id is required");
      }

      const user = await authService.relativePortalLogin({
        resident_id: effectiveResidentId || undefined,
        token: effectiveToken || undefined,
        password: formData.password.trim(),
        remember: rememberMe,
      });

      if (effectiveResidentId) {
        localStorage.setItem('relative_portal_resident_id', effectiveResidentId);
      }
      if (effectiveToken) {
        localStorage.setItem('relative_portal_token', effectiveToken);
      }

      const consentAccepted = localStorage.getItem(`consent_accepted_${user.user_id}`);
      if (consentAccepted) {
        router.push("/relative/dashboard");
      } else {
        router.push("/relative/consent");
      }
    } catch (err) {
      setError(getRelativeLoginErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-[440px] mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">เข้าสู่ระบบสำหรับญาติ</h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-sm font-normal text-gray-700">
            รหัสผ่าน<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="รหัสผ่าน"
              type={showPassword ? "text" : "password"}
              className="h-11 border-gray-300 pr-10 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
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
            className="text-xs text-[rgba(103,103,103,1)] cursor-pointer select-none"
          >
            จดจำฉันไว้
          </label>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            className="w-full bg-[#4A8B6A] hover:bg-[#3d7357] text-white h-12 text-base font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isMounted || isLoading || !hasPortalParams} 
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </div>
      </form>
    </div>
  );
}