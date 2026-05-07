"use client";

import { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

interface StepOTPProps {
  email: string;
  onNext: (otp: string) => void;
  onBack: () => void;
}

export function StepOTP({ email, onNext, onBack }: StepOTPProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.split("").filter(char => /^\d$/.test(char));
    
    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);

    const lastIndex = Math.min(digits.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) return;
    
    setError("");
    setIsLoading(true);
    
    try {
      await authService.verifyOTP({ email, otp: otpCode });
      onNext(otpCode);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "รหัส OTP ไม่ถูกต้อง กรุณาลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    try {
      await authService.forgotPassword({ email });
      setError("");
      setCountdown(15);
      alert("ส่งรหัส OTP ใหม่แล้ว กรุณาตรวจสอบอีเมลของคุณ");
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "ไม่สามารถส่ง OTP ได้ กรุณาลองอีกครั้ง");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[440px] mx-auto">
      <h2 className="text-headline-5 font-bold mb-2 text-gray-800">ยืนยันรหัส OTP</h2>
      <p className="text-body-small text-gray-600 mb-6">
        กรุณากรอกรหัส 6 หลัก ที่ส่งไปยังอีเมล <strong>{email}</strong>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-small">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-headline-6 font-semibold border-2 text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A8B6A] focus:border-[#4A8B6A] transition-all"
              disabled={isLoading}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <Button 
            type="submit"
            disabled={isLoading || otp.some(d => !d)}
            className="w-full bg-[#4A8B6A] hover:bg-[#3d7357] text-white h-12 text-body-large font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? "กำลังยืนยัน..." : "ยืนยัน"}
          </Button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-body-small text-gray-600">
            ไม่ได้รับรหัส?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading || countdown > 0}
              className="text-[#4A90E2] hover:text-[#3a7bc8] hover:underline font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `ส่งอีกครั้ง (${formatTime(countdown)})` : "ส่งอีกครั้ง"}
            </button>
          </p>
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="text-body-small text-[#4A90E2] hover:text-[#3a7bc8] hover:underline transition-colors disabled:opacity-50"
          >
            กลับไปแก้ไขอีเมล
          </button>
        </div>
      </form>
    </div>
  );
}
