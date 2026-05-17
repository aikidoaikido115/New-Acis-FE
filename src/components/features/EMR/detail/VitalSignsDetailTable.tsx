"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, ArrowUpDown, ArrowUp, ArrowDown, ArrowDownWideNarrow, Printer } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { vitalSignService } from "@/services/vital-sign.service";
import { laboratoryValueService } from "@/services/laboratory-value.service";
import type { LaboratoryValue } from "@/types/laboratory-value";
import type { VitalSign } from "@/types/vital-sign";

interface VitalSignsDetailTableProps {
  patientId: string;
  selectedDate: Date | null;
  patientName?: string;
  patientRoom?: string;
  patientStatus?: string;
}

const timeSlots = [
  { id: "all", label: "ทั้งหมด" },
  { id: "06", label: "06:00" },
  { id: "10", label: "10:00" },
  { id: "14", label: "14:00" },
  { id: "18", label: "18:00" },
  { id: "22", label: "22:00" },
];

const slotToTimeOfDay: Record<string, string> = {
  "06": "morning",
  "10": "late_morning",
  "14": "afternoon",
  "18": "evening",
  "22": "night",
};

const timeOfDayToSlot: Record<string, string> = {
  เช้า: "06",
  morning: "06",
  สาย: "10",
  late_morning: "10",
  สายๆ: "10",
  afternoon: "14",
  บ่าย: "14",
  บ่ายแก่: "14",
  เย็น: "18",
  evening: "18",
  กลางคืน: "22",
  night: "22",
};

const slotToLabel: Record<string, string> = {
  "06": "06:00",
  "10": "10:00",
  "14": "14:00",
  "18": "18:00",
  "22": "22:00",
};

type MatrixDraft = {
  temperature: string;
  heartRate: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  oxygenSaturation: string;
  breathingRate: string;
  bloodGlucose: string;
  fluidIn: string;
  fluidOut: string;
  urineOutput: string;
  urineType: "times" | "ml";
  stool: string;
  diaperChange: string;
};

type HistoryStatusFilter = "all" | "normal" | "abnormal";
type HistorySortOrder = "newest" | "oldest";
type SortField =
  | "temperature"
  | "heartRate"
  | "bloodPressure"
  | "oxygenSaturation"
  | "breathingRate"
  | "bloodGlucose"
  | "fluidIn"
  | "fluidOut"
  | "urineOutput"
  | "stool"
  | "diaperChange";
type SortDirection = "asc" | "desc";

type HistoryRow = {
  key: string;
  dateKey: string;
  slot: string;
  createdAt: string;
  vital: VitalSign | null;
  lab: LaboratoryValue | null;
};

const emptyDraft: MatrixDraft = {
  temperature: "",
  heartRate: "",
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  oxygenSaturation: "",
  breathingRate: "",
  bloodGlucose: "",
  fluidIn: "",
  fluidOut: "",
  urineOutput: "",
  urineType: "times",
  stool: "",
  diaperChange: "",
};

const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatThaiDate = (date: Date): string =>
  date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "2-digit" });

const normalizeDateKey = (raw?: string | null): string | null => {
  if (!raw) return null;

  const trimmed = raw.trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDateToISO(parsed);
};

const getRecordDateKey = (measurementDate?: string | null, createdAt?: string | null): string => {
  return normalizeDateKey(measurementDate) || normalizeDateKey(createdAt) || formatDateToISO(new Date());
};

const getRecordSlot = (timeOfDay?: string | null, createdAt?: string | null): string => {
  if (timeOfDay && timeOfDayToSlot[timeOfDay]) {
    return timeOfDayToSlot[timeOfDay];
  }

  if (createdAt) {
    const date = new Date(createdAt);
    if (!Number.isNaN(date.getTime())) {
      const hour = date.getHours();
      if (hour >= 4 && hour < 8) return "06";
      if (hour >= 8 && hour < 12) return "10";
      if (hour >= 12 && hour < 16) return "14";
      if (hour >= 16 && hour < 20) return "18";
      return "22";
    }
  }

  return "06";
};

const parseOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const toInteger = (value?: number): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.round(value);
};

const compareOptionalNumbers = (left?: number, right?: number): number => {
  const leftMissing = typeof left !== "number";
  const rightMissing = typeof right !== "number";

  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return 1;
  if (rightMissing) return -1;
  return left - right;
};

const buildDraftFromRecords = (vital?: VitalSign | null, lab?: LaboratoryValue | null): MatrixDraft => ({
  temperature: typeof vital?.temperature === "number" ? String(vital.temperature) : "",
  heartRate: typeof vital?.heart_rate === "number" ? String(vital.heart_rate) : "",
  bloodPressureSystolic:
    typeof vital?.blood_pressure_systolic === "number" ? String(vital.blood_pressure_systolic) : "",
  bloodPressureDiastolic:
    typeof vital?.blood_pressure_diastolic === "number" ? String(vital.blood_pressure_diastolic) : "",
  oxygenSaturation: typeof vital?.oxygen_saturation === "number" ? String(vital.oxygen_saturation) : "",
  breathingRate: typeof vital?.breathing_rate === "number" ? String(vital.breathing_rate) : "",
  bloodGlucose: typeof lab?.blood_glucose === "number" ? String(lab.blood_glucose) : "",
  fluidIn: typeof lab?.fluid_in === "number" ? String(lab.fluid_in) : "",
  fluidOut: typeof lab?.fluid_out === "number" ? String(lab.fluid_out) : "",
  urineOutput: typeof lab?.urine_output === "number" ? String(lab.urine_output) : "",
  urineType: lab?.urine_type === "ml" ? "ml" : "times",
  stool: typeof lab?.stool === "number" ? String(lab.stool) : "",
  diaperChange: typeof lab?.diaper_change === "number" ? String(lab.diaper_change) : "",
});

const applyFallbackToEmptyFields = (draft: MatrixDraft, fallback: MatrixDraft): MatrixDraft => {
  const next: MatrixDraft = { ...draft };
  const fillableKeys: Array<Exclude<keyof MatrixDraft, "urineType">> = [
    "temperature",
    "heartRate",
    "bloodPressureSystolic",
    "bloodPressureDiastolic",
    "oxygenSaturation",
    "breathingRate",
    "bloodGlucose",
    "fluidIn",
    "fluidOut",
    "urineOutput",
    "stool",
    "diaperChange",
  ];

  fillableKeys.forEach((key) => {
    if (next[key].trim() === "" && fallback[key].trim() !== "") {
      next[key] = fallback[key];
    }
  });

  if (next.urineOutput.trim() !== "" && draft.urineOutput.trim() === "") {
    next.urineType = fallback.urineType;
  }

  return next;
};

const isDraftEqual = (left: MatrixDraft, right: MatrixDraft): boolean => {
  return (
    left.temperature === right.temperature &&
    left.heartRate === right.heartRate &&
    left.bloodPressureSystolic === right.bloodPressureSystolic &&
    left.bloodPressureDiastolic === right.bloodPressureDiastolic &&
    left.oxygenSaturation === right.oxygenSaturation &&
    left.breathingRate === right.breathingRate &&
    left.bloodGlucose === right.bloodGlucose &&
    left.fluidIn === right.fluidIn &&
    left.fluidOut === right.fluidOut &&
    left.urineOutput === right.urineOutput &&
    left.urineType === right.urineType &&
    left.stool === right.stool &&
    left.diaperChange === right.diaperChange
  );
};

const hasAnyDraftValue = (draft: MatrixDraft): boolean => {
  return (
    draft.temperature.trim() !== "" ||
    draft.heartRate.trim() !== "" ||
    draft.bloodPressureSystolic.trim() !== "" ||
    draft.bloodPressureDiastolic.trim() !== "" ||
    draft.oxygenSaturation.trim() !== "" ||
    draft.breathingRate.trim() !== "" ||
    draft.bloodGlucose.trim() !== "" ||
    draft.fluidIn.trim() !== "" ||
    draft.fluidOut.trim() !== "" ||
    draft.urineOutput.trim() !== "" ||
    draft.stool.trim() !== "" ||
    draft.diaperChange.trim() !== ""
  );
};

const getAbnormalDraftKeys = (draft: MatrixDraft): Set<keyof MatrixDraft> => {
  const abnormalKeys = new Set<keyof MatrixDraft>();

  const temperature = parseOptionalNumber(draft.temperature);
  if (typeof temperature === "number" && (temperature < 35 || temperature > 37.5)) abnormalKeys.add("temperature");

  const heartRate = parseOptionalNumber(draft.heartRate);
  if (typeof heartRate === "number" && (heartRate < 60 || heartRate > 100)) abnormalKeys.add("heartRate");

  const breathingRate = parseOptionalNumber(draft.breathingRate);
  if (typeof breathingRate === "number" && (breathingRate < 12 || breathingRate > 20)) abnormalKeys.add("breathingRate");

  const bloodPressureSystolic = parseOptionalNumber(draft.bloodPressureSystolic);
  if (typeof bloodPressureSystolic === "number" && (bloodPressureSystolic < 90 || bloodPressureSystolic > 140)) abnormalKeys.add("bloodPressureSystolic");

  const bloodPressureDiastolic = parseOptionalNumber(draft.bloodPressureDiastolic);
  if (typeof bloodPressureDiastolic === "number" && (bloodPressureDiastolic < 60 || bloodPressureDiastolic > 90)) abnormalKeys.add("bloodPressureDiastolic");

  const oxygenSaturation = parseOptionalNumber(draft.oxygenSaturation);
  if (typeof oxygenSaturation === "number" && oxygenSaturation < 95) abnormalKeys.add("oxygenSaturation");

  const bloodGlucose = parseOptionalNumber(draft.bloodGlucose);
  if (typeof bloodGlucose === "number" && (bloodGlucose < 70 || bloodGlucose > 180)) abnormalKeys.add("bloodGlucose");

  const fluidIn = parseOptionalNumber(draft.fluidIn);
  if (typeof fluidIn === "number" && (fluidIn < 300 || fluidIn > 2500)) abnormalKeys.add("fluidIn");

  const fluidOut = parseOptionalNumber(draft.fluidOut);
  if (typeof fluidOut === "number" && (fluidOut < 200 || fluidOut > 2000)) abnormalKeys.add("fluidOut");

  const urineOutput = parseOptionalNumber(draft.urineOutput);
  if (typeof urineOutput === "number") {
    const isMl = draft.urineType === "ml";
    const abnormalUrine = isMl ? urineOutput < 150 || urineOutput > 2000 : urineOutput < 2 || urineOutput > 8;
    if (abnormalUrine) abnormalKeys.add("urineOutput");
  }

  const stool = parseOptionalNumber(draft.stool);
  if (typeof stool === "number" && stool > 3) abnormalKeys.add("stool");

  const diaperChange = parseOptionalNumber(draft.diaperChange);
  if (typeof diaperChange === "number" && diaperChange > 6) abnormalKeys.add("diaperChange");

  return abnormalKeys;
};

const isVitalAbnormal = (vital: VitalSign | null): boolean => {
  if (!vital) return false;

  const isAbnormalTemperature = typeof vital.temperature === "number" && (vital.temperature < 35 || vital.temperature > 37.5);
  const isAbnormalHeartRate = typeof vital.heart_rate === "number" && (vital.heart_rate < 60 || vital.heart_rate > 100);
  const isAbnormalBreathingRate = typeof vital.breathing_rate === "number" && (vital.breathing_rate < 12 || vital.breathing_rate > 20);
  const isAbnormalSystolic = typeof vital.blood_pressure_systolic === "number" && (vital.blood_pressure_systolic < 90 || vital.blood_pressure_systolic > 140);
  const isAbnormalDiastolic = typeof vital.blood_pressure_diastolic === "number" && (vital.blood_pressure_diastolic < 60 || vital.blood_pressure_diastolic > 90);
  const isAbnormalO2 = typeof vital.oxygen_saturation === "number" && vital.oxygen_saturation < 95;

  return isAbnormalTemperature || isAbnormalHeartRate || isAbnormalBreathingRate || isAbnormalSystolic || isAbnormalDiastolic || isAbnormalO2;
};

const isLabAbnormal = (lab: LaboratoryValue | null): boolean => {
  if (!lab) return false;

  if (typeof lab.blood_glucose === "number" && (lab.blood_glucose < 70 || lab.blood_glucose > 180)) return true;
  if (typeof lab.fluid_in === "number" && (lab.fluid_in < 300 || lab.fluid_in > 2500)) return true;
  if (typeof lab.fluid_out === "number" && (lab.fluid_out < 200 || lab.fluid_out > 2000)) return true;

  if (typeof lab.urine_output === "number") {
    const isMl = lab.urine_type === "ml";
    const abnormalUrine = isMl ? lab.urine_output < 150 || lab.urine_output > 2000 : lab.urine_output < 2 || lab.urine_output > 8;
    if (abnormalUrine) return true;
  }

  if (typeof lab.stool === "number" && lab.stool > 3) return true;
  if (typeof lab.diaper_change === "number" && lab.diaper_change > 6) return true;

  return false;
};

export function VitalSignsDetailTable({
  patientId,
  selectedDate,
  patientName,
  patientRoom,
  patientStatus,
}: VitalSignsDetailTableProps) {
  const { showToast } = useToast();

  const [selectedTime, setSelectedTime] = useState("06");
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>("newest");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showPreviousPlaceholder, setShowPreviousPlaceholder] = useState(false);
  const [printDateTime, setPrintDateTime] = useState<string>("");
  const [isPrintMode, setIsPrintMode] = useState(false);

  const [vitalHistory, setVitalHistory] = useState<VitalSign[]>([]);
  const [labHistory, setLabHistory] = useState<LaboratoryValue[]>([]);

  const [slotRecords, setSlotRecords] = useState<Record<string, { vital: VitalSign | null; lab: LaboratoryValue | null }>>({});
  const [slotDrafts, setSlotDrafts] = useState<Record<string, MatrixDraft>>({});
  const [slotInitialDrafts, setSlotInitialDrafts] = useState<Record<string, MatrixDraft>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSlotLoading, setIsSlotLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirmDialog();

  const effectiveDate = useMemo(() => selectedDate || new Date(), [selectedDate]);
  const selectedDateKey = useMemo(() => formatDateToISO(effectiveDate), [effectiveDate]);
  const currentSlotKey = useMemo(() => `${selectedDateKey}-${selectedTime}`, [selectedDateKey, selectedTime]);
  const isAllSlots = selectedTime === "all";

  const draft = useMemo(() => slotDrafts[currentSlotKey] || emptyDraft, [currentSlotKey, slotDrafts]);
  const initialDraft = useMemo(() => slotInitialDrafts[currentSlotKey] || emptyDraft, [currentSlotKey, slotInitialDrafts]);
  const selectedSlotVital = useMemo(() => slotRecords[currentSlotKey]?.vital || null, [currentSlotKey, slotRecords]);
  const selectedSlotLab = useMemo(() => slotRecords[currentSlotKey]?.lab || null, [currentSlotKey, slotRecords]);

  const hasUnsavedChanges = useMemo(() => !isDraftEqual(draft, initialDraft), [draft, initialDraft]);

  useEffect(() => {
    const handleBeforePrint = () => {
      const now = new Date();
      const thaiDate = formatThaiDate(now);
      const thaiTime = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setPrintDateTime(`${thaiDate} ${thaiTime}`);
      setIsPrintMode(true);
      document.body.classList.add("print-vital-signs");
    };

    const handleAfterPrint = () => {
      setIsPrintMode(false);
      document.body.classList.remove("print-vital-signs");
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const loadHistory = useCallback(async () => {
    if (!patientId) {
      setVitalHistory([]);
      setLabHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [vitalData, labData] = await Promise.all([
        vitalSignService.getHistory(patientId),
        laboratoryValueService.getHistory(patientId),
      ]);

      setVitalHistory(vitalData || []);
      setLabHistory(labData || []);
    } catch {
      setError("ไม่สามารถโหลดประวัติสัญญาณชีพ/แล็บได้");
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const loadSelectedSlot = useCallback(async () => {
    if (!patientId) {
      setSlotRecords({});
      setSlotDrafts({});
      setSlotInitialDrafts({});
      return;
    }

    if (isAllSlots) {
      return;
    }

    setIsSlotLoading(true);
    try {
      const [vitalOverview, labOverview] = await Promise.all([
        vitalSignService.getOverview({
          date: selectedDateKey,
          time_of_day: slotToTimeOfDay[selectedTime],
          page: 1,
          page_size: 300,
        }),
        laboratoryValueService.getOverview({
          date: selectedDateKey,
          time_of_day: slotToTimeOfDay[selectedTime],
          page: 1,
          page_size: 300,
        }),
      ]);

      const vital = vitalOverview.items.find((item) => item.resident_id === patientId) || null;
      const lab = labOverview.items.find((item) => item.resident_id === patientId) || null;
      const nextDraft = buildDraftFromRecords(vital, lab);

      setSlotRecords((prev) => ({
        ...prev,
        [currentSlotKey]: { vital, lab },
      }));

      setSlotInitialDrafts((prev) => ({
        ...prev,
        [currentSlotKey]: nextDraft,
      }));

      setSlotDrafts((prev) => {
        const existing = prev[currentSlotKey];
        if (existing) {
          return prev;
        }

        return {
          ...prev,
          [currentSlotKey]: nextDraft,
        };
      });
    } catch {
      showToast({
        type: "error",
        title: "โหลดข้อมูลไม่สำเร็จ",
        message: "ไม่สามารถโหลดข้อมูลสำหรับช่วงเวลาที่เลือกได้",
      });
    } finally {
      setIsSlotLoading(false);
    }
  }, [currentSlotKey, isAllSlots, patientId, selectedDateKey, selectedTime, showToast]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    void loadSelectedSlot();
  }, [loadSelectedSlot]);


  const historyRows = useMemo<HistoryRow[]>(() => {
    const merged = new Map<string, HistoryRow>();

    vitalHistory.forEach((vital) => {
      const dateKey = getRecordDateKey(vital.measurement_date, vital.created_at);
      const slot = getRecordSlot(vital.time_of_day, vital.created_at);
      const key = `${dateKey}-${slot}`;
      const current = merged.get(key);

      if (!current) {
        merged.set(key, {
          key,
          dateKey,
          slot,
          createdAt: vital.created_at,
          vital,
          lab: null,
        });
        return;
      }

      const updatedTime = new Date(vital.created_at).getTime() > new Date(current.createdAt).getTime()
        ? vital.created_at
        : current.createdAt;
      merged.set(key, { ...current, createdAt: updatedTime, vital });
    });

    labHistory.forEach((lab) => {
      const dateKey = getRecordDateKey(lab.measurement_date, lab.created_at);
      const slot = getRecordSlot(lab.time_of_day, lab.created_at);
      const key = `${dateKey}-${slot}`;
      const current = merged.get(key);

      if (!current) {
        merged.set(key, {
          key,
          dateKey,
          slot,
          createdAt: lab.created_at,
          vital: null,
          lab,
        });
        return;
      }

      const updatedTime = new Date(lab.created_at).getTime() > new Date(current.createdAt).getTime()
        ? lab.created_at
        : current.createdAt;
      merged.set(key, { ...current, createdAt: updatedTime, lab });
    });

    return Array.from(merged.values());
  }, [labHistory, vitalHistory]);

  const filteredRows = useMemo(() => {
    const byContext = isAllSlots
      ? historyRows.filter((row) => row.dateKey === selectedDateKey)
      : historyRows.filter((row) => row.dateKey === selectedDateKey && row.slot === selectedTime);

    const byStatus = byContext.filter((row) => {
      if (statusFilter === "all") return true;
      const abnormal = isVitalAbnormal(row.vital) || isLabAbnormal(row.lab);
      return statusFilter === "abnormal" ? abnormal : !abnormal;
    });

    return [...byStatus].sort((left, right) => {
      if (isAllSlots) {
        const leftSlot = Number(left.slot) || 0;
        const rightSlot = Number(right.slot) || 0;
        if (leftSlot !== rightSlot) {
          return leftSlot - rightSlot;
        }
      }

      if (!sortField) {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
      }

      let result = 0;
      switch (sortField) {
        case "temperature":
          result = compareOptionalNumbers(left.vital?.temperature ?? undefined, right.vital?.temperature ?? undefined);
          break;
        case "heartRate":
          result = compareOptionalNumbers(left.vital?.heart_rate ?? undefined, right.vital?.heart_rate ?? undefined);
          break;
        case "bloodPressure":
          result = compareOptionalNumbers(left.vital?.blood_pressure_systolic ?? undefined, right.vital?.blood_pressure_systolic ?? undefined);
          if (result === 0) {
            result = compareOptionalNumbers(left.vital?.blood_pressure_diastolic ?? undefined, right.vital?.blood_pressure_diastolic ?? undefined);
          }
          break;
        case "oxygenSaturation":
          result = compareOptionalNumbers(left.vital?.oxygen_saturation ?? undefined, right.vital?.oxygen_saturation ?? undefined);
          break;
        case "breathingRate":
          result = compareOptionalNumbers(left.vital?.breathing_rate ?? undefined, right.vital?.breathing_rate ?? undefined);
          break;
        case "bloodGlucose":
          result = compareOptionalNumbers(left.lab?.blood_glucose ?? undefined, right.lab?.blood_glucose ?? undefined);
          break;
        case "fluidIn":
          result = compareOptionalNumbers(left.lab?.fluid_in ?? undefined, right.lab?.fluid_in ?? undefined);
          break;
        case "fluidOut":
          result = compareOptionalNumbers(left.lab?.fluid_out ?? undefined, right.lab?.fluid_out ?? undefined);
          break;
        case "urineOutput":
          result = compareOptionalNumbers(left.lab?.urine_output ?? undefined, right.lab?.urine_output ?? undefined);
          break;
        case "stool":
          result = compareOptionalNumbers(left.lab?.stool ?? undefined, right.lab?.stool ?? undefined);
          break;
        case "diaperChange":
          result = compareOptionalNumbers(left.lab?.diaper_change ?? undefined, right.lab?.diaper_change ?? undefined);
          break;
        default:
          result = 0;
      }

      if (result === 0) {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [historyRows, isAllSlots, selectedDateKey, selectedTime, statusFilter, sortField, sortDirection, sortOrder]);

  const printRows = useMemo(() => {
    const byDate = historyRows.filter((row) => row.dateKey === selectedDateKey);
    const rowMap = new Map(byDate.map((row) => [row.slot, row] as const));

    const baseRows = timeSlots.filter((slot) => slot.id !== "all").map((slot) => {
      const existing = rowMap.get(slot.id);
      if (existing) return existing;
      return {
        key: `${selectedDateKey}-${slot.id}`,
        dateKey: selectedDateKey,
        slot: slot.id,
        createdAt: `${selectedDateKey}T00:00:00+07:00`,
        vital: null,
        lab: null,
      } as HistoryRow;
    });

    return baseRows.sort((left, right) => (Number(left.slot) || 0) - (Number(right.slot) || 0));
  }, [historyRows, selectedDateKey]);

  const daySummary = useMemo(() => {
    const dayRows = historyRows.filter((row) => row.dateKey === selectedDateKey);

    let intake = 0;
    let urineMl = 0;
    let urineTimes = 0;
    let stool = 0;
    let diaper = 0;

    dayRows.forEach((row) => {
      const lab = row.lab;
      if (!lab) {
        return;
      }

      if (typeof lab.fluid_in === "number") intake += lab.fluid_in;
      if (typeof lab.stool === "number") stool += lab.stool;
      if (typeof lab.diaper_change === "number") diaper += lab.diaper_change;

      if (typeof lab.urine_output === "number") {
        if (lab.urine_type === "ml") {
          urineMl += lab.urine_output;
        } else {
          urineTimes += lab.urine_output;
        }
      }
    });

    return {
      intake,
      urineMl,
      urineTimes,
      stool,
      diaper,
    };
  }, [historyRows, selectedDateKey]);

  const abnormalDraftKeys = useMemo(() => getAbnormalDraftKeys(draft), [draft]);
  const hasPersisted = useMemo(() => Boolean(selectedSlotVital || selectedSlotLab), [selectedSlotVital, selectedSlotLab]);
  const previousSlotDraft = useMemo(() => {
    if (isAllSlots) {
      return emptyDraft;
    }

    const currentSlotRank = Number(selectedTime) || Number.POSITIVE_INFINITY;
    let latest: HistoryRow | undefined;
    let latestCreatedAt = Number.NEGATIVE_INFINITY;

    for (const row of historyRows) {
      if (row.dateKey !== selectedDateKey) {
        continue;
      }

      const rowSlotRank = Number(row.slot) || Number.POSITIVE_INFINITY;
      if (rowSlotRank >= currentSlotRank) {
        continue;
      }

      const createdAt = new Date(row.createdAt).getTime();
      if (createdAt > latestCreatedAt) {
        latestCreatedAt = createdAt;
        latest = row;
      }
    }

    if (!latest) {
      return emptyDraft;
    }

    return buildDraftFromRecords(latest.vital, latest.lab);
  }, [historyRows, isAllSlots, selectedDateKey, selectedTime]);
  const hasPreviousSlotValue = useMemo(() => hasAnyDraftValue(previousSlotDraft), [previousSlotDraft]);

  const inputClassName = "w-[54px] rounded border border-gray-300 bg-white px-1.5 py-1 text-center text-[11px] text-gray-900 focus:border-blue-500 focus:outline-none";
  const abnormalInputClassName = "w-[54px] rounded border border-rose-400 bg-rose-50 px-1.5 py-1 text-center text-[11px] text-rose-700 focus:border-rose-500 focus:outline-none";
  const getInputClassName = (isAbnormal: boolean) => (isAbnormal ? abnormalInputClassName : inputClassName);

  const asText = (value?: number | null) => (value === null || typeof value === "undefined" ? "-" : String(value));

  const asBloodPressure = (systolic?: number | null, diastolic?: number | null) => {
    if (typeof systolic !== "number" || typeof diastolic !== "number") return "-";
    return `${systolic}/${diastolic}`;
  };

  const isAbnormalTemperature = (temperature?: number | null) => typeof temperature === "number" && (temperature < 35 || temperature > 37.5);
  const isAbnormalPressure = (systolic?: number | null, diastolic?: number | null) => {
    if (typeof systolic !== "number" || typeof diastolic !== "number") return false;
    return systolic < 90 || systolic > 140 || diastolic < 60 || diastolic > 90;
  };

  const handleDraftChange = (key: keyof MatrixDraft, value: string) => {
    setSlotDrafts((prev) => ({
      ...prev,
      [currentSlotKey]: {
        ...(prev[currentSlotKey] || emptyDraft),
        [key]: value,
      },
    }));
  };

  const getDraftPlaceholder = (key: keyof MatrixDraft): string => {
    if (!showPreviousPlaceholder || draft[key].trim() !== "") {
      return "";
    }

    return previousSlotDraft[key];
  };

  const handlePullPrevious = () => {
    if (isAllSlots) {
      return;
    }

    if (!hasPreviousSlotValue) {
      showToast({
        type: "info",
        title: "ไม่มีข้อมูลก่อนหน้า",
        message: "ไม่พบค่าวัดล่าสุดของวันเดียวกันในช่วงเวลาก่อนหน้านี้",
      });
      return;
    }

    const mergedDraft = applyFallbackToEmptyFields(draft, previousSlotDraft);
    if (isDraftEqual(draft, mergedDraft)) {
      showToast({
        type: "info",
        title: "ไม่มีช่องว่างให้เติม",
        message: "ช่องที่มีข้อมูลอยู่แล้วจะไม่ถูกแทนที่",
      });
      return;
    }

    setSlotDrafts((prev) => ({
      ...prev,
      [currentSlotKey]: mergedDraft,
    }));

    showToast({
      type: "success",
      title: "ดึงค่าก่อนหน้าสำเร็จ",
      message: "เติมค่าล่าสุดของวันเดียวกันลงในช่องที่ยังว่างแล้ว",
    });
  };

  const handleSave = async () => {
    const temperature = parseOptionalNumber(draft.temperature);
    const heartRate = parseOptionalNumber(draft.heartRate);
    const bloodPressureSystolic = parseOptionalNumber(draft.bloodPressureSystolic);
    const bloodPressureDiastolic = parseOptionalNumber(draft.bloodPressureDiastolic);
    const oxygenSaturation = parseOptionalNumber(draft.oxygenSaturation);
    const breathingRate = parseOptionalNumber(draft.breathingRate);

    const bloodGlucose = parseOptionalNumber(draft.bloodGlucose);
    const fluidIn = parseOptionalNumber(draft.fluidIn);
    const fluidOut = parseOptionalNumber(draft.fluidOut);
    const urineOutput = parseOptionalNumber(draft.urineOutput);
    const stool = parseOptionalNumber(draft.stool);
    const diaperChange = parseOptionalNumber(draft.diaperChange);

    const hasVitalValue =
      typeof temperature === "number" ||
      typeof heartRate === "number" ||
      typeof breathingRate === "number" ||
      typeof bloodPressureSystolic === "number" ||
      typeof bloodPressureDiastolic === "number" ||
      typeof oxygenSaturation === "number";

    const hasLabValue =
      typeof bloodGlucose === "number" ||
      typeof fluidIn === "number" ||
      typeof fluidOut === "number" ||
      typeof urineOutput === "number" ||
      typeof stool === "number" ||
      typeof diaperChange === "number";

    if (!hasVitalValue && !hasLabValue) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "กรอกข้อมูลอย่างน้อย 1 ค่า ก่อนบันทึก" });
      return;
    }

    const hasSystolic = typeof bloodPressureSystolic === "number";
    const hasDiastolic = typeof bloodPressureDiastolic === "number";
    if ((hasSystolic && !hasDiastolic) || (!hasSystolic && hasDiastolic)) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "ความดันต้องกรอกค่าบนและค่าล่างให้ครบคู่" });
      return;
    }

    setIsSaving(true);
    try {
      const vitalPayload = {
        temperature,
        heart_rate: toInteger(heartRate),
        breathing_rate: toInteger(breathingRate),
        blood_pressure_systolic: toInteger(bloodPressureSystolic),
        blood_pressure_diastolic: toInteger(bloodPressureDiastolic),
        oxygen_saturation: toInteger(oxygenSaturation),
      };

      const labPayload = {
        blood_glucose: bloodGlucose,
        fluid_in: fluidIn,
        fluid_out: fluidOut,
        urine_output: urineOutput,
        urine_type: typeof urineOutput === "number" ? draft.urineType : undefined,
        stool: toInteger(stool),
        diaper_change: toInteger(diaperChange),
      };

      if (hasVitalValue) {
        if (selectedSlotVital?.vital_sign_id) {
          await vitalSignService.updateById(selectedSlotVital.vital_sign_id, vitalPayload);
        } else {
          await vitalSignService.create({
            resident_id: patientId,
            date: selectedDateKey,
            time_of_day: slotToTimeOfDay[selectedTime],
            ...vitalPayload,
          });
        }
      }

      if (hasLabValue) {
        if (selectedSlotLab?.laboratory_value_id) {
          await laboratoryValueService.updateById(selectedSlotLab.laboratory_value_id, labPayload);
        } else {
          await laboratoryValueService.create({
            resident_id: patientId,
            date: selectedDateKey,
            time_of_day: slotToTimeOfDay[selectedTime],
            ...labPayload,
          });
        }
      }

      setSlotDrafts((prev) => ({
        ...prev,
        [currentSlotKey]: draft,
      }));
      setSlotInitialDrafts((prev) => ({
        ...prev,
        [currentSlotKey]: draft,
      }));

      await Promise.all([loadSelectedSlot(), loadHistory()]);
      showToast({ type: "success", title: "บันทึกสำเร็จ", message: "บันทึกข้อมูลสัญญาณชีพเรียบร้อยแล้ว" });
    } catch (err) {
      showToast({
        type: "error",
        title: "บันทึกไม่สำเร็จ",
        message: err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTimeSlot = async (nextTime: string) => {
    if (nextTime === selectedTime) return;

    if (hasUnsavedChanges) {
      const confirmed = await confirm({
        title: "ยืนยันการเปลี่ยนช่วงเวลา",
        message: "มีข้อมูลที่ยังไม่บันทึก ต้องการเปลี่ยนช่วงเวลาและละทิ้งการแก้ไขหรือไม่?",
        confirmText: "เปลี่ยนเวลา",
        cancelText: "กลับไปแก้ไข",
      });
      if (!confirmed) return;

      setSlotDrafts((prev) => ({
        ...prev,
        [currentSlotKey]: slotInitialDrafts[currentSlotKey] || emptyDraft,
      }));
    }

    setSelectedTime(nextTime);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void handleSave();
  };

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
      return;
    }
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getSortLabel = (field: SortField | null): string => {
    if (!field) {
      return sortOrder === "newest" ? "เวลาบันทึก (ล่าสุดก่อน)" : "เวลาบันทึก (เก่าก่อน)";
    }

    const labels: Record<SortField, string> = {
      temperature: "อุณหภูมิ",
      heartRate: "ชีพจร",
      bloodPressure: "ความดัน",
      oxygenSaturation: "O2",
      breathingRate: "หายใจ",
      bloodGlucose: "น้ำตาล",
      fluidIn: "น้ำเข้า",
      fluidOut: "น้ำออก",
      urineOutput: "ปัสสาวะ",
      stool: "อุจจาระ",
      diaperChange: "ผ้าอ้อม",
    };

    return labels[field];
  };

  const sortIndicator = (field: SortField): string => {
    if (sortField !== field) return "-";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handleExport = () => {
    const now = new Date();
    const thaiDate = formatThaiDate(now);
    const thaiTime = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setPrintDateTime(`${thaiDate} ${thaiTime}`);
    setIsPrintMode(true);
    document.body.classList.add("print-vital-signs");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  const renderSortableHeader = (label: string, field: SortField, className: string) => {
    const isActive = sortField === field;

    return (
      <th className={className} style={{ color: "rgba(126, 143, 164, 1)" }}>
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`mx-auto inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] font-semibold transition-colors ${
            isActive
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
          }`}
          title={`เรียงตาม${label}`}
        >
          <span>{label}</span>
          {isActive ? (
            sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5" />
          )}
          <span className={`text-[10px] ${isActive ? "text-blue-700" : "text-slate-400"}`}>{sortIndicator(field)}</span>
        </button>
      </th>
    );
  };

  const statusFilterLabel =
    statusFilter === "normal" ? "ค่าปกติ" : statusFilter === "abnormal" ? "ค่าผิดปกติ" : "ทั้งหมด";
  const reportDateLabel = formatThaiDate(effectiveDate);
  const displayRows = isPrintMode ? printRows : filteredRows;
  const selectedTimeLabel =
    selectedTime === "all" ? "ทั้งหมด" : timeSlots.find((slot) => slot.id === selectedTime)?.label || "-";

  return (
    <div className="print-root p-6 space-y-4">
      <div className="print-only rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">รายงานสัญญาณชีพรายบุคคล</h2>
            <p className="text-xs text-slate-500">พิมพ์เมื่อ: {printDateTime || "-"}</p>
            <p className="text-xs text-slate-600">
              {patientName ? `ผู้พัก: ${patientName}` : ""}
              {patientRoom ? ` · ${patientRoom}` : ""}
              {patientStatus ? ` · ${patientStatus}` : ""}
            </p>
          </div>
          <div className="text-xs text-slate-600 text-right">
            <div>วันที่ข้อมูล: {reportDateLabel}</div>
            <div>ช่วงเวลา: {selectedTimeLabel}</div>
            <div>สถานะ: {statusFilterLabel}</div>
            <div>เรียงตาม: {isPrintMode ? "ช่วงเวลา" : getSortLabel(sortField)}</div>
          </div>
        </div>
      </div>

      <div className="print-hide space-y-3 w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 scrollbar-none">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => void handleSelectTimeSlot(slot.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  selectedTime === slot.id
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {slot.label}
              </button>
            ))}
          </div>
          
          {!isAllSlots ? (
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreviousPlaceholder((prev) => !prev)}
                className={`rounded border px-3 py-1.5 text-xs font-medium ${
                  showPreviousPlaceholder
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {showPreviousPlaceholder ? "ซ่อนค่าก่อนหน้าในช่องว่าง" : "แสดงค่าก่อนหน้าในช่องว่าง"}
              </button>
              <button
                type="button"
                onClick={handlePullPrevious}
                disabled={isSlotLoading || !hasPreviousSlotValue}
                className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
              >
                ดึงค่าก่อนหน้า
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown
              options={[
                { value: "all", label: "สถานะทั้งหมด" },
                { value: "normal", label: "ค่าปกติ" },
                { value: "abnormal", label: "ค่าผิดปกติ" },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as HistoryStatusFilter)}
              className="w-32 sm:w-36"
            />

            <Dropdown
              options={[
                { value: "recordedAt", label: "เวลาบันทึก" },
                { value: "temperature", label: "อุณหภูมิ" },
                { value: "heartRate", label: "ชีพจร" },
                { value: "bloodPressure", label: "ความดัน" },
                { value: "oxygenSaturation", label: "O2" },
                { value: "breathingRate", label: "หายใจ" },
                { value: "bloodGlucose", label: "น้ำตาล" },
                { value: "fluidIn", label: "น้ำเข้า" },
                { value: "fluidOut", label: "น้ำออก" },
                { value: "urineOutput", label: "ปัสสาวะ" },
                { value: "stool", label: "อุจจาระ" },
                { value: "diaperChange", label: "ผ้าอ้อม" },
              ]}
              value={sortField ?? "recordedAt"}
              onChange={(next) => {
                if (next === "recordedAt") {
                  setSortField(null);
                  return;
                }
                setSortField(next as SortField);
                setSortDirection("asc");
              }}
              className="w-32 sm:w-36"
            />

            <button
              type="button"
              onClick={() => {
                if (sortField) {
                  setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                  return;
                }
                setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            >
              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
              {sortField ? (sortDirection === "asc" ? "น้อยไปมาก" : "มากไปน้อย") : sortOrder === "newest" ? "ล่าสุดก่อน" : "เก่าก่อน"}
            </button>

            <div className="hidden sm:flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
              <span>กำลังเรียงตาม:</span>
              <span className="font-semibold text-slate-900">{isPrintMode ? "ช่วงเวลา" : getSortLabel(sortField)}</span>
              {sortField ? (
                sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-blue-700" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-700" />
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start xl:justify-end gap-2 w-full xl:w-auto mt-2 xl:mt-0">
            {!isAllSlots ? (
              <div className="flex lg:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviousPlaceholder((prev) => !prev)}
                  className={`rounded border px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium ${
                    showPreviousPlaceholder
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {showPreviousPlaceholder ? "ซ่อนค่าก่อนหน้า" : "แสดงค่าก่อนหน้า"}
                </button>
                <button
                  type="button"
                  onClick={handlePullPrevious}
                  disabled={isSlotLoading || !hasPreviousSlotValue}
                  className="rounded border border-amber-300 bg-amber-50 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                >
                  ดึงค่าก่อนหน้า
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleExport}
              className="print-hide inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#0093EF] px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold text-white shadow-sm hover:bg-[#0080D0] shrink-0"
            >
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">พิมพ์ / Export PDF</span>
              <span className="sm:hidden">Print PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="print-table hidden xl:block overflow-hidden rounded-lg" style={{ border: "1px solid rgba(103, 103, 103, 0.48)" }}>
        <div className="overflow-x-auto">
          <table className="table-fixed w-full">
            <thead>
              <tr style={{ backgroundColor: "rgba(239, 242, 247, 1)", borderBottom: "1px solid rgba(103, 103, 103, 0.48)" }}>
                <th className="w-[170px] text-left py-3 px-2 text-[11px] font-semibold" style={{ color: "rgba(126, 143, 164, 1)" }}>เวลา/สถานะ</th>
                {renderSortableHeader("อุณหภูมิ", "temperature", "w-16 text-center py-3 px-1")}
                {renderSortableHeader("ชีพจร", "heartRate", "w-16 text-center py-3 px-1")}
                {renderSortableHeader("ความดัน", "bloodPressure", "w-[124px] text-center py-3 px-1")}
                {renderSortableHeader("O2", "oxygenSaturation", "w-16 text-center py-3 px-1")}
                {renderSortableHeader("หายใจ", "breathingRate", "w-16 text-center py-3 px-1")}
                {renderSortableHeader("น้ำตาล", "bloodGlucose", "w-16 text-center py-3 px-1")}
                {renderSortableHeader("น้ำเข้า", "fluidIn", "w-16 text-center py-3 px-1")}
                {renderSortableHeader("น้ำออก", "fluidOut", "w-16 text-center py-3 px-1")}
                {renderSortableHeader("ปัสสาวะ", "urineOutput", "w-[94px] text-center py-3 px-1")}
                {renderSortableHeader("อุจจาระ", "stool", "w-16 text-center py-3 px-1")}
                {renderSortableHeader("ผ้าอ้อม", "diaperChange", "w-16 text-center py-3 px-1")}
                {!isAllSlots ? (
                  <th className="w-[120px] text-center py-3 px-2 text-[11px] font-semibold" style={{ color: "rgba(126, 143, 164, 1)" }}>จัดการ</th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {!isAllSlots ? (
                <tr className="print-hide bg-blue-50" style={{ borderBottom: "1px solid rgba(103, 103, 103, 0.48)" }}>
                <td className="py-3 px-2 text-[11px] text-gray-900">
                  <p className="font-medium">แถวบันทึก {timeSlots.find((slot) => slot.id === selectedTime)?.label}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ${hasPersisted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {hasPersisted ? "มีข้อมูลแล้ว" : "ยังไม่เคยบันทึก"}
                    </span>
                    {abnormalDraftKeys.size > 0 ? <span className="text-[9px] text-rose-600">มีค่าผิดปกติ</span> : null}
                    {hasUnsavedChanges ? <span className="text-[9px] text-amber-600">ยังไม่บันทึก</span> : null}
                    {isSlotLoading ? <LoadingSpinner /> : null}
                  </div>
                </td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("temperature")} value={draft.temperature} onChange={(event) => handleDraftChange("temperature", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("temperature"))} /></td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("heartRate")} value={draft.heartRate} onChange={(event) => handleDraftChange("heartRate", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("heartRate"))} /></td>
                <td className="py-2 px-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("bloodPressureSystolic")} value={draft.bloodPressureSystolic} onChange={(event) => handleDraftChange("bloodPressureSystolic", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("bloodPressureSystolic"))} />
                    <span className="text-[10px] text-gray-400">/</span>
                    <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("bloodPressureDiastolic")} value={draft.bloodPressureDiastolic} onChange={(event) => handleDraftChange("bloodPressureDiastolic", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("bloodPressureDiastolic"))} />
                  </div>
                </td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("oxygenSaturation")} value={draft.oxygenSaturation} onChange={(event) => handleDraftChange("oxygenSaturation", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("oxygenSaturation"))} /></td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("breathingRate")} value={draft.breathingRate} onChange={(event) => handleDraftChange("breathingRate", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("breathingRate"))} /></td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("bloodGlucose")} value={draft.bloodGlucose} onChange={(event) => handleDraftChange("bloodGlucose", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("bloodGlucose"))} /></td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("fluidIn")} value={draft.fluidIn} onChange={(event) => handleDraftChange("fluidIn", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("fluidIn"))} /></td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("fluidOut")} value={draft.fluidOut} onChange={(event) => handleDraftChange("fluidOut", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("fluidOut"))} /></td>
                <td className="py-2 px-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("urineOutput")} value={draft.urineOutput} onChange={(event) => handleDraftChange("urineOutput", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("urineOutput"))} />
                    <button type="button" onClick={() => handleDraftChange("urineType", draft.urineType === "times" ? "ml" : "times")} className="rounded border border-gray-300 bg-white px-1.5 py-1 text-[9px] text-gray-600 hover:bg-gray-50" title="สลับหน่วยปัสสาวะ">
                      {draft.urineType === "times" ? "ครั้ง" : "มล."}
                    </button>
                  </div>
                </td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("stool")} value={draft.stool} onChange={(event) => handleDraftChange("stool", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("stool"))} /></td>
                <td className="py-2 px-1 text-center"><input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("diaperChange")} value={draft.diaperChange} onChange={(event) => handleDraftChange("diaperChange", event.target.value)} onKeyDown={handleInputKeyDown} className={getInputClassName(abnormalDraftKeys.has("diaperChange"))} /></td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePullPrevious}
                      disabled={isSaving || isSlotLoading || !hasPreviousSlotValue}
                      className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                    >
                      ดึงค่าก่อนหน้า
                    </button>
                    <button type="button" onClick={() => void handleSave()} disabled={isSaving || isSlotLoading || !hasUnsavedChanges} className="rounded bg-blue-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-600 disabled:opacity-60">
                      {isSaving ? "กำลังบันทึก" : "บันทึก"}
                    </button>
                  </div>
                </td>
              </tr>
              ) : null}

              {isLoading ? (
                <tr>
                  <td colSpan={isAllSlots ? 12 : 13} className="py-6 px-4 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isAllSlots ? 12 : 13} className="py-6 px-4 text-center text-sm text-red-500">{error}</td>
                </tr>
              ) : displayRows.length === 0 ? (
                <tr>
                  <td colSpan={isAllSlots ? 12 : 13} className="py-12 px-4 text-center">
                    <div className="text-sm text-gray-600">ไม่พบข้อมูลสัญญาณชีพในช่วงเวลานี้</div>
                    <div className="text-xs text-gray-400 mt-1">สามารถกรอกแถวด้านบนเพื่อบันทึกข้อมูลใหม่ได้</div>
                  </td>
                </tr>
              ) : (
                displayRows.map((row) => {
                  const displayDateText = row.dateKey;
                  const displayTimeText = slotToLabel[row.slot] || row.slot;

                  return (
                    <tr key={row.key} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid rgba(103, 103, 103, 0.48)" }}>
                      <td className="py-3 px-2 text-[11px] text-gray-900">{displayDateText} {displayTimeText}</td>
                      <td className={`py-2 px-2 text-center text-xs ${isAbnormalTemperature(row.vital?.temperature) ? "text-red-500 font-medium" : "text-gray-900"}`}>{asText(row.vital?.temperature)}</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-900">{asText(row.vital?.heart_rate)}</td>
                      <td className={`py-2 px-2 text-center text-xs ${isAbnormalPressure(row.vital?.blood_pressure_systolic, row.vital?.blood_pressure_diastolic) ? "text-red-500 font-medium" : "text-gray-900"}`}>{asBloodPressure(row.vital?.blood_pressure_systolic, row.vital?.blood_pressure_diastolic)}</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-900">{asText(row.vital?.oxygen_saturation)}</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-900">{asText(row.vital?.breathing_rate)}</td>
                      <td className={`py-2 px-2 text-center text-xs ${(typeof row.lab?.blood_glucose === "number" && (row.lab.blood_glucose < 70 || row.lab.blood_glucose > 180)) ? "text-red-500 font-medium" : "text-gray-900"}`}>{asText(row.lab?.blood_glucose)}</td>
                      <td className={`py-2 px-2 text-center text-xs ${(typeof row.lab?.fluid_in === "number" && (row.lab.fluid_in < 300 || row.lab.fluid_in > 2500)) ? "text-red-500 font-medium" : "text-gray-900"}`}>{asText(row.lab?.fluid_in)}</td>
                      <td className={`py-2 px-2 text-center text-xs ${(typeof row.lab?.fluid_out === "number" && (row.lab.fluid_out < 200 || row.lab.fluid_out > 2000)) ? "text-red-500 font-medium" : "text-gray-900"}`}>{asText(row.lab?.fluid_out)}</td>
                      <td className={`py-2 px-2 text-center text-xs ${(typeof row.lab?.urine_output === "number" && ((row.lab.urine_type === "ml" ? row.lab.urine_output < 150 || row.lab.urine_output > 2000 : row.lab.urine_output < 2 || row.lab.urine_output > 8))) ? "text-red-500 font-medium" : "text-gray-900"}`}>
                        {typeof row.lab?.urine_output === "number" ? `${row.lab.urine_output}${row.lab?.urine_type === "ml" ? " มล." : " ครั้ง"}` : "-"}
                      </td>
                      <td className={`py-2 px-2 text-center text-xs ${(typeof row.lab?.stool === "number" && row.lab.stool > 3) ? "text-red-500 font-medium" : "text-gray-900"}`}>{asText(row.lab?.stool)}</td>
                      <td className={`py-2 px-2 text-center text-xs ${(typeof row.lab?.diaper_change === "number" && row.lab.diaper_change > 6) ? "text-red-500 font-medium" : "text-gray-900"}`}>{asText(row.lab?.diaper_change)}</td>
                      {!isAllSlots ? <td className="py-2 px-2 text-center text-xs text-gray-400">-</td> : null}
                    </tr>
                  );
                })
              )}

              <tr className="bg-slate-50 font-semibold" style={{ borderTop: "1px solid rgba(103, 103, 103, 0.48)" }}>
                <td className="py-3 px-2 text-[11px] text-gray-700" colSpan={7}>ผลรวมต่อวัน ({selectedDateKey})</td>
                <td className="py-3 px-2 text-center text-[11px] text-gray-700">{daySummary.intake || "-"}</td>
                <td className="py-3 px-2 text-center text-[11px] text-gray-500">-</td>
                <td className="py-3 px-2 text-center text-[11px] text-gray-700">{daySummary.urineMl > 0 || daySummary.urineTimes > 0 ? `${daySummary.urineMl || 0} มล. / ${daySummary.urineTimes || 0} ครั้ง` : "-"}</td>
                <td className="py-3 px-2 text-center text-[11px] text-gray-700">{daySummary.stool || "-"}</td>
                <td className="py-3 px-2 text-center text-[11px] text-gray-700">{daySummary.diaper || "-"}</td>
                {!isAllSlots ? <td className="py-3 px-2 text-center text-[11px] text-gray-500">-</td> : null}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="print-hide xl:hidden space-y-3">
        <div className="rounded-lg border border-gray-300 bg-blue-50 px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">แถวบันทึก {timeSlots.find((slot) => slot.id === selectedTime)?.label}</p>
            <div className="flex flex-wrap items-center gap-1">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${hasPersisted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{hasPersisted ? "มีข้อมูลแล้ว" : "ยังไม่เคยบันทึก"}</span>
              {hasUnsavedChanges ? <span className="text-[10px] text-amber-600">ยังไม่บันทึก</span> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-gray-600">อุณหภูมิ <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("temperature")} value={draft.temperature} onChange={(event) => handleDraftChange("temperature", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("temperature"))}`} /></label>
            <label className="text-[11px] text-gray-600">ชีพจร <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("heartRate")} value={draft.heartRate} onChange={(event) => handleDraftChange("heartRate", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("heartRate"))}`} /></label>
            <label className="text-[11px] text-gray-600">ความดันบน <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("bloodPressureSystolic")} value={draft.bloodPressureSystolic} onChange={(event) => handleDraftChange("bloodPressureSystolic", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("bloodPressureSystolic"))}`} /></label>
            <label className="text-[11px] text-gray-600">ความดันล่าง <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("bloodPressureDiastolic")} value={draft.bloodPressureDiastolic} onChange={(event) => handleDraftChange("bloodPressureDiastolic", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("bloodPressureDiastolic"))}`} /></label>
            <label className="text-[11px] text-gray-600">O2 <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("oxygenSaturation")} value={draft.oxygenSaturation} onChange={(event) => handleDraftChange("oxygenSaturation", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("oxygenSaturation"))}`} /></label>
            <label className="text-[11px] text-gray-600">หายใจ <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("breathingRate")} value={draft.breathingRate} onChange={(event) => handleDraftChange("breathingRate", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("breathingRate"))}`} /></label>
            <label className="text-[11px] text-gray-600">น้ำตาล <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("bloodGlucose")} value={draft.bloodGlucose} onChange={(event) => handleDraftChange("bloodGlucose", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("bloodGlucose"))}`} /></label>
            <label className="text-[11px] text-gray-600">น้ำเข้า <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("fluidIn")} value={draft.fluidIn} onChange={(event) => handleDraftChange("fluidIn", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("fluidIn"))}`} /></label>
            <label className="text-[11px] text-gray-600">น้ำออก <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("fluidOut")} value={draft.fluidOut} onChange={(event) => handleDraftChange("fluidOut", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("fluidOut"))}`} /></label>
            <label className="text-[11px] text-gray-600">อุจจาระ <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("stool")} value={draft.stool} onChange={(event) => handleDraftChange("stool", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("stool"))}`} /></label>
            <label className="text-[11px] text-gray-600">ผ้าอ้อม <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("diaperChange")} value={draft.diaperChange} onChange={(event) => handleDraftChange("diaperChange", event.target.value)} onKeyDown={handleInputKeyDown} className={`mt-1 w-full ${getInputClassName(abnormalDraftKeys.has("diaperChange"))}`} /></label>
            <div className="text-[11px] text-gray-600">
              ปัสสาวะ
              <div className="mt-1 flex items-center gap-1">
                <input type="number" inputMode="decimal" placeholder={getDraftPlaceholder("urineOutput")} value={draft.urineOutput} onChange={(event) => handleDraftChange("urineOutput", event.target.value)} onKeyDown={handleInputKeyDown} className={`w-full ${getInputClassName(abnormalDraftKeys.has("urineOutput"))}`} />
                <button type="button" onClick={() => handleDraftChange("urineType", draft.urineType === "times" ? "ml" : "times")} className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] text-gray-700">{draft.urineType === "times" ? "ครั้ง" : "มล."}</button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePullPrevious}
            disabled={isSaving || isSlotLoading || !hasPreviousSlotValue}
            className="mt-3 w-full rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
          >
            ดึงค่าก่อนหน้า (เติมเฉพาะช่องว่าง)
          </button>
          <button type="button" onClick={() => void handleSave()} disabled={isSaving || isSlotLoading || !hasUnsavedChanges} className="mt-3 w-full rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-60">
            {isSaving ? "กำลังบันทึก" : "บันทึก"}
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-gray-300 bg-white py-6 px-4 text-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-gray-300 bg-white py-6 px-4 text-center text-sm text-red-500">{error}</div>
        ) : displayRows.length === 0 ? (
          <div className="rounded-lg border border-gray-300 bg-white py-6 px-4 text-center">
            <div className="text-sm text-gray-600">ไม่พบข้อมูลสัญญาณชีพในช่วงเวลานี้</div>
            <div className="text-xs text-gray-400 mt-1">สามารถกรอกแถวบันทึกด้านบนได้</div>
          </div>
        ) : (
          displayRows.map((row) => {
            const displayTimeText = slotToLabel[row.slot] || row.slot;
            return (
              <div key={row.key} className="rounded-lg border border-gray-300 bg-white px-3 py-3">
                <p className="text-sm font-medium text-gray-900">{row.dateKey} {displayTimeText}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700">
                  <span>อุณหภูมิ: {asText(row.vital?.temperature)}</span>
                  <span>ชีพจร: {asText(row.vital?.heart_rate)}</span>
                  <span>ความดัน: {asBloodPressure(row.vital?.blood_pressure_systolic, row.vital?.blood_pressure_diastolic)}</span>
                  <span>O2: {asText(row.vital?.oxygen_saturation)}</span>
                  <span>หายใจ: {asText(row.vital?.breathing_rate)}</span>
                  <span>น้ำตาล: {asText(row.lab?.blood_glucose)}</span>
                  <span>น้ำเข้า: {asText(row.lab?.fluid_in)}</span>
                  <span>น้ำออก: {asText(row.lab?.fluid_out)}</span>
                  <span>ปัสสาวะ: {typeof row.lab?.urine_output === "number" ? `${row.lab.urine_output}${row.lab?.urine_type === "ml" ? " มล." : " ครั้ง"}` : "-"}</span>
                  <span>อุจจาระ: {asText(row.lab?.stool)}</span>
                  <span>ผ้าอ้อม: {asText(row.lab?.diaper_change)}</span>
                </div>
              </div>
            );
          })
        )}

        <div className="rounded-lg border border-gray-300 bg-slate-50 px-3 py-3 text-xs text-gray-700">
          <p className="font-semibold">ผลรวมต่อวัน ({selectedDateKey})</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <span>น้ำเข้า: {daySummary.intake || "-"}</span>
            <span>ปัสสาวะ: {daySummary.urineMl > 0 || daySummary.urineTimes > 0 ? `${daySummary.urineMl || 0} มล. / ${daySummary.urineTimes || 0} ครั้ง` : "-"}</span>
            <span>อุจจาระ: {daySummary.stool || "-"}</span>
            <span>ผ้าอ้อม: {daySummary.diaper || "-"}</span>
          </div>
        </div>
        {confirmDialog}
      </div>

  <style>{`
        @page {
          size: A4 landscape;
          margin: 5mm;
        }

        .print-hide {
        }

        .print-only {
          display: none;
        }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
          }

          body > div, main, section, .container, [class*="max-w-"] {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body.print-vital-signs header,
          body.print-vital-signs nav,
          body.print-vital-signs aside,
          body.print-vital-signs footer,
          body.print-vital-signs .sidebar,
          body.print-vital-signs .navbar,
          body.print-vital-signs #sidebar,
          body.print-vital-signs #navbar {
            display: none !important;
          }

          .print-root {
            width: 100% !important;
            max-width: 100% !important;
            margin-top: 0px !important; 
            padding: 0 !important;
          }

          .print-root > .space-y-4 > * + * {
            margin-top: 8px !important; 
          }

          .print-only {
            display: block !important;
            padding: 8px 16px !important; 
          }

          .print-hide {
            display: none !important;
          }

          .print-table {
            display: block !important;
            width: 100% !important;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: auto !important;
          }

          th, td {
            border: 1px solid #d1d5db !important;
            padding: 6px 4px !important; 
            font-size: 10px !important; 
            line-height: 1.2 !important;
            word-wrap: break-word !important;
          }
          
          th, th button, th span {
            font-size: 10px !important;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
