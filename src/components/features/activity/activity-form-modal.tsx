"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/components/ui/dropdown";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import type { Activity, CreateActivityRequest } from "@/types/activity";

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => void;
  defaultDate?: Date;
  activityOptions?: Activity[];
  onCreateActivityOption?: (payload: CreateActivityRequest) => Promise<Activity | null>;
  initialValues?: Partial<ActivityFormData>;
  mode?: "create" | "edit";
}

export interface ActivityFormData {
  activityId?: string;
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  repeatEndDate: string;
  repeatDays: number[];
  location: string;
  description: string;
}

const ACTIVITY_TYPES = [
  { value: "กิจกรรมกระตุ้นสมอง", label: "กิจกรรมกระตุ้นสมอง" },
  { value: "กิจกรรมสร้างสรรค์", label: "กิจกรรมสร้างสรรค์" },
  { value: "กิจกรรมทางกาย", label: "กิจกรรมทางกาย" },
  { value: "กิจกรรมสังคม", label: "กิจกรรมสังคม" },
  { value: "กิจกรรมด้านจิตใจ/ศาสนา", label: "กิจกรรมด้านจิตใจ/ศาสนา" },
  { value: "กิจกรรมบันเทิง", label: "กิจกรรมบันเทิง" },
];

const TIME_OPTIONS = Array.from({ length: (22 - 6 + 1) * 2 }, (_, index) => {
  const baseHour = 6;
  const hours = baseHour + Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${String(hours).padStart(2, "0")}:${minutes}`;
  return { value, label: value };
});

const REPEAT_DAY_OPTIONS = [
  { value: 1, label: "จ" },
  { value: 2, label: "อ" },
  { value: 3, label: "พ" },
  { value: 4, label: "พฤ" },
  { value: 5, label: "ศ" },
  { value: 6, label: "ส" },
  { value: 7, label: "อา" },
];

function formatDateForValue(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value?: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function ActivityFormModal({
  isOpen,
  onClose,
  onSubmit,
  defaultDate,
  activityOptions = [],
  onCreateActivityOption,
  initialValues,
  mode = "create",
}: ActivityFormModalProps) {
  const buildInitialFormData = (values?: Partial<ActivityFormData>): ActivityFormData => {
    const hasDate = values && Object.prototype.hasOwnProperty.call(values, "date");
    const resolvedDate = hasDate
      ? values?.date ?? ""
      : defaultDate
      ? formatDateForValue(defaultDate)
      : "";

    return {
      activityId: values?.activityId || "",
      name: values?.name || "",
      type: values?.type || "",
      date: resolvedDate,
      startTime: values?.startTime || "",
      endTime: values?.endTime || "",
      isRecurring: values?.isRecurring || false,
      repeatEndDate: values?.repeatEndDate || resolvedDate,
      repeatDays: values?.repeatDays || [],
      location: values?.location || "",
      description: values?.description || "",
    };
  };

  const [formData, setFormData] = useState<ActivityFormData>(() => buildInitialFormData(initialValues));

  useEffect(() => {
    if (!isOpen) return;
    setFormData(buildInitialFormData(initialValues));
  }, [isOpen, initialValues, defaultDate]);

  const handleChange = (field: keyof ActivityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRepeatDay = (value: number) => {
    setFormData((prev) => {
      const exists = prev.repeatDays.includes(value);
      const nextDays = exists
        ? prev.repeatDays.filter((day) => day !== value)
        : [...prev.repeatDays, value].sort((a, b) => a - b);
      return { ...prev, repeatDays: nextDays };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.activityId && !formData.name.trim()) {
      alert("กรุณาเลือกหรือเพิ่มกิจกรรม");
      return;
    }

    if (!formData.type.trim()) {
      alert("กรุณาเลือกประเภทกิจกรรม");
      return;
    }

    // Validate backdated activities (only allow 1 day in the past)
    const selectedDate = parseLocalDate(formData.date);
    if (selectedDate) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Normalize dates to compare (ignore time)
      const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const normalizedSelected = normalizeDate(selectedDate);
      const normalizedYesterday = normalizeDate(yesterday);
      const normalizedToday = normalizeDate(today);

      // Check if date is more than 1 day in the past
      if (normalizedSelected < normalizedYesterday) {
        alert("ไม่สามารถสร้างกิจกรรมย้อนหลังเกิน 1 วันได้");
        return;
      }
    }

    if (mode === "create" && formData.isRecurring) {
      if (formData.repeatDays.length === 0) {
        alert("กรุณาเลือกวันทำซ้ำอย่างน้อย 1 วัน");
        return;
      }
      if (!formData.repeatEndDate) {
        alert("กรุณาเลือกวันสิ้นสุด");
        return;
      }
      const startDate = parseLocalDate(formData.date);
      const endDate = parseLocalDate(formData.repeatEndDate);
      if (startDate && endDate && endDate < startDate) {
        alert("วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น");
        return;
      }
    }

    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData(buildInitialFormData());
    onClose();
  };

  const handleSelectActivity = (activityId: string) => {
    const selected = activityOptions.find((activity) => activity.activity_id === activityId);
    if (!selected) return;
    setFormData((prev) => ({
      ...prev,
      activityId: selected.activity_id,
      name: selected.activity_name,
      type: selected.activity_type,
      description: selected.description ?? "",
      location: selected.location ?? "",
    }));
  };

  const handleCreateActivity = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (!formData.type.trim()) {
      alert("กรุณาเลือกประเภทก่อนเพิ่มกิจกรรม");
      return;
    }

    const payload: CreateActivityRequest = {
      activity_name: trimmedName,
      activity_type: formData.type.trim(),
      description: normalizeOptionalValue(formData.description),
      location: normalizeOptionalValue(formData.location),
    };

    const created = await onCreateActivityOption?.(payload);
    if (!created) return;

    setFormData((prev) => ({
      ...prev,
      activityId: created.activity_id,
      name: created.activity_name,
      type: created.activity_type,
      description: created.description ?? "",
      location: created.location ?? "",
    }));
  };

  const dropdownOptions = activityOptions.map((activity) => ({
    value: activity.activity_id,
    label: activity.activity_name,
  }));
  const hasSelectedOption = formData.activityId
    ? dropdownOptions.some((option) => option.value === formData.activityId)
    : false;
  const mergedOptions = hasSelectedOption || !formData.activityId || !formData.name.trim()
    ? dropdownOptions
    : [{ value: formData.activityId, label: formData.name }, ...dropdownOptions];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {mode === "edit" ? "แก้ไขกิจกรรม" : "สร้างกิจกรรมใหม่"}
          </h2>
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
              <SearchableDropdown
                options={mergedOptions}
                value={formData.activityId}
                onChange={handleSelectActivity}
                placeholder="เลือกกิจกรรม"
                className="w-full"
                allowCreate={Boolean(onCreateActivityOption)}
                onCreate={handleCreateActivity}
                createLabel="เพิ่มกิจกรรม"
              />
            </div>

            {/* ประเภท */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                ประเภท <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={ACTIVITY_TYPES}
                value={formData.type}
                onChange={(val) => handleChange("type", val)}
                placeholder="เลือกประเภท"
                className="w-full text-slate-700 placeholder:text-slate-500"
              />
            </div>

            {/* วันที่, เวลาเริ่มต้น, เวลาสิ้นสุด */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  วันที่ <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={parseLocalDate(formData.date)}
                  onChange={(date) => handleChange("date", date ? formatDateForValue(date) : "")}
                  placeholder="เลือกวันที่"
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  เวลาเริ่มต้น <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  options={TIME_OPTIONS}
                  value={formData.startTime}
                  onChange={(val) => handleChange("startTime", val)}
                  placeholder="เลือกเวลา"
                  className="w-full text-slate-700 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  เวลาสิ้นสุด <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  options={TIME_OPTIONS}
                  value={formData.endTime}
                  onChange={(val) => handleChange("endTime", val)}
                  placeholder="เลือกเวลา"
                  className="w-full text-slate-700 placeholder:text-slate-500"
                />
              </div>
            </div>

            {mode === "create" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">ทำซ้ำกิจกรรม</label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isRecurring: e.target.checked,
                          repeatEndDate: prev.repeatEndDate || prev.date,
                          repeatDays: e.target.checked ? prev.repeatDays : [],
                        }))
                      }
                    />
                    เปิดใช้
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-500">เลือกวันทำซ้ำ</p>
                      <div className="flex flex-wrap gap-2">
                        {REPEAT_DAY_OPTIONS.map((day) => {
                          const active = formData.repeatDays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleRepeatDay(day.value)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                active
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        วันสิ้นสุด <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        value={parseLocalDate(formData.repeatEndDate)}
                        onChange={(date) =>
                          handleChange("repeatEndDate", date ? formatDateForValue(date) : "")
                        }
                        placeholder="เลือกวันสิ้นสุด"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* สถานที่ */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">สถานที่</label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="ระบุสถานที่จัดกิจกรรม"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">รายละเอียดเพิ่มเติม</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="รายละเอียดกิจกรรม..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              {mode === "edit" ? "บันทึก" : "สร้างกิจกรรม"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
