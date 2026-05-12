"use client";

import { useState } from "react";
import { SUPPORT_CONTACT_CONFIG } from "@/constants/support-service";
import supportTicketService from "@/services/support-ticket.service";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type SupportFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type SupportFormField = keyof SupportFormData;

const EMPTY_FORM_DATA: SupportFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SupportButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  variant?: "clear" | "submit";
};

function SupportButton({
  children,
  type = "button",
  disabled,
  onClick,
  variant = "submit",
}: SupportButtonProps) {
  const baseClass =
    "h-11 px-8 rounded-[5px] text-body-small transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClass =
    variant === "clear"
      ? "h-10 px-6 bg-[rgba(103,103,103,0.15)] text-[#676767] hover:bg-[rgba(103,103,103,0.24)]"
      : "min-w-[240px] bg-emerald-600 text-white hover:bg-emerald-700";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClass} ${variantClass}`}
    >
      {children}
    </button>
  );
}

export default function SupportPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<SupportFormData>(EMPTY_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<SupportFormField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: SupportFormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const errors: Partial<Record<SupportFormField, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "กรุณากรอกชื่อผู้แจ้ง";
    }

    if (formData.email.trim() && !EMAIL_PATTERN.test(formData.email.trim())) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!formData.subject.trim()) {
      errors.subject = "กรุณากรอกหัวข้อเรื่อง";
    }

    if (!formData.message.trim()) {
      errors.message = "กรุณากรอกเนื้อหา";
    }

    return errors;
  };

  const resolveErrorMessage = (error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }

    return "ส่งรายงานไม่สำเร็จ กรุณาลองอีกครั้ง";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      await supportTicketService.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setFormData(EMPTY_FORM_DATA);
      showToast({
        type: "success",
        title: "ส่งรายงานเรียบร้อย",
        message: "ทีมงานจะติดต่อกลับโดยเร็วที่สุด",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "ส่งรายงานไม่สำเร็จ",
        message: resolveErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData(EMPTY_FORM_DATA);
    setValidationErrors({});
  };

  return (
    <div className="w-full max-w-full px-6 py-8">
      <div className="mb-6">
        <h1 className="text-headline-5 font-semibold text-gray-800">แจ้งปัญหาการใช้งาน</h1>
        <p className="text-[16px] font-light text-gray-600">กรอกข้อมูลด้านล่างเพื่อแจ้งปัญหาที่พบ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-body-small font-medium text-gray-700">
                  ชื่อผู้แจ้ง<span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="กรอกชื่อ - นามสกุล"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="mt-3 h-11 text-black border-gray-300 bg-[rgba(245,245,245,1)] placeholder:text-[#8C929D]"
                  required
                />
                {validationErrors.name && <p className="mt-2 text-caption text-red-600">{validationErrors.name}</p>}
              </div>

              <div>
                <label className="block text-body-small font-medium text-gray-700">
                  อีเมล <span className="text-gray-500">(ไม่บังคับ)</span>
                </label>
                <Input
                  placeholder="example@email.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="mt-3 h-11 text-black border-gray-300 bg-[rgba(245,245,245,1)] placeholder:text-[#8C929D]"
                />
                {validationErrors.email && <p className="mt-2 text-caption text-red-600">{validationErrors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-body-small font-medium text-gray-700">
                หัวข้อเรื่อง<span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="สรุปปัญหาที่พบ"
                type="text"
                value={formData.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                className="mt-3 h-11 text-black border-gray-300 bg-[rgba(245,245,245,1)] placeholder:text-[#8C929D]"
                required
              />
              {validationErrors.subject && <p className="mt-2 text-caption text-red-600">{validationErrors.subject}</p>}
            </div>

            <div>
              <label className="block text-body-small font-medium text-gray-700">
                เนื้อหา<span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="อธิบายรายละเอียดของปัญหาที่พบ..."
                value={formData.message}
                onChange={(e) => updateField("message", e.target.value)}
                className="mt-3 min-h-[150px] text-black border-gray-300 bg-[rgba(245,245,245,1)] placeholder:text-[#8C929D] resize-none"
                rows={6}
                required
              />
              {validationErrors.message && <p className="mt-2 text-caption text-red-600">{validationErrors.message}</p>}
              <p className="mt-3 text-caption text-gray-500">กรุณาอธิบายปัญหาอย่างละเอียด เพื่อให้ทีมงานสามารถช่วยเหลือได้อย่างรวดเร็ว</p>
            </div>

            <div className="border-t border-[rgba(103,103,103,0.54)] pt-6"></div>

            <div className="flex justify-between items-center">
              <SupportButton
                type="button"
                onClick={handleClear}
                variant="clear"
              >
                ล้างข้อมูล
              </SupportButton>
              <SupportButton
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังส่ง..." : "ส่งรายงาน"}
              </SupportButton>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-headline-7 font-semibold text-blue-800 mb-2">เวลาตอบกลับ</h3>
            <p className="text-body-small text-blue-700 leading-relaxed">{SUPPORT_CONTACT_CONFIG.responseTimeText}</p>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-headline-7 font-semibold text-green-800 mb-2">ติดต่อด่วน</h3>
            <p className="text-body-small text-green-700 leading-relaxed">โทร: {SUPPORT_CONTACT_CONFIG.urgentPhone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
