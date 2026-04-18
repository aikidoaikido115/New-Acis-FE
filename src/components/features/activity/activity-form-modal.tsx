"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => void;
  defaultDate?: Date;
}

export interface ActivityFormData {
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
}

const ACTIVITY_TYPES = [
  { value: "meal", label: "รับประทานอาหาร" },
  { value: "outing", label: "ไปเที่ยว" },
  { value: "other", label: "สังสรรค์ / กิจกรรมอื่นๆ" },
];

function formatDateForInput(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year + 543}`;
}

function formatDateForValue(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

export function ActivityFormModal({ isOpen, onClose, onSubmit, defaultDate }: ActivityFormModalProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    name: "",
    type: "",
    date: defaultDate ? formatDateForValue(defaultDate) : "",
    startTime: "09:00",
    endTime: "11:00",
    location: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen && defaultDate) {
      setFormData((prev) => ({
        ...prev,
        date: formatDateForValue(defaultDate),
      }));
    }
  }, [isOpen, defaultDate]);

  const handleChange = (field: keyof ActivityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      type: "",
      date: defaultDate ? formatDateForValue(defaultDate) : "",
      startTime: "09:00",
      endTime: "11:00",
      location: "",
      description: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">สร้างกิจกรรมใหม่</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* ชื่อกิจกรรม */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                ชื่อกิจกรรม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="วางยุงและสร้างที่"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* ประเภท */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                ประเภท <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              >
                <option value="">เลือกประเภท</option>
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* วันที่ */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                วันที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* เวลาเริ่มต้น - เวลาสิ้นสุด */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  เวลาเริ่มต้น <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  เวลาสิ้นสุด <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            {/* สถานที่ */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">สถานที่</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="แหล่งที่ชำกันมา..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">รายละเอียดเพิ่มเติม</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="รายละเอียดกิจกรรม..."
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              สร้างกิจกรรม
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
