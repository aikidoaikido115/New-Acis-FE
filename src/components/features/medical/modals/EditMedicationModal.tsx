"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Calendar, Clock } from "lucide-react";
import { RoutineMedication } from "../medical.mock";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

interface EditMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditMedicationFormData) => void;
  medication: RoutineMedication;
  patientName: string;
  patientRoom: string;
}

export interface EditMedicationFormData {
  medicationName: string;
  dosage: string;
  frequency: string;
  route: "เช้า" | "กลางวัน" | "เย็น" | "ก่อนนอน";
  timing: "ประจำ" | "ชั่วคราว";
  note: string;
  startDate: string;
  endDate: string;
}

export function EditMedicationModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  medication,
  patientName,
  patientRoom
}: EditMedicationModalProps) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [formData, setFormData] = useState<EditMedicationFormData>({
    medicationName: medication.name,
    dosage: medication.dose,
    frequency: medication.frequency,
    route: "เช้า",
    timing: "ประจำ",
    note: medication.note,
    startDate: "",
    endDate: "" });

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const hasUnsavedChanges = useMemo(
    () => !!(
      formData.medicationName !== medication.name ||
      formData.dosage !== medication.dose ||
      formData.frequency !== medication.frequency ||
      formData.note !== medication.note
    ),
    [formData, medication]
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
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800">แก้ไขรายการยา</h2>
          <button 
            onClick={() => void handleClose()} 
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-headline-7 font-bold shrink-0">
              {patientName.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{patientName}</h3>
              <p className="text-sm text-gray-500">{patientRoom}</p>
            </div>
          </div>

          {/* Medication Name */}
          <div>
            <label htmlFor="edit-med-name" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อยา <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="edit-med-name"
              type="text"
              placeholder="ชื่อยา"
              value={formData.medicationName}
              onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Dosage */}
          <div>
            <label htmlFor="edit-med-dosage" className="block text-sm font-medium text-gray-700 mb-1">
              ขนาด / โดส <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-med-dosage"
              type="text"
              placeholder="เช่น 500 mg"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Frequency/Route - Icon Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ความถี่/วัน <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["เช้า", "กลางวัน", "เย็น", "ก่อนนอน"] as const).map((route) => (
                <button
                  key={route}
                  type="button"
                  onClick={() => setFormData({ ...formData, route })}
                  className={`flex flex-col items-center justify-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    formData.route === route
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Clock className="w-5 h-5 mb-1" />
                  <span>{route}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timing - Radio Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทยา <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-timing"
                  checked={formData.timing === "ประจำ"}
                  onChange={() => setFormData({ ...formData, timing: "ประจำ" })}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">ประจำ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-timing"
                  checked={formData.timing === "ชั่วคราว"}
                  onChange={() => setFormData({ ...formData, timing: "ชั่วคราว" })}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">ชั่วคราว</span>
              </label>
            </div>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="edit-med-note" className="block text-sm font-medium text-gray-700 mb-1">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              id="edit-med-note"
              placeholder="หมายเหตุ..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Start and End Date - Only show when "ชั่วคราว" is selected */}
          {formData.timing === "ชั่วคราว" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-med-start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  วันเริ่ม <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="edit-med-start-date"
                    type="text"
                    placeholder="11/02/2566"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="edit-med-end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  วันสิ้นสุด <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="edit-med-end-date"
                    type="text"
                    placeholder="15/02/2566"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={() => void handleClose()}
              className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
      </div>
      {confirmDialog}
    </>
  );
}


