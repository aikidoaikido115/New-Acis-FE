"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { DatePicker } from "@/components/ui/date-picker";
import { ResidentSearchCombobox } from "./ResidentSearchCombobox";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

interface AddRelativeNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RelativeNoteFormData) => void | Promise<void>;
  residents?: Resident[];
  rooms?: Room[];
  showResidentPicker?: boolean;
  mode?: "create" | "edit";
  initialData?: Partial<RelativeNoteFormData>;
}

export interface RelativeNoteFormData {
  residentId?: string;
  date: string;
  time: string;
  content: string;
  sendNote: boolean;
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

const getDefaultTime = (): string => new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

const buildFormData = (initialData?: Partial<RelativeNoteFormData>): RelativeNoteFormData => ({
  residentId: initialData?.residentId || "",
  date: initialData?.date || formatIsoDate(new Date()),
  time: initialData?.time || getDefaultTime(),
  content: initialData?.content || "",
  sendNote: initialData?.sendNote ?? true,
});

export function AddRelativeNoteModal({
  isOpen,
  onClose,
  onSubmit,
  residents = [],
  rooms = [],
  showResidentPicker = false,
  mode = "create",
  initialData,
}: AddRelativeNoteModalProps) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { showToast } = useToast();
  const initialFormData = useMemo(() => buildFormData(initialData), [initialData]);
  const [formData, setFormData] = useState<RelativeNoteFormData>(() => buildFormData(initialData));

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const resetForm = useCallback(() => {
    setFormData(buildFormData(initialData));
  }, [initialData]);

  const handleClose = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirmClose = await confirm({
        title: "ยืนยันการปิดหน้าต่าง",
        message: "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างนี้หรือไม่?",
        confirmText: "ปิดหน้าต่าง",
        cancelText: "กลับไปแก้ไข",
      });
      if (!confirmClose) {
        return;
      }
    }

    onClose();
    resetForm();
  }, [hasUnsavedChanges, onClose, confirm]);

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(buildFormData(initialData));
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }

        if (!e.shiftKey && document.activeElement === lastElement) {
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

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showResidentPicker && !formData.residentId) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "กรุณาเลือกผู้ป่วยก่อนบันทึก" });
      return;
    }

    await onSubmit(formData);
    onClose();
    resetForm();
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
          className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800">{mode === "edit" ? "แก้ไขบันทึกญาติ" : "เพิ่มบันทึกญาติ"}</h2>
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
              <label htmlFor="relative-note-time" className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
              <input
                ref={showResidentPicker ? null : firstInputRef}
                id="relative-note-time"
                type="text"
                placeholder="00:00"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={baseInputClassName}
              />
            </div>
          </div>

          {/* relation input intentionally omitted */}

          <div>
            <label htmlFor="relative-note-content" className="block text-sm font-medium text-gray-700 mb-1">บันทึก</label>
            <textarea
              id="relative-note-content"
              placeholder="กรอกรายละเอียดบันทึกญาติ..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className={`${baseInputClassName} resize-none`}
              required
            />
          </div>

          {/* sendNote UI removed per request */}

          <div className="flex items-center justify-end gap-3 pt-2">
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
              {mode === "edit" ? "บันทึกการแก้ไข" : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
      </div>
      {confirmDialog}
    </>
  );
}
