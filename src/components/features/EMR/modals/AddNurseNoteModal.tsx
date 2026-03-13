"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Calendar, MessageSquare, AlertTriangle, Image as ImageIcon, Send } from "lucide-react";

interface AddNurseNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NurseNoteFormData) => void;
}

export interface NurseNoteFormData {
  date: string;
  time: string;
  category: string;
  content: string;
  priority: "normal" | "urgent";
  attachments?: File[];
  sendNote: boolean;
}

export function AddNurseNoteModal({ isOpen, onClose, onSubmit }: AddNurseNoteModalProps) {
  const [formData, setFormData] = useState<NurseNoteFormData>({
    date: new Date().toLocaleDateString("th-TH"),
    time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    category: "ประจำวัน",
    content: "",
    priority: "normal",
    sendNote: false,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Track unsaved changes
  useEffect(() => {
    const hasData = !!(
      formData.content.trim().length > 0 || 
      formData.attachments?.length
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
      date: new Date().toLocaleDateString("th-TH"),
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      category: "ประจำวัน",
      content: "",
      priority: "normal",
      sendNote: false,
    });
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, onClose]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, attachments: files });
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
          <h2 id="modal-title" className="text-lg font-bold text-gray-800">เขียน Nurse Note</h2>
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
              <label htmlFor="nurse-note-date" className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
              <div className="relative">
                <input
                  ref={firstInputRef}
                  id="nurse-note-date"
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="nurse-note-time" className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
              <input
                id="nurse-note-time"
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="nurse-note-category" className="block text-sm font-medium text-gray-700 mb-1">ประเภทบันทึก</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                id="nurse-note-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
              >
                <option value="ประจำวัน">ประจำวัน</option>
                <option value="พิเศษ">พิเศษ</option>
                <option value="ฉุกเฉิน">ฉุกเฉิน</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="nurse-note-content" className="block text-sm font-medium text-gray-700 mb-1">เนื้อหา</label>
            <textarea
              id="nurse-note-content"
              placeholder="บันทึกรายละเอียด..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Priority Radio Buttons */}
          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">ระดับความสำคัญ</legend>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={formData.priority === "normal"}
                    onChange={() => setFormData({ ...formData, priority: "normal" })}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                  />
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700">เฝ้าระวัง</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={formData.priority === "urgent"}
                    onChange={() => setFormData({ ...formData, priority: "urgent" })}
                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                  />
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-700">ผิดปกติ</span>
                </label>
              </div>
            </fieldset>
          </div>

          {/* Attachments */}
          <div>
            <label htmlFor="nurse-note-upload" className="block text-sm font-medium text-gray-700 mb-1">แนบรูปภาพ</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="nurse-note-upload"
                aria-label="อัปโหลดรูปภาพ"
              />
              <label htmlFor="nurse-note-upload" className="cursor-pointer flex flex-col items-center">
                <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-sm text-gray-600">ถ่ายรูป / เลือกรูป</span>
              </label>
            </div>
          </div>

          {/* Send Note Checkbox */}
          <div className="bg-blue-50 rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendNote}
                onChange={(e) => setFormData({ ...formData, sendNote: e.target.checked })}
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
              <Send className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-700 font-medium">ส่ง Note นี้ให้ญาติ</span>
            </label>
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
