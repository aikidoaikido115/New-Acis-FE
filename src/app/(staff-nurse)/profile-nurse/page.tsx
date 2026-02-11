"use client";

import { useState, useEffect } from "react";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";
import { Camera, Loader2, AlertCircle, CheckCircle, Lock } from "lucide-react";

// Constants
const INPUT_CLASS = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-2 focus:border-black outline-none text-gray-900 placeholder:text-gray-900";
const READONLY_INPUT_CLASS = "w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed";
const LABEL_CLASS = "block text-sm font-medium text-gray-900 mb-2";
const GENDER_OPTIONS = ["ชาย", "หญิง", "อื่นๆ"];
const MOCK_USER_DATA: UserProfile = {
  user_id: "1",
  username: "SomriNurse69",
  email: "somri1234@gmail.com",
  first_name: "สมรี",
  last_name: "สุวรรณ",
  nickname: "สมรี",
  gender: "อื่นๆ",
  phone: "080-123-4567",
  role: "แพทย์/พยาบาล",
  profile_image: "https://www.isranews.org/article/images/2025/Harry/6/Hun_Sen_July_2019.jpg",
};
const NAVBAR_USER = {
  name: "สมหญิง",
  role: "เจ้าหน้าที่ดูแล",
  avatar: "/logo.png",
};

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nickname: string;
  gender: string;
  profile_image: string;
  phone?: string;
  role?: string;
}

interface FormData {
  username: string;
  first_name: string;
  last_name: string;
  nickname: string;
  gender: string;
  phone: string;
  profile_image: File | null;
}

// Reusable Components
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

function InputField({ label, name, type = "text", value, onChange, placeholder, disabled }: InputFieldProps) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={INPUT_CLASS}
        disabled={disabled}
      />
    </div>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          className={READONLY_INPUT_CLASS}
          disabled
        />
        <Lock className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}

interface GenderOption {
  label: string;
  value: string;
}

interface GenderRadioProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function GenderRadio({ value, onChange, disabled }: GenderRadioProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">เพศ</label>
      <div className="flex gap-8">
        {GENDER_OPTIONS.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4"
              disabled={disabled}
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface AlertProps {
  type: "error" | "success";
  message: string;
}

function Alert({ type, message }: AlertProps) {
  const isError = type === "error";
  const bgColor = isError ? "bg-red-50" : "bg-green-50";
  const borderColor = isError ? "border-red-200" : "border-green-200";
  const textColor = isError ? "text-red-700" : "text-green-700";
  const iconColor = isError ? "text-red-600" : "text-green-600";
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div className={`mb-6 p-4 ${bgColor} border ${borderColor} rounded-lg flex items-start gap-3`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <p className={textColor}>{message}</p>
    </div>
  );
}

export default function ProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    first_name: "",
    last_name: "",
    nickname: "",
    gender: "อื่นๆ",
    phone: "",
    profile_image: null,
  });

  const isFormModified = userProfile && (
    formData.username !== userProfile.username ||
    formData.nickname !== userProfile.nickname ||
    formData.gender !== userProfile.gender ||
    formData.phone !== (userProfile.phone || "") ||
    formData.profile_image !== null
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        setUserProfile(MOCK_USER_DATA);
        setFormData({
          username: MOCK_USER_DATA.username,
          first_name: MOCK_USER_DATA.first_name,
          last_name: MOCK_USER_DATA.last_name,
          nickname: MOCK_USER_DATA.nickname,
          gender: MOCK_USER_DATA.gender,
          phone: MOCK_USER_DATA.phone || "",
          profile_image: null,
        });
        setProfileImagePreview(MOCK_USER_DATA.profile_image);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, profile_image: file }));
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Form data to submit:", formData);
      setSuccess("บันทึกการเปลี่ยนแปลงสำเร็จ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppNavbar
        user={NAVBAR_USER}
        notificationsCount={2}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      <div className="flex flex-1 pt-16">
        <AppSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-72 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {error && <Alert type="error" message={error} />}
            {success && <Alert type="success" message={success} />}

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
                  {/* Profile Header */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                    <div className="relative flex-shrink-0">
                      <img
                        src={profileImagePreview || "/logo.png"}
                        alt="Profile"
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover bg-gray-200 border-4 border-white shadow-md"
                      />
                      <label className="absolute bottom-0 right-0 bg-gray-400 hover:bg-gray-500 text-white p-2 rounded-full cursor-pointer transition-colors border-2 border-white">
                        <Camera className="w-5 h-5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>
                    <div className="text-center sm:text-left sm:flex-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        สมหญิง หญิงหญิงหญิง
                      </h1>
                      <p className="text-gray-600 text-sm mt-1">เจ้าหน้าที่ดูแล</p>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">ข้อมูลส่วนตัว</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                          label="ชื่อเล่น"
                          name="nickname"
                          value={formData.nickname}
                          onChange={handleInputChange}
                          placeholder="ชื่อเล่น"
                          disabled={isSubmitting}
                        />
                        <InputField
                          label="เบอร์โทรศัพท์"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="XXX-XXX-XXXX"
                          disabled={isSubmitting}
                        />
                      </div>
                      <GenderRadio
                        value={formData.gender}
                        onChange={handleGenderChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">ข้อมูลบัญชี</h2>
                    <div className="space-y-6">
                      <InputField
                        label="ชื่อผู้ใช้"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="ชื่อผู้ใช้"
                        disabled={isSubmitting}
                      />
                      {userProfile && (
                        <>
                          <ReadOnlyField label="อีเมล" value={userProfile.email} />
                          <ReadOnlyField label="ตำแหน่ง" value={userProfile.role || ""} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Security */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">ความปลอดภัย</h2>
                    <button
                      type="button"
                      className="px-6 py-2 border border-sky-600 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      disabled={isSubmitting}
                    >
                      เปลี่ยนรหัสผ่าน
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      disabled={isSubmitting}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium ${
                        isFormModified
                          ? "bg-[#4A8B6A] hover:bg-[#3d7357]"
                          : "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                      }`}
                      disabled={isSubmitting || !isFormModified}
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>

      <div className="lg:ml-72 mt-auto">
        <AppFooter />
      </div>
    </div>
  );
}
