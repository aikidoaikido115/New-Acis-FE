"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";
import { ResidentSearchCombobox, type ResidentComboboxOption } from "./ResidentSearchCombobox";

export interface ResidentOption {
  id: string;
  name: string;
  subLabel?: string;
  floor?: number;
}

interface AddDoctorOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DoctorOrderFormData) => void | boolean | Promise<void | boolean>;
  residentOptions?: ResidentOption[];
  showResidentPicker?: boolean;
  requireResidentSelection?: boolean;
  defaultResidentId?: string;
  mode?: "create" | "edit";
  initialData?: Partial<DoctorOrderFormData>;
}

export interface DoctorOrderFormData {
  residentId?: string;
  orderDate: string;
  orderType: string;
  title: string;
  details: string;
  startDate: string;
  endDate: string;
  frequency: string;
  orderedBy: string;
}

const baseInputClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const baseSelectClassName =
  "w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const fullWidthDatePickerClassName = "w-full [&>button]:w-full [&>button]:justify-between";

const buildFormData = (defaultResidentId?: string, initialData?: Partial<DoctorOrderFormData>): DoctorOrderFormData => ({
  residentId: initialData?.residentId ?? defaultResidentId ?? "",
  orderDate: initialData?.orderDate || formatIsoDate(new Date()),
  orderType: initialData?.orderType || "",
  title: initialData?.title || "",
  details: initialData?.details || "",
  startDate: initialData?.startDate || "",
  endDate: initialData?.endDate || "",
  frequency: initialData?.frequency || "",
  orderedBy: initialData?.orderedBy ?? "",
});

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

export function AddDoctorOrderModal({
  isOpen,
  onClose,
  onSubmit,
  residentOptions = [],
  showResidentPicker = false,
  requireResidentSelection = false,
  defaultResidentId,
  mode = "create",
  initialData,
}: AddDoctorOrderModalProps) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { showToast } = useToast();

  const initialFormData = useMemo(
    () => buildFormData(defaultResidentId, initialData),
    [defaultResidentId, initialData]
  );

  const [formData, setFormData] = useState<DoctorOrderFormData>(initialFormData);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isOverviewMode = showResidentPicker;

  const residentComboboxOptions = useMemo<ResidentComboboxOption[]>(
    () =>
      residentOptions.map((resident) => ({
        id: resident.id,
        fullName: resident.name,
        subLabel: resident.subLabel,
        floorValue: resident.floor ? String(resident.floor) : "",
        searchText: `${resident.name} ${resident.id} ${resident.subLabel || ""}`.toLowerCase(),
      })),
    [residentOptions]
  );

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const selectedResident = useMemo(() => {
    if (!formData.residentId) {
      return null;
    }
    return residentOptions.find((resident) => resident.id === formData.residentId) ?? null;
  }, [formData.residentId, residentOptions]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isOverviewMode && !selectedResident) {
      return;
    }

    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen, isOverviewMode, selectedResident]);

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
  }, [hasUnsavedChanges, onClose, confirm, resetForm]);

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

    if (requireResidentSelection && !formData.residentId) {
      showToast({
        type: "error",
        title: "กรุณาเลือกผู้ป่วย",
        message: "โปรดเลือกผู้ป่วยก่อนบันทึกคำสั่งแพทย์",
      });
      return;
    }

    const result = await onSubmit(formData);
    if (result === false) {
      return;
    }

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
            <h2 id="modal-title" className="text-lg font-semibold text-slate-800">{mode === "edit" ? "แก้ไขคำสั่งแพทย์" : "เพิ่มคำสั่งแพทย์"}</h2>
            <button
              onClick={() => void handleClose()}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {isOverviewMode ? (
              <ResidentSearchCombobox
                options={residentComboboxOptions}
                value={formData.residentId || ""}
                onChange={(residentId) => setFormData((prev) => ({ ...prev, residentId }))}
                onClear={() => setFormData((prev) => ({ ...prev, residentId: "" }))}
                autoFocus={isOpen && !selectedResident}
                label="ผู้พัก"
                placeholder="ค้นหาชื่อผู้พัก เลขห้อง หรือรหัส..."
              />
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="doctor-order-date" className="block text-sm font-medium text-gray-700 mb-1">วันที่สั่ง</label>
                <div id="doctor-order-date">
                  <DatePicker
                    value={parseDateValue(formData.orderDate)}
                    onChange={(date) => setFormData({ ...formData, orderDate: date ? formatIsoDate(date) : "" })}
                    placeholder="DD/MM/YYYY"
                    className={fullWidthDatePickerClassName}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="doctor-order-type" className="block text-sm font-medium text-gray-700 mb-1">ประเภทคำสั่ง</label>
                <Dropdown
                  options={[
                    { value: "แนวทางรักษา", label: "แนวทางรักษา" },
                    { value: "การใช้ยา/ปรับยา", label: "การใช้ยา/ปรับยา" },
                    { value: "การให้ยาแบบฉุกเฉิน (PRN)", label: "การให้ยาแบบฉุกเฉิน (PRN)" },
                    { value: "หยุดยา/ปรับแผนยา", label: "หยุดยา/ปรับแผนยา" },
                    { value: "การพยาบาล", label: "การพยาบาล" },
                    { value: "การติดตามอาการ", label: "การติดตามอาการ" },
                    { value: "การตรวจทางห้องปฏิบัติการ", label: "การตรวจทางห้องปฏิบัติการ" },
                    { value: "อื่นๆ", label: "อื่นๆ" },
                  ]}
                  value={formData.orderType}
                  onChange={(value) => setFormData({ ...formData, orderType: value })}
                  placeholder="เลือกประเภท"
                />
              </div>
            </div>

            <div>
              <label htmlFor="doctor-order-title" className="block text-sm font-medium text-gray-700 mb-1">หัวข้อคำสั่ง</label>
              <input
                id="doctor-order-title"
                type="text"
                placeholder="เช่น ปรับขนาดยา Furosemide เป็น 20 mg หลังอาหารเช้า"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={baseInputClassName}
                ref={firstInputRef}
                required
              />
            </div>

            <div>
              <label htmlFor="doctor-order-details" className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดคำสั่ง</label>
              <textarea
                id="doctor-order-details"
                placeholder="ระบุขั้นตอน เวลา เงื่อนไข และผู้รับผิดชอบในการปฏิบัติตามคำสั่ง..."
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={4}
                className={`${baseInputClassName} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="doctor-order-start" className="block text-sm font-medium text-gray-700 mb-1">วันเริ่มต้น</label>
                <div id="doctor-order-start">
                  <DatePicker
                    value={parseDateValue(formData.startDate)}
                    onChange={(date) => setFormData({ ...formData, startDate: date ? formatIsoDate(date) : "" })}
                    placeholder="DD/MM/YYYY"
                    className={fullWidthDatePickerClassName}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="doctor-order-end" className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุด</label>
                <div id="doctor-order-end">
                  <DatePicker
                    value={parseDateValue(formData.endDate)}
                    onChange={(date) => setFormData({ ...formData, endDate: date ? formatIsoDate(date) : "" })}
                    placeholder="DD/MM/YYYY"
                    className={fullWidthDatePickerClassName}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="doctor-order-frequency" className="block text-sm font-medium text-gray-700 mb-1">ความถี่/แผนติดตาม</label>
              <input
                id="doctor-order-frequency"
                type="text"
                placeholder="เช่น หลังอาหารเช้า-เย็น, ทุก 6 ชม., PRN เมื่อปวดมาก"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className={baseInputClassName}
              />
            </div>

            <div>
              <label htmlFor="doctor-order-ordered-by" className="block text-sm font-medium text-gray-700 mb-1">เพิ่มเติม (ไม่บังคับ)</label>
              <input
                id="doctor-order-ordered-by"
                type="text"
                placeholder="เช่น หมายเหตุเพิ่มเติม หรือเงื่อนไขการดูแล"
                value={formData.orderedBy}
                onChange={(e) => setFormData({ ...formData, orderedBy: e.target.value })}
                className={baseInputClassName}
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
