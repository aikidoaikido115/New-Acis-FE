"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calendar, Image as ImageIcon } from "lucide-react";

interface AddWoundCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WoundCareFormData) => void;
}

export interface WoundCareFormData {
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

export function AddWoundCareModal({ isOpen, onClose, onSubmit }: AddWoundCareModalProps) {
  const [formData, setFormData] = useState<WoundCareFormData>({
    date: new Date().toLocaleDateString("th-TH"),
    time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    location: "",
    woundType: "",
    size: "",
    treatment: "",
    supplies: "",
    status: "คงที่",
    note: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    const hasData = 
      formData.location || 
      formData.woundType || 
      formData.size || 
      formData.treatment || 
      formData.supplies || 
      formData.note ||
      imagePreview;
    setHasUnsavedChanges(hasData);
  }, [formData, imagePreview]);

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
  }, [isOpen, hasUnsavedChanges]);

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

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        "คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างนี้หรือไม่?"
      );
      if (!confirmClose) return;
    }
    onClose();
    // Reset form
    setFormData({
      date: new Date().toLocaleDateString("th-TH"),
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      location: "",
      woundType: "",
      size: "",
      treatment: "",
      supplies: "",
      status: "คงที่",
      note: "",
    });
    setImagePreview(null);
    setHasUnsavedChanges(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setHasUnsavedChanges(false);
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
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg font-bold text-gray-800">บันทึกการทำแผล</h2>
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
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wound-date" className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
              <div className="relative">
                <input
                  ref={firstInputRef}
                  id="wound-date"
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="wound-time" className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
              <input
                id="wound-time"
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="wound-location" className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งแผล</label>
            <input
              id="wound-location"
              type="text"
              placeholder="เช่น สะโพกขวา, แขนซ้าย"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Wound Type and Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wound-type" className="block text-sm font-medium text-gray-700 mb-1">ประเภทแผล</label>
              <input
                id="wound-type"
                type="text"
                placeholder="เช่น แผลกดทับ"
                value={formData.woundType}
                onChange={(e) => setFormData({ ...formData, woundType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Treatment */}
          <div>
            <label htmlFor="wound-treatment" className="block text-sm font-medium text-gray-700 mb-1">ขั้นตอนการดูแล</label>
            <textarea
              id="wound-treatment"
              placeholder="อธิบายขั้นตอนการทำแผล..."
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Supplies */}
          <div>
            <label htmlFor="wound-supplies" className="block text-sm font-medium text-gray-700 mb-1">วัสดุที่ใช้</label>
            <input
              id="wound-supplies"
              type="text"
              placeholder="เช่น Gauze, Tegaderm"
              value={formData.supplies}
              onChange={(e) => setFormData({ ...formData, supplies: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="wound-status" className="block text-sm font-medium text-gray-700 mb-1">สภาพแผล</label>
            <select
              id="wound-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="คงที่">คงที่</option>
              <option value="ดีขึ้น">ดีขึ้น</option>
              <option value="แย่ลง">แย่ลง</option>
            </select>
          </div>

          {/* Image Upload */}
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
                  <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">ถ่ายรูป / เลือกรูป</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="wound-note" className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea
              id="wound-note"
              placeholder="บันทึกเพิ่มเติม..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
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
