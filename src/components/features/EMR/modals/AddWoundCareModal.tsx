"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { DatePicker } from "@/components/ui/date-picker";
import { ResidentSearchCombobox } from "./ResidentSearchCombobox";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

interface AddWoundCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WoundCareFormData) => void | Promise<void>;
  residents?: Resident[];
  rooms?: Room[];
  showResidentPicker?: boolean;
}

export interface WoundCareFormData {
  residentId?: string;
  date: string;
  time: string;
  location: string;
  woundType: string;
  size: string;
  treatment: string;
  supplies: string;
  status: string;
  image?: File;
  note: string;
}

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
    return null;
  }

  const thaiMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!thaiMatch) {
    return null;
  }

  const day = Number(thaiMatch[1]);
  const month = Number(thaiMatch[2]);
  const rawYear = Number(thaiMatch[3]);
  const year = rawYear > 2400 ? rawYear - 543 : rawYear;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return date;
  }

  return null;
};

const baseInputClassName =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const fullWidthDatePickerClassName = "w-full [&>button]:w-full [&>button]:justify-between";

export function AddWoundCareModal({
  isOpen,
  onClose,
  onSubmit,
  residents = [],
  rooms = [],
  showResidentPicker = false,
}: AddWoundCareModalProps) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<WoundCareFormData>({
    residentId: "",
    date: formatIsoDate(new Date()),
    time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    location: "",
    woundType: "",
    size: "",
    treatment: "",
    supplies: "",
    status: "",
    note: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const hasUnsavedChanges = useMemo(
    () => !!(
      formData.location ||
      formData.woundType ||
      formData.size ||
      formData.treatment ||
      formData.supplies ||
      formData.note ||
      imagePreview
    ),
    [formData, imagePreview]
  );

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  const handleClose = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirmClose = await confirm({
        title: "ยืนยันการปิดหน้าต่าง",
        message: "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างนี้หรือไม่?",
        confirmText: "ปิดหน้าต่าง",
        cancelText: "กลับไปแก้ไข",
      });
      if (!confirmClose) return;
    }

    onClose();
    setFormData({
      residentId: "",
      date: formatIsoDate(new Date()),
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      location: "",
      woundType: "",
      size: "",
      treatment: "",
      supplies: "",
      status: "",
      note: "",
    });
    setImagePreview(null);
  }, [hasUnsavedChanges, onClose, confirm]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        void handleClose();
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showResidentPicker && !formData.residentId) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "กรุณาเลือกผู้ป่วยก่อนบันทึก" });
      return;
    }

    await onSubmit(formData);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      void handleClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-all duration-200"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800">บันทึกการทำแผล</h2>
          <button
            onClick={() => void handleClose()}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {showResidentPicker ? (
            <ResidentSearchCombobox
              residents={residents}
              rooms={rooms}
              value={formData.residentId || ""}
              onChange={(residentId) => setFormData({ ...formData, residentId })}
              onClear={() => setFormData({ ...formData, residentId: "" })}
              autoFocus={isOpen}
            />
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
              <DatePicker
                value={parseDateValue(formData.date)}
                onChange={(date) => setFormData({ ...formData, date: date ? formatIsoDate(date) : "" })}
                placeholder="DD/MM/YYYY"
                className={fullWidthDatePickerClassName}
              />
            </div>
            <div>
              <label htmlFor="wound-time" className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
              <input
                ref={showResidentPicker ? null : firstInputRef}
                id="wound-time"
                type="text"
                placeholder="00:00"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={baseInputClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="wound-location" className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งแผล</label>
            <input
              id="wound-location"
              type="text"
              placeholder="เช่น สะโพกขวา, แขนซ้าย"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={baseInputClassName}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wound-type" className="block text-sm font-medium text-gray-700 mb-1">ประเภทแผล</label>
              <input
                id="wound-type"
                type="text"
                placeholder="เช่น แผลกดทับ"
                value={formData.woundType}
                onChange={(e) => setFormData({ ...formData, woundType: e.target.value })}
                className={baseInputClassName}
              />
            </div>
            <div>
              <label htmlFor="wound-size" className="block text-sm font-medium text-gray-700 mb-1">ขนาดแผล</label>
              <input
                id="wound-size"
                type="text"
                placeholder="เช่น 5x3 cm"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className={baseInputClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="wound-treatment" className="block text-sm font-medium text-gray-700 mb-1">ขั้นตอนการดูแล</label>
            <textarea
              id="wound-treatment"
              placeholder="อธิบายขั้นตอนการทำแผล..."
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              rows={3}
              className={`${baseInputClassName} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="wound-supplies" className="block text-sm font-medium text-gray-700 mb-1">วัสดุที่ใช้</label>
            <input
              id="wound-supplies"
              type="text"
              placeholder="เช่น Gauze, Tegaderm"
              value={formData.supplies}
              onChange={(e) => setFormData({ ...formData, supplies: e.target.value })}
              className={baseInputClassName}
            />
          </div>

          <div>
            <label htmlFor="wound-status" className="block text-sm font-medium text-gray-700 mb-1">สภาพแผล</label>
            <select
              id="wound-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white ${
                formData.status ? "text-black" : "text-slate-400"
              }`}
            >
              <option value="" disabled>เลือกสภาพแผล</option>
              <option value="คงที่">คงที่</option>
              <option value="ดีขึ้น">ดีขึ้น</option>
              <option value="แย่ลง">แย่ลง</option>
            </select>
          </div>

          <div>
            <label htmlFor="wound-image-upload" className="block text-sm font-medium text-gray-700 mb-1">รูปภาพแผล</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="wound-image-upload"
                aria-label="อัปโหลดรูปภาพแผล"
              />
              <label htmlFor="wound-image-upload" className="cursor-pointer">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    unoptimized
                    className="max-h-32 w-auto mx-auto rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">ถ่ายรูป / เลือกรูป</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="wound-note" className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea
              id="wound-note"
              placeholder="บันทึกเพิ่มเติม..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              className={`${baseInputClassName} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={() => void handleClose()}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
      </div>
      {confirmDialog}
    </>
  );
}


