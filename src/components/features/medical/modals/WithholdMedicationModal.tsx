"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

interface WithholdMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WithholdFormData) => void;
  patientName: string;
  patientRoom: string;
  medicationName: string;
  medicationDosage: string;
}

export interface WithholdFormData {
  reason: string;
  note: string;
}

export function WithholdMedicationModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  patientName,
  patientRoom,
  medicationName,
  medicationDosage
}: WithholdMedicationModalProps) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [formData, setFormData] = useState<WithholdFormData>({
    reason: "",
    note: "" });

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const reasons = [
    "ผู้สูงอายุหลับอยู่",
    "ผู้สูงอายุปฏิเสธ",
    "รอพบแพทย์/ทราบผล",
    "อื่นๆ"
  ];

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  const hasUnsavedChanges = useMemo(() => !!(formData.reason || formData.note), [formData]);

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
    setFormData({ reason: "", note: "" });
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
          className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800">งดให้ยา</h2>
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
            <div className="w-14 h-14 rounded-full border-2 border-blue-400 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-headline-6 font-bold shrink-0">
              {patientName.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{patientName}</h3>
              <p className="text-sm text-gray-500">{patientRoom}</p>
            </div>
          </div>

          {/* Medication Info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-800">{medicationName}</p>
            <p className="text-xs text-gray-500">{medicationDosage}</p>
          </div>

          {/* Reason Radio Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เหตุผล <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {reasons.map((reason) => (
                <label key={reason} className="flex items-center gap-2 cursor-pointer">
                  <input
                    ref={reason === reasons[0] ? firstInputRef : undefined}
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={formData.reason === reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="withhold-note" className="block text-sm font-medium text-gray-700 mb-1">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              id="withhold-note"
              placeholder="เพิ่มหมายเหตุ..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleClose()}
              className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              ยืนยันงดยา
            </button>
          </div>
        </form>
      </div>
      </div>
      {confirmDialog}
    </>
  );
}


