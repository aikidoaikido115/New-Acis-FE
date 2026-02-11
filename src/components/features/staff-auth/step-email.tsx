"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

interface StepEmailProps {
  onNext: (email: string) => void;
}

export function StepEmail({ onNext }: StepEmailProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      await authService.forgotPassword({ email });
      onNext(email);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "ไม่สามารถส่ง OTP ได้ กรุณาลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[440px] mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">ลืมรหัสผ่าน</h2>
      <p className="text-sm text-gray-600 mb-6">
        กรุณากรอกอีเมลที่ใช้ในการลงทะเบียน
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-sm font-normal text-gray-700">
            อีเมล<span className="text-red-500">*</span>
          </label>
          <Input 
            placeholder="อีเมล" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-gray-300 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-center pt-2">
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#4A8B6A] hover:bg-[#3d7357] text-white h-12 text-base font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? "กำลังส่ง..." : "ส่งรหัส OTP"}
          </Button>
        </div>

        <div className="text-center pt-2">
          <a 
            href="/login" 
            className="text-sm text-[#4A90E2] hover:text-[#3a7bc8] hover:underline transition-colors"
          >
            กลับสู่หน้าเข้าสู่ระบบ
          </a>
        </div>
      </form>
    </div>
  );
}
