"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";
import type { RegisterRequest } from "@/types/auth";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    nickname: "",
    password: "",
    confirmPassword: "",
    gender: "",
    role_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("ขนาดไฟล์ต้องไม่เกิน 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        setError("รหัสผ่านไม่ตรงกัน");
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
        setIsLoading(false);
        return;
      }

      if (!formData.gender) {
        setError("กรุณาเลือกเพศ");
        setIsLoading(false);
        return;
      }

      const registerData: RegisterRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        nickname: formData.nickname || undefined,
        role_name: formData.role_name,
        gender: formData.gender,
        profile_image: profileImageFile || undefined,
      };

      await authService.register(registerData);
      setSuccess("ลงทะเบียนสำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "ลงทะเบียนไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-20 w-full max-w-[1000px] mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">สร้างบัญชีผู้ใช้ใหม่</h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm col-span-2">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm col-span-2">
            {success}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-16 gap-y-3.5">
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700">
                ชื่อผู้ใช้<span className="text-red-500">*</span>
              </label>
              <Input 
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="ชื่อผู้ใช้" 
                type="text"
                className="h-10 border-gray-300 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700">
                ชื่อจริง<span className="text-red-500">*</span>
              </label>
              <Input 
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="ชื่อจริง" 
                type="text"
                className="h-10 border-gray-300 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700">
                ชื่อเล่น
              </label>
              <Input 
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="ชื่อเล่น" 
                type="text"
                className="h-10 border-gray-300 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700 block mb-1.5">
                รูปโปรไฟล์
              </label>
              <label 
                htmlFor="profile-upload"
                className="inline-flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-[rgba(245,245,245,1)]"
              >
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <Camera className="w-7 h-7 text-gray-400 mb-0.5" />
                    <span className="text-[9px] text-gray-500">อัปโหลดรูปภาพ</span>
                  </>
                )}
              </label>
              <input 
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
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
                  className="h-10 border-gray-300 pr-10 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700">
                ตำแหน่ง<span className="text-red-500">*</span>
              </label>
              <select 
                name="role_name"
                value={formData.role_name}
                onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-md px-3 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] focus:outline-none focus:ring-2 focus:ring-[#4A8B6A] focus:border-transparent"
                required
                disabled={isLoading}
              >
                <option value="">เลือกตำแหน่ง</option>
                <option value="Medical Staff">แพทย์ / พยาบาล</option>
                <option value="Kitchen Staff">โภชนา / ห้องครัว</option>
              </select>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700">
                อีเมล<span className="text-red-500">*</span>
              </label>
              <Input 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="อีเมล" 
                type="email"
                className="h-10 border-gray-300 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700">
                นามสกุล<span className="text-red-500">*</span>
              </label>
              <Input 
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="นามสกุล" 
                type="text"
                className="h-10 border-gray-300 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700">
                เพศ<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6 pt-1">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="male" 
                    name="gender" 
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#4A8B6A] focus:ring-[#4A8B6A] cursor-pointer"
                    required
                    disabled={isLoading}
                  />
                  <label htmlFor="male" className="text-sm text-gray-700 cursor-pointer font-normal">
                    ชาย
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="female" 
                    name="gender" 
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#4A8B6A] focus:ring-[#4A8B6A] cursor-pointer"
                    disabled={isLoading}
                  />
                  <label htmlFor="female" className="text-sm text-gray-700 cursor-pointer font-normal">
                    หญิง
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="other" 
                    name="gender" 
                    value="other"
                    checked={formData.gender === "other"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#4A8B6A] focus:ring-[#4A8B6A] cursor-pointer"
                    disabled={isLoading}
                  />
                  <label htmlFor="other" className="text-sm text-gray-700 cursor-pointer font-normal">
                    อื่นๆ
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-20"></div>
              <div className="h-10"></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-normal text-gray-700">
                ยืนยันรหัสผ่าน<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="รหัสผ่าน" 
                  type={showConfirmPassword ? "text" : "password"}
                  className="h-10 border-gray-300 pr-10 bg-[rgba(245,245,245,1)] text-xs text-[rgba(103,103,103,1)] placeholder:text-[rgba(103,103,103,1)]"
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
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <Button 
            type="submit"
            className="bg-[#4A8B6A] hover:bg-[#3d7357] text-white text-base font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "กำลังลงทะเบียน..." : "ลงทะเบียนเข้าใช้"}
          </Button>
        </div>

        <div className="text-center pt-1">
          <div className="text-sm text-gray-600">
            มีบัญชีอยู่แล้ว?{" "}
            <Link 
              href="/login" 
              className="text-[#4A8B6A] font-medium underline hover:text-[#3d7357] transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
