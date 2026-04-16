"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AppLogo } from "@/components/shared/branding/staff-app-logo";
import { authService } from "@/services/auth.service";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleName = authService.getCurrentUser()?.role_name || "nurse";

  // เส้นทางย้อนกลับตาม role
  const getBackPath = () => {
    if (roleName.toLowerCase().includes("relative")) return "/relative/dashboard";
    return "/profile";
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(getBackPath());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!oldPassword) {
      setError("กรุณากรอกรหัสผ่านเดิม");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      showToast({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", type: "success", title: "สำเร็จ" });
      router.push(getBackPath());
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0fabff] to-[#7fcbf7] p-4">
      <AppLogo />
      <button
        className="absolute top-6 left-6 text-2xl"
        onClick={handleBack}
        aria-label="back"
      >
        ←
      </button>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[440px] mx-auto">
        <h2 className="text-headline-5 font-bold mb-2 text-gray-800">ตั้งรหัสผ่านใหม่</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-small">
              {error}
            </div>
          )}

          <div className="space-y-2.5">
            <label className="text-body-small font-normal text-gray-700">
              รหัสผ่านเดิม<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder="รหัสผ่านเดิม"
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="h-11 border-gray-300 pr-10 bg-[rgba(245,245,245,1)] text-overline text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showOldPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-body-small font-normal text-gray-700">
              รหัสผ่านใหม่<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder="รหัสผ่านใหม่"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 border-gray-300 pr-10 bg-[rgba(245,245,245,1)] text-overline text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
                disabled={loading}
              />
            <p className="text-overline text-gray-500">
              รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
            </p>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A8B6A] hover:bg-[#3d7357] text-white h-12 text-body-large font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
