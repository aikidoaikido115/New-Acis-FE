"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

interface StepResetProps {
  email: string;
  otp: string;
  onComplete: () => void;
}

export function StepReset({ email, onComplete }: StepResetProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setIsLoading(true);
    
    try {
      await authService.changePassword({ 
        email, 
        new_password: password 
      });
      
      onComplete();
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[440px] mx-auto">
      <h2 className="text-headline-5 font-bold mb-2 text-gray-800">ตั้งรหัสผ่านใหม่</h2>
      <p className="text-body-small text-gray-600 mb-6">
        กรุณากรอกรหัสผ่านใหม่ของคุณ
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-small">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-body-small font-normal text-gray-700">
            รหัสผ่านใหม่<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input 
              placeholder="รหัสผ่านใหม่" 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <p className="text-overline text-gray-500">
            รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
          </p>
        </div>

        <div className="space-y-2.5">
          <label className="text-body-small font-normal text-gray-700">
            ยืนยันรหัสผ่านใหม่<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input 
              placeholder="ยืนยันรหัสผ่านใหม่" 
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 border-gray-300 pr-10 bg-[rgba(245,245,245,1)] text-overline text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#4A8B6A] hover:bg-[#3d7357] text-white h-12 text-body-large font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
          </Button>
        </div>
      </form>
    </div>
  );
}
