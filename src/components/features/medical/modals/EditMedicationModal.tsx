"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Sunrise, Sun, Sunset, MoonStar } from "lucide-react";
import type { RoutineMedication } from "../medical.types";
import type { TimeOfDaySlot } from "./AddMedicationModal";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";

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
  amount: string;
  amountUnit: string;
  frequencyPerDay: number;
  route: TimeOfDaySlot[];
  medicationType: "ประจำ" | "ชั่วคราว";
  administrationTiming: "ก่อนอาหาร" | "หลังอาหาร";
  note: string;
  startDate: string;
  endDate: string;
}

type EditMedicationFormErrors = Partial<Record<keyof EditMedicationFormData | "customAmountUnit", string>>;

const TIME_SLOTS = ["เช้า", "กลางวัน", "เย็น", "ก่อนนอน"] as const;
const OTHER_UNIT_VALUE = "__other__";
const STANDARD_AMOUNT_UNITS = ["เม็ด", "แคปซูล", "มล.", "หยด", "พัฟ", "ซอง", "ขวด", "IU"] as const;
const MAX_FREQUENCY_PER_DAY = 4;
const DOSE_PATTERN = /^([0-9]+(?:\.[0-9]+)?)\s*(mcg|mg|g|kg|ml|l|iu)$/i;

const ALL_TIME_SLOTS: TimeOfDaySlot[] = ["เช้า", "กลางวัน", "เย็น", "ก่อนนอน"];

const parseTimeOfDay = (value?: string): TimeOfDaySlot[] => {
  if (!value) return ["เช้า"];
  const valid = new Set<string>(ALL_TIME_SLOTS);
  // Handle English aliases too
  const aliasMap: Record<string, TimeOfDaySlot> = {
    morning: "เช้า",
    noon: "กลางวัน",
    evening: "เย็น",
    bedtime: "ก่อนนอน",
  };
  const result: TimeOfDaySlot[] = value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .map((s) => (aliasMap[s] as TimeOfDaySlot) ?? (valid.has(s) ? (s as TimeOfDaySlot) : null))
    .filter((s): s is TimeOfDaySlot => s !== null);
  return result.length > 0 ? result : ["เช้า"];
};

const asAdministrationTiming = (value?: string): EditMedicationFormData["administrationTiming"] => {
  if (!value) {
    return "หลังอาหาร";
  }

  const options: EditMedicationFormData["administrationTiming"][] = ["ก่อนอาหาร", "หลังอาหาร"];
  const match = options.find((option) => option === value.trim());
  return match || "หลังอาหาร";
};

const parseDateInput = (value: string): Date | null => {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yearText, monthText, dayText] = raw.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
    return null;
  }

  const thaiDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!thaiDate) {
    return null;
  }

  const day = Number(thaiDate[1]);
  const month = Number(thaiDate[2]);
  const rawYear = Number(thaiDate[3]);
  const year = rawYear > 2400 ? rawYear - 543 : rawYear;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return date;
  }

  return null;
};

const formatDateAsIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const baseInputClassName =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const baseSelectClassName =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

const fullWidthDatePickerClassName = "w-full [&>button]:w-full [&>button]:justify-between";

const getTimeOfDayIcon = (slot: TimeOfDaySlot) => {
  switch (slot) {
    case "เช้า":
      return <Sunrise className="w-5 h-5 mb-1" />;
    case "กลางวัน":
      return <Sun className="w-5 h-5 mb-1" />;
    case "เย็น":
      return <Sunset className="w-5 h-5 mb-1" />;
    case "ก่อนนอน":
      return <MoonStar className="w-5 h-5 mb-1" />;
    default:
      return null;
  }
};

const toInitialFormData = (medication: RoutineMedication): EditMedicationFormData => ({
  medicationName: medication.name,
  dosage: medication.dose,
  amount: medication.amount,
  amountUnit: medication.amountUnit,
  frequencyPerDay: medication.frequencyPerDay,
  route: parseTimeOfDay(medication.timeOfDay),
  medicationType: medication.takeType === "as_needed" ? "ชั่วคราว" : "ประจำ",
  administrationTiming: asAdministrationTiming(medication.timing),
  note: medication.description || "",
  startDate: medication.startDate || "",
  endDate: medication.endDate || "",
});

const toInitialAmountUnitOption = (amountUnit: string): string => {
  const normalized = amountUnit.trim();
  return STANDARD_AMOUNT_UNITS.includes(normalized as (typeof STANDARD_AMOUNT_UNITS)[number])
    ? normalized
    : OTHER_UNIT_VALUE;
};

export function EditMedicationModal({
  isOpen,
  onClose,
  onSubmit,
  medication,
  patientName,
  patientRoom,
}: EditMedicationModalProps) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const initialFormData = useMemo(() => toInitialFormData(medication), [medication]);

  const [formData, setFormData] = useState<EditMedicationFormData>(initialFormData);
  const [amountUnitOption, setAmountUnitOption] = useState<string>(toInitialAmountUnitOption(initialFormData.amountUnit));
  const [errors, setErrors] = useState<EditMedicationFormErrors>({});

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const hasUnsavedChanges = useMemo(
    () =>
      !!(
        formData.medicationName !== initialFormData.medicationName ||
        formData.dosage !== initialFormData.dosage ||
        formData.amount !== initialFormData.amount ||
        formData.amountUnit !== initialFormData.amountUnit ||
        formData.frequencyPerDay !== initialFormData.frequencyPerDay ||
        formData.route !== initialFormData.route ||
        formData.medicationType !== initialFormData.medicationType ||
        formData.administrationTiming !== initialFormData.administrationTiming ||
        formData.note !== initialFormData.note ||
        formData.startDate !== initialFormData.startDate ||
        formData.endDate !== initialFormData.endDate
      ),
    [formData, initialFormData]
  );

  const clearFieldError = useCallback((field: keyof EditMedicationFormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const updateField = useCallback(
    <K extends keyof EditMedicationFormData>(field: K, value: EditMedicationFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      clearFieldError(field);
    },
    [clearFieldError]
  );

  const validateForm = useCallback((): boolean => {
    const nextErrors: EditMedicationFormErrors = {};

    if (!formData.medicationName.trim()) {
      nextErrors.medicationName = "กรุณาระบุชื่อยา";
    }

    if (!DOSE_PATTERN.test(formData.dosage.trim())) {
      nextErrors.dosage = "รูปแบบไม่ถูกต้อง เช่น 500 mg หรือ 5 mL";
    }

    if (!formData.amount.trim()) {
      nextErrors.amount = "กรุณาระบุจำนวนต่อครั้ง";
    }

    if (!formData.amountUnit.trim()) {
      nextErrors.amountUnit = "กรุณาเลือกหรือระบุหน่วยยา";
      if (amountUnitOption === OTHER_UNIT_VALUE) {
        nextErrors.customAmountUnit = "กรุณาระบุหน่วยยา";
      }
    }

    if (!Number.isFinite(formData.frequencyPerDay) || formData.frequencyPerDay < 1) {
      nextErrors.frequencyPerDay = "ความถี่ต้องมากกว่าหรือเท่ากับ 1";
    } else if (formData.frequencyPerDay > MAX_FREQUENCY_PER_DAY) {
      nextErrors.frequencyPerDay = "ความถี่ต่อวันต้องไม่เกิน 4 ครั้ง";
    }

    if (formData.medicationType === "ชั่วคราว") {
      if (!formData.startDate.trim()) {
        nextErrors.startDate = "กรุณาระบุวันเริ่ม";
      }

      if (!formData.endDate.trim()) {
        nextErrors.endDate = "กรุณาระบุวันสิ้นสุด";
      }

      const startDate = parseDateInput(formData.startDate);
      const endDate = parseDateInput(formData.endDate);

      if (formData.startDate.trim() && !startDate) {
        nextErrors.startDate = "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD หรือ DD/MM/YYYY)";
      }

      if (formData.endDate.trim() && !endDate) {
        nextErrors.endDate = "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD หรือ DD/MM/YYYY)";
      }

      if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
        nextErrors.endDate = "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [amountUnitOption, formData]);

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
    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      medicationName: formData.medicationName.trim(),
      dosage: formData.dosage.trim(),
      amount: formData.amount.trim(),
      amountUnit: formData.amountUnit.trim(),
      note: formData.note.trim(),
      frequencyPerDay: Math.min(MAX_FREQUENCY_PER_DAY, Math.max(1, Math.floor(formData.frequencyPerDay))),
    });
    onClose();
  };

  const handleAmountUnitSelect = (value: string) => {
    setAmountUnitOption(value);
    clearFieldError("amountUnit");
    clearFieldError("customAmountUnit");

    if (value === OTHER_UNIT_VALUE) {
      updateField("amountUnit", "");
      return;
    }

    updateField("amountUnit", value);
  };

  const adjustFrequency = (delta: number) => {
    updateField("frequencyPerDay", Math.min(MAX_FREQUENCY_PER_DAY, Math.max(1, formData.frequencyPerDay + delta)));
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
                onChange={(e) => updateField("medicationName", e.target.value)}
                className={baseInputClassName}
                required
              />
              {errors.medicationName ? <p className="mt-1 text-xs text-red-500">{errors.medicationName}</p> : null}
            </div>

            {/* Dosage */}
            <div>
              <label htmlFor="edit-med-dosage" className="block text-sm font-medium text-gray-700 mb-1">
                ขนาดยา (Dosage) <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-med-dosage"
                type="text"
                placeholder="เช่น 500 mg"
                value={formData.dosage}
                onChange={(e) => updateField("dosage", e.target.value)}
                className={baseInputClassName}
                required
              />
              <p className="mt-1 text-xs text-gray-500">รองรับหน่วย: mcg, mg, g, kg, mL, L, IU</p>
              {errors.dosage ? <p className="mt-1 text-xs text-red-500">{errors.dosage}</p> : null}
            </div>

            {/* Amount + Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-med-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนต่อครั้ง <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-med-amount"
                  type="text"
                  placeholder="เช่น 1"
                  value={formData.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                  className={baseInputClassName}
                  required
                />
                {errors.amount ? <p className="mt-1 text-xs text-red-500">{errors.amount}</p> : null}
              </div>
              <div>
                <label htmlFor="edit-med-amount-unit" className="block text-sm font-medium text-gray-700 mb-1">
                  หน่วย <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-med-amount-unit"
                  value={amountUnitOption}
                  onChange={(e) => handleAmountUnitSelect(e.target.value)}
                  className={baseSelectClassName}
                >
                  {STANDARD_AMOUNT_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                  <option value={OTHER_UNIT_VALUE}>อื่นๆ</option>
                </select>
                {amountUnitOption === OTHER_UNIT_VALUE ? (
                  <input
                    type="text"
                    placeholder="ระบุหน่วยยา"
                    value={formData.amountUnit}
                    onChange={(e) => updateField("amountUnit", e.target.value)}
                    className={`mt-2 ${baseInputClassName}`}
                  />
                ) : null}
                {errors.amountUnit || errors.customAmountUnit ? (
                  <p className="mt-1 text-xs text-red-500">{errors.customAmountUnit || errors.amountUnit}</p>
                ) : null}
              </div>
            </div>

            {/* Frequency Per Day */}
            <div>
              <label htmlFor="edit-med-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                ความถี่ต่อวัน (ครั้ง/วัน) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustFrequency(-1)}
                  disabled={formData.frequencyPerDay <= 1}
                  className="h-10 w-10 rounded-lg border border-gray-300 text-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  aria-label="ลดความถี่"
                >
                  -
                </button>
                <input
                  id="edit-med-frequency"
                  type="number"
                  min={1}
                  max={MAX_FREQUENCY_PER_DAY}
                  step={1}
                  value={formData.frequencyPerDay}
                  onChange={(e) =>
                    updateField(
                      "frequencyPerDay",
                      Math.min(MAX_FREQUENCY_PER_DAY, Math.max(1, Number(e.target.value) || 1))
                    )
                  }
                  className={baseInputClassName}
                  required
                />
                <button
                  type="button"
                  onClick={() => adjustFrequency(1)}
                  disabled={formData.frequencyPerDay >= MAX_FREQUENCY_PER_DAY}
                  className="h-10 w-10 rounded-lg border border-gray-300 text-lg font-semibold text-gray-700 hover:bg-gray-50"
                  aria-label="เพิ่มความถี่"
                >
                  +
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {[1, 2, 3, 4].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField("frequencyPerDay", value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      formData.frequencyPerDay === value
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-black border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {value} ครั้ง
                  </button>
                ))}
              </div>
              {errors.frequencyPerDay ? <p className="mt-1 text-xs text-red-500">{errors.frequencyPerDay}</p> : null}
            </div>

            {/* Time of Day - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงเวลาให้ยา <span className="text-red-500">*</span>
                <span className="ml-1 text-xs text-gray-400 font-normal">(เลือกได้หลายช่วง)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ALL_TIME_SLOTS.map((slot) => {
                  const isSelected = formData.route.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? formData.route.filter((r) => r !== slot)
                          : [...formData.route, slot];
                        updateField("route", next.length > 0 ? next : [slot]);
                      }}
                      className={`flex flex-col items-center justify-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-black border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                        {getTimeOfDayIcon(slot)}
                      <span>{slot}</span>
                    </button>
                  );
                })}
              </div>
              {formData.route.length > 0 && (
                <p className="mt-1.5 text-xs text-blue-600">
                  เลือก: {formData.route.join(", ")}
                </p>
              )}
            </div>

            {/* Medication Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทยา <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="edit-medication-type"
                    checked={formData.medicationType === "ประจำ"}
                    onChange={() => updateField("medicationType", "ประจำ")}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">ประจำ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="edit-medication-type"
                    checked={formData.medicationType === "ชั่วคราว"}
                    onChange={() => updateField("medicationType", "ชั่วคราว")}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">ชั่วคราว</span>
                </label>
              </div>
            </div>

            {/* Administration Timing */}
            <div>
              <label htmlFor="edit-med-admin-timing" className="block text-sm font-medium text-gray-700 mb-1">
                เวลาให้ยา (Timing) <span className="text-red-500">*</span>
              </label>
              <select
                id="edit-med-admin-timing"
                value={formData.administrationTiming}
                onChange={(e) =>
                  updateField("administrationTiming", e.target.value as EditMedicationFormData["administrationTiming"])
                }
                className={baseSelectClassName}
              >
                <option value="ก่อนอาหาร">ก่อนอาหาร</option>
                <option value="หลังอาหาร">หลังอาหาร</option>
              </select>
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
                onChange={(e) => updateField("note", e.target.value)}
                rows={3}
                className={`${baseInputClassName} resize-none`}
              />
            </div>

            {/* Start and End Date - Only show when "ชั่วคราว" is selected */}
            {formData.medicationType === "ชั่วคราว" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันเริ่ม <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={parseDateInput(formData.startDate)}
                    onChange={(date) => updateField("startDate", date ? formatDateAsIso(date) : "")}
                    placeholder="DD/MM/YYYY"
                    className={fullWidthDatePickerClassName}
                  />
                  {errors.startDate ? <p className="mt-1 text-xs text-red-500">{errors.startDate}</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันสิ้นสุด <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={parseDateInput(formData.endDate)}
                    onChange={(date) => updateField("endDate", date ? formatDateAsIso(date) : "")}
                    placeholder="DD/MM/YYYY"
                    className={fullWidthDatePickerClassName}
                  />
                  {errors.endDate ? <p className="mt-1 text-xs text-red-500">{errors.endDate}</p> : null}
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
