"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/auth.service";

export function LoginFormRelative() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

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
      // TODO: รอ Backend ทำ API สำหรับ relative
      // ตอนนี้ bypass ด้วย mock data
      
      // สร้าง mock user data
      const mockUser = {
        user_id: `relative_${formData.phoneNumber}`,
        username: formData.phoneNumber,
        email: `${formData.phoneNumber}@relative.local`,
        token: 'mock_token_relative',
        profile_image: '',
        role_name: 'relative',
        first_name: 'ญาติ',
        last_name: 'ทดสอบ',
      };

      // เก็บข้อมูล mock ลง localStorage
      localStorage.setItem('access_token', mockUser.token);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // เซ็ต cookies สำหรับ middleware
      document.cookie = `auth_token=${mockUser.token}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `user_role=relative; path=/; max-age=2592000; SameSite=Lax`;
      
      // ตรวจสอบว่าเคยยอมรับ consent หรือยัง (ตาม user_id)
      const consentAccepted = localStorage.getItem(`consent_accepted_${mockUser.user_id}`);
      if (consentAccepted) {
        router.push("/relative/dashboard");
      } else {
        router.push("/relative/consent");
      }
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[440px] mx-auto">
      <h2 className="text-2xl font-bold mb-8 text-gray-800">เข้าสู่ระบบสำหรับญาติ</h2>

      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-sm font-normal text-gray-700">
            เบอร์โทรศัพท์<span className="text-red-500">*</span>
          </label>
          <Input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="เบอร์โทรศัพท์"
            type="text"
            className="h-11 border-gray-300 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
            required
            disabled={isLoading}
          />
        </div>

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
            disabled={isLoading}
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
