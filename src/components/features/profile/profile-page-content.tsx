"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface User {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  phone?: string;
  gender?: string;
  username?: string;
  email?: string;
  role?: string | { id?: string; name?: string };
  role_name?: string;
  profile_image?: string;
}

interface FormData {
  firstname: string;
  lastname: string;
  nickname: string;
  phone: string;
  gender: string;
  username: string;
  email: string;
  position: string;
}

const ROLE_AVATAR_MAP: Record<string, string> = {
  nurse: "/images/nurse.png",
  kitchen: "/images/kitchen.png",
};

function getRoleAvatar(role?: string): string {
  if (!role) return ROLE_AVATAR_MAP.nurse;
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes("kitchen") || lowerRole.includes("โภชนา") || lowerRole.includes("ครัว")) {
    return ROLE_AVATAR_MAP.kitchen;
  }
  return ROLE_AVATAR_MAP.nurse;
}

const mapUserToForm = (user: User): FormData => ({
  firstname: user.first_name ?? "",
  lastname: user.last_name ?? "",
  nickname: user.nickname ?? "",
  phone: user.phone ?? "",
  gender: (user.gender ?? "").toLowerCase(),
  username: user.username ?? "",
  email: user.email ?? "",
  position: user.role_name ?? (typeof user.role === "string" ? user.role : user.role?.name) ?? "",
});

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
    <div className="text-lg text-gray-500">กำลังโหลดข้อมูล...</div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
    <div className="text-lg text-red-500">ไม่พบข้อมูลผู้ใช้</div>
  </div>
);

const AvatarUpload = ({ src, onUpload, inputKey }: { src: string | null; onUpload: (file: File) => void; inputKey: number }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="relative">
      <div className="w-40 h-40 sm:w-34 sm:h-34 rounded-full bg-white border border-blue-300 flex items-center justify-center overflow-hidden">
        {src ? (
          <img src={src} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <svg width="130" height="130" viewBox="0 0 80 80" fill="none" className="w-full h-full">
            <circle cx="40" cy="40" r="40" fill="#9CA3AF" />
            <circle cx="40" cy="40" r="12" fill="#E5E7EB" />
            <path d="M40 50C28 50 18 58 18 68H62C62 58 52 50 40 50Z" fill="#E5E7EB" />
          </svg>
        )}
      </div>
      <input
        key={inputKey}
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="absolute bottom-0 right-0 bg-gray-600 rounded-full p-1.5 sm:p-2 shadow-md hover:bg-gray-700"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, placeholder, type = "text" }: any) => {
  const inputProps: any = { type, name, placeholder, value, onChange, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-gray-900" };
  if (name === "phone") {
    inputProps.inputMode = "numeric";
    inputProps.pattern = "[0-9]*";
    inputProps.maxLength = 10;
  }
  return (
    <div>
      <label className="block text-gray-600 mb-1">{label}</label>
      <Input {...inputProps} />
    </div>
  );
};

const GenderRadio = ({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="mt-4">
    <label className="block text-gray-600 mb-2">เพศ</label>
    <div className="flex flex-wrap gap-6 text-gray-900">
      {["male", "female", "other"].map(gender => (
        <label key={gender} className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            value={gender}
            checked={value === gender}
            onChange={onChange}
          />
          {gender === "male" ? "ชาย" : gender === "female" ? "หญิง" : "อื่นๆ"}
        </label>
      ))}
    </div>
  </div>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="block text-gray-600 mb-1">{label}</label>
    <div className="relative">
      <div className="w-full rounded-lg px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 pr-10">
        {value}
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
    </div>
  </div>
);

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
    phone: "",
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

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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
          if (typeof window !== "undefined") {
            const hasCustom = localStorage.getItem("profile_image_set") === "true";
            if (hasCustom && u.profile_image) {
              setAvatarPreview(u.profile_image);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch user:", e);
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
    if (name === "phone") {
      const onlyNums = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: onlyNums }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === "radio" ? value : value }));
  };

  const handleAvatarChange = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setCropImageUrl(previewUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropOpen(true);
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const closeCrop = () => {
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    setCropImageUrl(null);
    setIsCropOpen(false);
    setFileInputKey(prev => prev + 1);
  };

  const handleCropConfirm = async () => {
    if (!cropImageUrl || !croppedAreaPixels) {
      closeCrop();
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const croppedBlob = await getCroppedImg(cropImageUrl, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(croppedBlob);
      setAvatarPreview(previewUrl);
      setAvatarChanged(true);

      const file = new File([croppedBlob], "profile.jpg", { type: croppedBlob.type || "image/jpeg" });
      const updated = await authService.updateProfile({ profile_image: file });

      if (!updated.profile_image) {
        throw new Error("profile_image not updated");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("profile_image_set", "true");
      }
      setAvatarPreview(updated.profile_image);
      setAvatarChanged(false);
      showToast({ message: "อัปเดตรูปโปรไฟล์แล้ว", type: "success", title: "สำเร็จ" });
      closeCrop();
    } catch (error) {
      console.error("Crop failed", error);
      showToast({ message: "อัปเดตรูปโปรไฟล์ไม่สำเร็จ", type: "error", title: "ผิดพลาด" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      const mapped = mapUserToForm(user);
      setFormData(mapped);
      setInitialForm(mapped);
      const hasCustom = typeof window !== "undefined" && localStorage.getItem("profile_image_set") === "true";
      setAvatarPreview(hasCustom ? user.profile_image ?? null : null);
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
      console.error("Update failed:", error);
      showToast({ message: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง", type: "error", title: "บันทึกไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return <NotFound />;

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
      {isCropOpen && cropImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ครอบรูปโปรไฟล์</h3>
            <div className="relative h-64 w-full bg-gray-100 rounded-lg overflow-hidden">
              <Cropper
                image={cropImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-600">ซูม</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                onClick={closeCrop}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#4A8B6A] px-4 py-2 text-white hover:bg-[#3d7357]"
                onClick={handleCropConfirm}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? "กำลังบันทึก..." : "ใช้รูปนี้"}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">ข้อมูลส่วนตัว</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="ชื่อเล่น"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="ชื่อเล่น"
            />
            <InputField
              label="เบอร์โทรศัพท์"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="XXX-XXX-XXXX"
              type="tel"
            />
          </div>
          <GenderRadio value={formData.gender} onChange={handleChange} />
        </div>

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">ข้อมูลบัญชี</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
            disabled={saving || !isFormChanged}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
