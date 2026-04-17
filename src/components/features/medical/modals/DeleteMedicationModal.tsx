"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { RoutineMedication } from "../medical.types";

interface DeleteMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  medication: RoutineMedication;
  patientName: string;
  patientRoom: string;
}

export function DeleteMedicationModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  medication,
  patientName,
  patientRoom
}: DeleteMedicationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
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

  const handleConfirmDelete = () => {
    onSubmit();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-all duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-800">ลบรายการยา</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
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

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  คุณต้องการลบรายการยานี้หรือไม่?
                </p>
                <p className="text-xs text-red-600">
                  เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลกลับมาได้อีก และจะไม่แสดงตารางการให้ยารายการนี้อีกต่อไป
                </p>
              </div>
            </div>
          </div>

          {/* Medication Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-800">{medication.name}</p>
            <p className="text-xs text-gray-500">{medication.dose}</p>
            <p className="text-xs text-gray-500">รับประทานทุกช่วง{medication.frequency}</p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleConfirmDelete}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              ยืนยันการลบยา
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


