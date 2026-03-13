"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Calendar } from "lucide-react";

interface AddDoctorOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DoctorOrderFormData) => void;
}

export interface DoctorOrderFormData {
  orderDate: string;
  medicationType: string;
  medicationName: string;
  dosageDetails: string;
  startDate: string;
  endDate: string;
  frequency: string;
  pharmacist: string;
}

export function AddDoctorOrderModal({ isOpen, onClose, onSubmit }: AddDoctorOrderModalProps) {
  const [formData, setFormData] = useState<DoctorOrderFormData>({
    orderDate: new Date().toLocaleDateString("th-TH"),
    medicationType: "แนวทางรักษา",
    medicationName: "",
    dosageDetails: "",
    startDate: "",
    endDate: "",
    frequency: "",
    pharmacist: "",
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  // Track unsaved changes
  useEffect(() => {
    const hasData = !!(
      formData.medicationName || 
      formData.dosageDetails || 
      formData.startDate || 
      formData.endDate || 
      formData.frequency || 
      formData.pharmacist
    );
    setHasUnsavedChanges(hasData);
  }, [formData]);

  // Handle close with confirmation
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างนี้หรือไม่?"
      );
      if (!confirmClose) return;
    }
    onClose();
    // Reset form
    setFormData({
      orderDate: new Date().toLocaleDateString("th-TH"),
      medicationType: "แนวทางรักษา",
      medicationName: "",
      dosageDetails: "",
      startDate: "",
      endDate: "",
      frequency: "",
      pharmacist: "",
    });
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, onClose]);

  // Handle keyboard events (ESC to close, trap focus)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to close with confirmation if unsaved changes
      if (e.key === "Escape") {
        handleClose();
      }

      // Trap focus within modal (Tab key)
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab
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

  // Prevent body scroll when modal is open
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
    setHasUnsavedChanges(false);
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg font-bold text-gray-800">เพิ่มคำสั่งแพทย์</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Order Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="doctor-order-date" className="block text-sm font-medium text-gray-700 mb-1">วันที่สั่ง</label>
              <div className="relative">
                <input
                  ref={firstInputRef}
                  id="doctor-order-date"
                  type="text"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="doctor-order-type" className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select
                id="doctor-order-type"
                value={formData.medicationType}
                onChange={(e) => setFormData({ ...formData, medicationType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="แนวทางรักษา">แนวทางรักษา</option>
                <option value="ยาประจำ">ยาประจำ</option>
                <option value="ยาฉุกเฉิน">ยาฉุกเฉิน</option>
              </select>
            </div>
          </div>

          {/* Medication Name */}
          <div>
            <label htmlFor="doctor-order-name" className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
            <input
              id="doctor-order-name"
              type="text"
              placeholder="เช่น Paracetamol, แพทย์พิทักษ์"
              value={formData.medicationName}
              onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Dosage Details */}
          <div>
            <label htmlFor="doctor-order-details" className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดคำสั่ง</label>
            <textarea
              id="doctor-order-details"
              placeholder="รายละเอียดการปฏิบัติ..."
              value={formData.dosageDetails}
              onChange={(e) => setFormData({ ...formData, dosageDetails: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Start and End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="doctor-order-start" className="block text-sm font-medium text-gray-700 mb-1">วันเริ่มต้น</label>
              <input
                id="doctor-order-start"
                type="text"
                placeholder="21/01/2026"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="doctor-order-end" className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุด</label>
              <input
                id="doctor-order-end"
                type="text"
                placeholder="21/01/2026"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="doctor-order-frequency" className="block text-sm font-medium text-gray-700 mb-1">ความถี่</label>
            <input
              id="doctor-order-frequency"
              type="text"
              placeholder="เช่น ทุกวัน, ทุก 4 ชม."
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Pharmacist */}
          <div>
            <label htmlFor="doctor-order-pharmacist" className="block text-sm font-medium text-gray-700 mb-1">ผู้สั่ง</label>
            <input
              id="doctor-order-pharmacist"
              type="text"
              placeholder="ชื่อแพทย์"
              value={formData.pharmacist}
              onChange={(e) => setFormData({ ...formData, pharmacist: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={handleClose}
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
  );
}
