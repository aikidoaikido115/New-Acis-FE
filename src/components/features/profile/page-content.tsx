"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useToast } from "@/components/ui/toast";
import { AvatarUpload } from "./components/avatar-upload";
import { GenderRadio } from "./components/gender-radio";
import { ReadOnlyField } from "./components/read-only-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { InputField } from "./components/input-field";
import { getRoleAvatar, mapUserToForm, FormData, User } from "./utils";
import { resolveProfileImage } from "@/lib/profile-image";

export function ProfilePageContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstname: "",
    lastname: "",
    nickname: "",
    gender: "",
    username: "",
    email: "",
    position: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<FormData | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await authService.fetchUserProfile();
        console.log("User data:", u);
        setUser(u);
        if (u) {
          const mapped = mapUserToForm(u);
          setFormData(mapped);
          setInitialForm(mapped);
          const profileImage = resolveProfileImage(u.profile_image);
          if (profileImage) {
            setAvatarPreview(profileImage);
          }
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      const active = document.activeElement as HTMLElement | null;
      active?.blur();
    }
  }, [loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "radio" ? value : value }));
  };

  const handleAvatarChange = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarChanged(true);
    setIsUploadingAvatar(true);

    try {
      const updated = await authService.updateProfile({ profile_image: file });
      setUser(updated);
      const mapped = mapUserToForm(updated);
      setFormData(mapped);
      setInitialForm(mapped);
      const profileImage = resolveProfileImage(updated.profile_image);
      setAvatarPreview(profileImage || previewUrl);
      if (profileImage) {
        authService.updateCachedUser({ profile_image: profileImage });
      }
      setAvatarChanged(false);
      setFileInputKey((prev) => prev + 1);
      showToast({ message: "อัปเดตรูปโปรไฟล์แล้ว", type: "success", title: "สำเร็จ" });
    } catch (error) {
      setAvatarPreview(user?.profile_image ?? null);
      setAvatarChanged(false);
      showToast({ message: "อัปโหลดรูปไม่สำเร็จ", type: "error", title: "ผิดพลาด" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      const mapped = mapUserToForm(user);
      setFormData(mapped);
      setInitialForm(mapped);
      setAvatarPreview(resolveProfileImage(user.profile_image) ?? null);
      setAvatarChanged(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        username: formData.username || undefined,
        first_name: formData.firstname || undefined,
        last_name: formData.lastname || undefined,
        nickname: formData.nickname || undefined,
        gender: formData.gender || undefined,
      };

      const updated = await authService.updateProfile(payload);

      const mismatches: string[] = [];
      if (payload.username && updated.username !== payload.username) mismatches.push("username");
      if (payload.first_name && updated.first_name !== payload.first_name) mismatches.push("first_name");
      if (payload.last_name && updated.last_name !== payload.last_name) mismatches.push("last_name");
      if (payload.nickname && updated.nickname !== payload.nickname) mismatches.push("nickname");
      if (payload.gender && (updated.gender || "").toLowerCase() !== payload.gender.toLowerCase()) mismatches.push("gender");

      if (mismatches.length > 0) {
        showToast({ message: "บันทึกไม่สำเร็จ ข้อมูลยังไม่ถูกอัปเดต", type: "error", title: "ผิดพลาด" });
        return;
      }

      setUser(updated);
      const mapped = mapUserToForm(updated);
      setFormData(mapped);
      setInitialForm(mapped);
      showToast({ message: "ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว", type: "success", title: "บันทึกสำเร็จ" });
    } catch (error) {
      showToast({ message: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง", type: "error", title: "บันทึกไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  };


  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const roleRaw = user.role_name ?? (typeof user.role === "string" ? user.role : user.role?.name);
  const roleDisplay = roleRaw && roleRaw.toLowerCase().includes("kitchen") ? "เจ้าหน้าที่ครัว" : "เจ้าหน้าที่ดูแล";
  const rolePosition = roleRaw && roleRaw.toLowerCase().includes("kitchen") ? "โภชนา/ห้องครัว" : "แพทย์/พยาบาล";

  const avatarSrc = avatarPreview ?? getRoleAvatar(roleRaw);

  const isFormChanged = (() => {
    if (!initialForm) return false;
    for (const key of Object.keys(formData)) {
      if ((formData as any)[key] !== (initialForm as any)[key]) return true;
    }
    return avatarChanged;
  })();

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center pt-6 sm:pt-10 px-6 sm:px-20 lg:px-56">


      <div className="w-full max-w-5xl mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <AvatarUpload src={avatarSrc} onUpload={handleAvatarChange} inputKey={fileInputKey} />
          <div className="text-center sm:text-left">
            <h1 className="lg:mt-8 md:mt-8 lg:ml-4 md:ml-4 text-2xl sm:text-3xl font-bold text-gray-800">
                <span>{formData.firstname || "ไม่ระบุ"}</span>
                <span className="ml-6">{formData.lastname}</span>
                </h1>
            <div className="lg:mt-2 md:mt-2 lg:ml-4 md:ml-4 text-gray-500 text-base sm:text-lg">{roleDisplay}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 w-full max-w-6xl">
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">ข้อมูลส่วนตัว</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField
              label="ชื่อเล่น"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="ชื่อเล่น"
            />
            <GenderRadio value={formData.gender} onChange={handleChange} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">ข้อมูลบัญชี</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField
              label="ชื่อผู้ใช้"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            <ReadOnlyField label="อีเมล" value={formData.email} />
            <ReadOnlyField label="ตำแหน่ง" value={rolePosition} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">ความปลอดภัย</h2>
          <button
            type="button"
            className="border border-blue-500 text-blue-500 rounded-lg px-4 sm:px-6 py-2 hover:bg-blue-50 transition-colors"
            onClick={() => router.push("/change-password")}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={handleCancel}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-[#4A8B6A] text-white rounded-lg hover:bg-[#3d7357] transition-colors disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-500 disabled:hover:bg-gray-200"
            onClick={handleSave}
            disabled={saving || isUploadingAvatar || !isFormChanged}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
