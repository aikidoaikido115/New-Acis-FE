"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Clock, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { residentService } from "@/services/resident.service";
import { vitalSignService } from "@/services/vital-sign.service";
import { laboratoryValueService } from "@/services/laboratory-value.service";
import type { ResidentOverviewItem } from "@/types/resident";
import type { VitalSign } from "@/types/vital-sign";
import type { LaboratoryValue } from "@/types/laboratory-value";

const timeSlots = [
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

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
};

const toInteger = (value?: number): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.round(value);
};

const getRoomSortValue = (room?: string | null): number => {
  if (!room) {
    return Number.MAX_SAFE_INTEGER;
  }

  const numericPart = room.match(/\d+/)?.[0];
  if (!numericPart) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = Number(numericPart);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const compareByRoomAsc = (left: ResidentOverviewItem, right: ResidentOverviewItem): number => {
  const leftRoom = getRoomSortValue(left.room_number);
  const rightRoom = getRoomSortValue(right.room_number);

  if (leftRoom !== rightRoom) {
    return leftRoom - rightRoom;
  }

  const leftName = `${left.first_name || ""} ${left.last_name || ""}`.trim();
  const rightName = `${right.first_name || ""} ${right.last_name || ""}`.trim();
  return leftName.localeCompare(rightName, "th");
};

const compareOptionalNumbers = (left?: number, right?: number): number => {
  const leftMissing = typeof left !== "number";
  const rightMissing = typeof right !== "number";

  if (leftMissing && rightMissing) {
    return 0;
  }
  if (leftMissing) {
    return 1;
  }
  if (rightMissing) {
    return -1;
  }

  return left - right;
};

const buildDraftFromRecords = (vital?: VitalSign, lab?: LaboratoryValue): MatrixDraft => ({
  temperature: typeof vital?.temperature === "number" ? String(vital.temperature) : "",
  heartRate: typeof vital?.heart_rate === "number" ? String(vital.heart_rate) : "",
  bloodPressureSystolic:
    typeof vital?.blood_pressure_systolic === "number" ? String(vital.blood_pressure_systolic) : "",
  bloodPressureDiastolic:
    typeof vital?.blood_pressure_diastolic === "number" ? String(vital.blood_pressure_diastolic) : "",
  oxygenSaturation:
    typeof vital?.oxygen_saturation === "number" ? String(vital.oxygen_saturation) : "",
  breathingRate: typeof vital?.breathing_rate === "number" ? String(vital.breathing_rate) : "",
  bloodGlucose: typeof lab?.blood_glucose === "number" ? String(lab.blood_glucose) : "",
  fluidIn: typeof lab?.fluid_in === "number" ? String(lab.fluid_in) : "",
  fluidOut: typeof lab?.fluid_out === "number" ? String(lab.fluid_out) : "",
  urineOutput: typeof lab?.urine_output === "number" ? String(lab.urine_output) : "",
  urineType: lab?.urine_type === "ml" ? "ml" : "times",
  stool: typeof lab?.stool === "number" ? String(lab.stool) : "",
  diaperChange: typeof lab?.diaper_change === "number" ? String(lab.diaper_change) : "",
});

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

interface VitalSignsTableProps {
  selectedFloor?: string;
  selectedStatus?: "all" | "normal" | "abnormal";
  selectedLabelIds?: string[];
  selectedDate?: Date | null;
}

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
  if (typeof temperature === "number" && (temperature < 35 || temperature > 37.5)) {
    abnormalKeys.add("temperature");
  }

  const heartRate = parseOptionalNumber(draft.heartRate);
  if (typeof heartRate === "number" && (heartRate < 60 || heartRate > 100)) {
    abnormalKeys.add("heartRate");
  }

  const breathingRate = parseOptionalNumber(draft.breathingRate);
  if (typeof breathingRate === "number" && (breathingRate < 12 || breathingRate > 20)) {
    abnormalKeys.add("breathingRate");
  }

  const bloodPressureSystolic = parseOptionalNumber(draft.bloodPressureSystolic);
  if (typeof bloodPressureSystolic === "number" && (bloodPressureSystolic < 90 || bloodPressureSystolic > 140)) {
    abnormalKeys.add("bloodPressureSystolic");
  }

  const bloodPressureDiastolic = parseOptionalNumber(draft.bloodPressureDiastolic);
  if (typeof bloodPressureDiastolic === "number" && (bloodPressureDiastolic < 60 || bloodPressureDiastolic > 90)) {
    abnormalKeys.add("bloodPressureDiastolic");
  }

  const oxygenSaturation = parseOptionalNumber(draft.oxygenSaturation);
  if (typeof oxygenSaturation === "number" && oxygenSaturation < 95) {
    abnormalKeys.add("oxygenSaturation");
  }

  const bloodGlucose = parseOptionalNumber(draft.bloodGlucose);
  if (typeof bloodGlucose === "number" && (bloodGlucose < 70 || bloodGlucose > 180)) {
    abnormalKeys.add("bloodGlucose");
  }

  const fluidIn = parseOptionalNumber(draft.fluidIn);
  if (typeof fluidIn === "number" && (fluidIn < 300 || fluidIn > 2500)) {
    abnormalKeys.add("fluidIn");
  }

  const fluidOut = parseOptionalNumber(draft.fluidOut);
  if (typeof fluidOut === "number" && (fluidOut < 200 || fluidOut > 2000)) {
    abnormalKeys.add("fluidOut");
  }

  const urineOutput = parseOptionalNumber(draft.urineOutput);
  if (typeof urineOutput === "number") {
    const isAbnormalUrine =
      draft.urineType === "ml"
        ? urineOutput < 150 || urineOutput > 2000
        : urineOutput < 2 || urineOutput > 8;
    if (isAbnormalUrine) {
      abnormalKeys.add("urineOutput");
    }
  }

  const stool = parseOptionalNumber(draft.stool);
  if (typeof stool === "number" && stool > 3) {
    abnormalKeys.add("stool");
  }

  const diaperChange = parseOptionalNumber(draft.diaperChange);
  if (typeof diaperChange === "number" && diaperChange > 6) {
    abnormalKeys.add("diaperChange");
  }

  return abnormalKeys;
};

export function VitalSignsTable({ selectedFloor = "all", selectedStatus = "all", selectedLabelIds = [], selectedDate }: VitalSignsTableProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedTime, setSelectedTime] = useState("06");
  const [currentPage, setCurrentPage] = useState(1);

  const [vitalRecords, setVitalRecords] = useState<VitalSign[]>([]);
  const [labRecords, setLabRecords] = useState<LaboratoryValue[]>([]);
  const [activeResidents, setActiveResidents] = useState<ResidentOverviewItem[]>([]);

  const [rowDrafts, setRowDrafts] = useState<Record<string, MatrixDraft>>({});
  const [initialRowDrafts, setInitialRowDrafts] = useState<Record<string, MatrixDraft>>({});

  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [failedRowIds, setFailedRowIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedLabelIdsKey = useMemo(() => selectedLabelIds.filter(Boolean).join(","), [selectedLabelIds]);
  const selectedDateKey = useMemo(() => (selectedDate ? formatDateToISO(selectedDate) : getTodayDate()), [selectedDate]);
  const pageSize = 10;

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const floorNumber = selectedFloor !== "all" ? Number(selectedFloor) : undefined;
        const normalizedLabelIds = selectedLabelIdsKey ? selectedLabelIdsKey.split(",") : [];

        const residentsResponse = await residentService.getOverview({
          floor: Number.isFinite(floorNumber) ? floorNumber : undefined,
          label_ids: normalizedLabelIds.length > 0 ? normalizedLabelIds : undefined,
          status: "active",
          page: 1,
          page_size: 200,
        });

        let allResidents = residentsResponse.items || [];
        const residentTotalPages = Math.max(residentsResponse.pagination.total_pages || 1, 1);

        if (residentTotalPages > 1) {
          const residentPageRequests: Promise<Awaited<ReturnType<typeof residentService.getOverview>>>[] = [];
          for (let page = 2; page <= residentTotalPages; page += 1) {
            residentPageRequests.push(
              residentService.getOverview({
                floor: Number.isFinite(floorNumber) ? floorNumber : undefined,
                label_ids: normalizedLabelIds.length > 0 ? normalizedLabelIds : undefined,
                status: "active",
                page,
                page_size: 200,
              })
            );
          }

          const remainingResidentPages = await Promise.all(residentPageRequests);
          allResidents = remainingResidentPages.reduce<ResidentOverviewItem[]>((acc, pageResult) => {
            if (pageResult.items?.length) {
              acc.push(...pageResult.items);
            }
            return acc;
          }, [...allResidents]);
        }

        const [firstVitalOverview, firstLabOverview] = await Promise.all([
          vitalSignService.getOverview({
            date: selectedDateKey,
            time_of_day: slotToTimeOfDay[selectedTime],
            floor: Number.isFinite(floorNumber) ? floorNumber : undefined,
            label_ids: normalizedLabelIds.length > 0 ? normalizedLabelIds : undefined,
            vitalsign_status: selectedStatus,
            page: 1,
            page_size: 200,
          }),
          laboratoryValueService.getOverview({
            date: selectedDateKey,
            time_of_day: slotToTimeOfDay[selectedTime],
            floor: Number.isFinite(floorNumber) ? floorNumber : undefined,
            label_ids: normalizedLabelIds.length > 0 ? normalizedLabelIds : undefined,
            laboratory_value_status: selectedStatus,
            page: 1,
            page_size: 200,
          }),
        ]);

        let allVitalSigns = firstVitalOverview.items || [];
        const vitalTotalPages = Math.max(firstVitalOverview.pagination.total_pages || 1, 1);

        if (vitalTotalPages > 1) {
          const vitalPageRequests: Promise<Awaited<ReturnType<typeof vitalSignService.getOverview>>>[] = [];
          for (let page = 2; page <= vitalTotalPages; page += 1) {
            vitalPageRequests.push(
              vitalSignService.getOverview({
                date: selectedDateKey,
                time_of_day: slotToTimeOfDay[selectedTime],
                floor: Number.isFinite(floorNumber) ? floorNumber : undefined,
                label_ids: normalizedLabelIds.length > 0 ? normalizedLabelIds : undefined,
                vitalsign_status: selectedStatus,
                page,
                page_size: 200,
              })
            );
          }

          const remainingVitalPages = await Promise.all(vitalPageRequests);
          allVitalSigns = remainingVitalPages.reduce<VitalSign[]>((acc, pageResult) => {
            if (pageResult.items?.length) {
              acc.push(...pageResult.items);
            }
            return acc;
          }, [...allVitalSigns]);
        }

        let allLabs = firstLabOverview.items || [];
        const labTotalPages = Math.max(firstLabOverview.pagination.total_pages || 1, 1);

        if (labTotalPages > 1) {
          const labPageRequests: Promise<Awaited<ReturnType<typeof laboratoryValueService.getOverview>>>[] = [];
          for (let page = 2; page <= labTotalPages; page += 1) {
            labPageRequests.push(
              laboratoryValueService.getOverview({
                date: selectedDateKey,
                time_of_day: slotToTimeOfDay[selectedTime],
                floor: Number.isFinite(floorNumber) ? floorNumber : undefined,
                label_ids: normalizedLabelIds.length > 0 ? normalizedLabelIds : undefined,
                laboratory_value_status: selectedStatus,
                page,
                page_size: 200,
              })
            );
          }

          const remainingLabPages = await Promise.all(labPageRequests);
          allLabs = remainingLabPages.reduce<LaboratoryValue[]>((acc, pageResult) => {
            if (pageResult.items?.length) {
              acc.push(...pageResult.items);
            }
            return acc;
          }, [...allLabs]);
        }

        if (isCancelled) {
          return;
        }

        const vitalByResident = new Map<string, VitalSign>();
        allVitalSigns.forEach((record) => {
          if (!vitalByResident.has(record.resident_id)) {
            vitalByResident.set(record.resident_id, record);
          }
        });

        const labByResident = new Map<string, LaboratoryValue>();
        allLabs.forEach((record) => {
          if (!labByResident.has(record.resident_id)) {
            labByResident.set(record.resident_id, record);
          }
        });

        const nextDrafts: Record<string, MatrixDraft> = {};
        allResidents.forEach((resident) => {
          nextDrafts[resident.resident_id] = buildDraftFromRecords(
            vitalByResident.get(resident.resident_id),
            labByResident.get(resident.resident_id)
          );
        });

        setVitalRecords(allVitalSigns);
        setLabRecords(allLabs);
        setActiveResidents(allResidents);
        setRowDrafts(nextDrafts);
        setInitialRowDrafts(nextDrafts);
        setFailedRowIds(new Set());
      } catch {
        if (isCancelled) {
          return;
        }
        setError("ไม่สามารถโหลดข้อมูล Vital Sign Matrix ได้");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedDateKey, selectedFloor, selectedLabelIdsKey, selectedStatus, selectedTime]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDateKey, selectedFloor, selectedTime]);

  const vitalByResident = useMemo(() => {
    return vitalRecords.reduce((acc, item) => {
      if (!acc.has(item.resident_id)) {
        acc.set(item.resident_id, item);
      }
      return acc;
    }, new Map<string, VitalSign>());
  }, [vitalRecords]);

  const labByResident = useMemo(() => {
    return labRecords.reduce((acc, item) => {
      if (!acc.has(item.resident_id)) {
        acc.set(item.resident_id, item);
      }
      return acc;
    }, new Map<string, LaboratoryValue>());
  }, [labRecords]);

  const isRowDirty = useCallback((residentId: string): boolean => {
    const current = rowDrafts[residentId] || emptyDraft;
    const initial = initialRowDrafts[residentId] || emptyDraft;
    return !isDraftEqual(current, initial);
  }, [initialRowDrafts, rowDrafts]);

  const hasAnyDirtyRows = useMemo(() => {
    return activeResidents.some((resident) => isRowDirty(resident.resident_id));
  }, [activeResidents, isRowDirty]);

  const filteredResidents = useMemo(() => {
    if (selectedStatus === "all") {
      return activeResidents;
    }

    return activeResidents.filter((resident) => {
      const draft = rowDrafts[resident.resident_id] || emptyDraft;
      if (!hasAnyDraftValue(draft)) {
        return false;
      }

      const hasAbnormal = getAbnormalDraftKeys(draft).size > 0;
      return selectedStatus === "abnormal" ? hasAbnormal : !hasAbnormal;
    });
  }, [activeResidents, rowDrafts, selectedStatus]);

  const sortedResidents = useMemo(() => {
    const residents = [...filteredResidents];

    if (!sortField) {
      return residents.sort(compareByRoomAsc);
    }

    const sorted = residents.sort((leftResident, rightResident) => {
      const leftDraft = rowDrafts[leftResident.resident_id] || emptyDraft;
      const rightDraft = rowDrafts[rightResident.resident_id] || emptyDraft;

      let result = 0;

      if (sortField === "bloodPressure") {
        const leftSystolic = parseOptionalNumber(leftDraft.bloodPressureSystolic);
        const rightSystolic = parseOptionalNumber(rightDraft.bloodPressureSystolic);
        result = compareOptionalNumbers(leftSystolic, rightSystolic);

        if (result === 0) {
          const leftDiastolic = parseOptionalNumber(leftDraft.bloodPressureDiastolic);
          const rightDiastolic = parseOptionalNumber(rightDraft.bloodPressureDiastolic);
          result = compareOptionalNumbers(leftDiastolic, rightDiastolic);
        }
      } else {
        const leftValue = parseOptionalNumber(leftDraft[sortField]);
        const rightValue = parseOptionalNumber(rightDraft[sortField]);
        result = compareOptionalNumbers(leftValue, rightValue);
      }

      if (result !== 0) {
        return sortDirection === "asc" ? result : -result;
      }

      return compareByRoomAsc(leftResident, rightResident);
    });

    return sorted;
  }, [filteredResidents, rowDrafts, sortDirection, sortField]);

  const sortedTotalPages = Math.max(1, Math.ceil(sortedResidents.length / pageSize));
  const sortedSafeCurrentPage = Math.min(currentPage, sortedTotalPages);

  const pagedResidents = useMemo(() => {
    const start = (sortedSafeCurrentPage - 1) * pageSize;
    return sortedResidents.slice(start, start + pageSize);
  }, [sortedResidents, sortedSafeCurrentPage]);

  const dirtyCurrentPageResidents = useMemo(() => {
    return pagedResidents.filter((resident) => isRowDirty(resident.resident_id));
  }, [isRowDirty, pagedResidents]);

  const handleDraftChange = (residentId: string, key: keyof MatrixDraft, value: string) => {
    setFailedRowIds((prev) => {
      if (!prev.has(residentId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(residentId);
      return next;
    });

    setRowDrafts((prev) => ({
      ...prev,
      [residentId]: {
        ...(prev[residentId] || emptyDraft),
        [key]: value,
      },
    }));
  };

  const saveResidentRow = async (residentId: string, options?: { silent?: boolean }): Promise<boolean> => {
    const silent = options?.silent ?? false;
    const draft = rowDrafts[residentId] || emptyDraft;

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
      if (!silent) {
        showToast({
          type: "error",
          title: "ข้อมูลไม่ครบ",
          message: "กรอกข้อมูลอย่างน้อย 1 ค่า ก่อนบันทึก",
        });
      }
      return false;
    }

    const hasSystolic = typeof bloodPressureSystolic === "number";
    const hasDiastolic = typeof bloodPressureDiastolic === "number";
    if ((hasSystolic && !hasDiastolic) || (!hasSystolic && hasDiastolic)) {
      if (!silent) {
        showToast({
          type: "error",
          title: "ข้อมูลไม่ครบ",
          message: "ความดันต้องกรอกค่าบนและค่าล่างให้ครบคู่",
        });
      }
      return false;
    }

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

    setSavingRowId(residentId);

    try {
      const existingVital = vitalByResident.get(residentId);
      const existingLab = labByResident.get(residentId);

      let savedVital = existingVital;
      let savedLab = existingLab;

      if (hasVitalValue) {
        if (existingVital?.vital_sign_id) {
          const updated = await vitalSignService.updateById(existingVital.vital_sign_id, vitalPayload);
          savedVital = updated;
          setVitalRecords((prev) => prev.map((item) => (item.vital_sign_id === updated.vital_sign_id ? updated : item)));
        } else {
          const created = await vitalSignService.create({
            resident_id: residentId,
            date: selectedDateKey,
            time_of_day: slotToTimeOfDay[selectedTime],
            ...vitalPayload,
          });
          savedVital = created;
          setVitalRecords((prev) => [created, ...prev.filter((item) => item.resident_id !== residentId)]);
        }
      }

      if (hasLabValue) {
        if (existingLab?.laboratory_value_id) {
          const updated = await laboratoryValueService.updateById(existingLab.laboratory_value_id, labPayload);
          savedLab = updated;
          setLabRecords((prev) =>
            prev.map((item) => (item.laboratory_value_id === updated.laboratory_value_id ? updated : item))
          );
        } else {
          const created = await laboratoryValueService.create({
            resident_id: residentId,
            date: selectedDateKey,
            time_of_day: slotToTimeOfDay[selectedTime],
            ...labPayload,
          });
          savedLab = created;
          setLabRecords((prev) => [created, ...prev.filter((item) => item.resident_id !== residentId)]);
        }
      }

      const nextDraft = buildDraftFromRecords(savedVital, savedLab);
      setRowDrafts((prev) => ({
        ...prev,
        [residentId]: nextDraft,
      }));
      setInitialRowDrafts((prev) => ({
        ...prev,
        [residentId]: nextDraft,
      }));
      setFailedRowIds((prev) => {
        if (!prev.has(residentId)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(residentId);
        return next;
      });

      if (!silent) {
        showToast({
          type: "success",
          title: "บันทึกสำเร็จ",
          message: "บันทึกข้อมูลสัญญาณชีพเรียบร้อยแล้ว",
        });
      }
      return true;
    } catch (err) {
      setFailedRowIds((prev) => {
        const next = new Set(prev);
        next.add(residentId);
        return next;
      });

      if (!silent) {
        showToast({
          type: "error",
          title: "บันทึกไม่สำเร็จ",
          message: err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้",
        });
      }
      return false;
    } finally {
      setSavingRowId(null);
    }
  };

  const handleSaveRow = async (residentId: string) => {
    await saveResidentRow(residentId);
  };

  const handleSaveAllCurrentPage = async () => {
    if (dirtyCurrentPageResidents.length === 0) {
      showToast({
        type: "info",
        title: "ไม่มีรายการค้างบันทึก",
        message: "หน้านี้ไม่มีข้อมูลที่แก้ไขค้างไว้",
      });
      return;
    }

    setIsBulkSaving(true);

    let successCount = 0;
    for (const resident of dirtyCurrentPageResidents) {
      const ok = await saveResidentRow(resident.resident_id, { silent: true });
      if (ok) {
        successCount += 1;
      }
    }

    setIsBulkSaving(false);

    if (successCount === dirtyCurrentPageResidents.length) {
      showToast({
        type: "success",
        title: "บันทึกครบแล้ว",
        message: `บันทึกข้อมูลสำเร็จ ${successCount} รายการ`,
      });
      return;
    }

    showToast({
      type: "error",
      title: "บันทึกไม่ครบ",
      message: `สำเร็จ ${successCount}/${dirtyCurrentPageResidents.length} รายการ (แถวที่ไม่สำเร็จถูกไฮไลต์แล้ว)`,
    });
  };

  const handleSelectTimeSlot = (nextTime: string) => {
    if (nextTime === selectedTime) {
      return;
    }

    if (hasAnyDirtyRows) {
      const confirmed = window.confirm("มีข้อมูลที่ยังไม่บันทึก ต้องการเปลี่ยนช่วงเวลาและละทิ้งการแก้ไขหรือไม่?");
      if (!confirmed) {
        return;
      }
    }

    setSelectedTime(nextTime);
  };

  const handleSort = (field: SortField) => {
    setCurrentPage(1);

    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
      return;
    }

    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getSortLabel = (field: SortField | null): string => {
    if (!field) {
      return "ห้อง";
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
    if (sortField !== field) {
      return "-";
    }
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const inputClassName =
    "w-[54px] rounded border border-gray-300 bg-white px-1.5 py-1 text-center text-[11px] text-gray-900 focus:border-blue-500 focus:outline-none";
  const abnormalInputClassName =
    "w-[54px] rounded border border-rose-400 bg-rose-50 px-1.5 py-1 text-center text-[11px] text-rose-700 focus:border-rose-500 focus:outline-none";

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, residentId: string) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void handleSaveRow(residentId);
  };

  const renderInput = (
    residentId: string,
    key: keyof MatrixDraft,
    placeholder: string,
    options?: { isAbnormal?: boolean }
  ) => {
    const draft = rowDrafts[residentId] || emptyDraft;
    const isAbnormal = options?.isAbnormal ?? false;

    return (
      <input
        type="number"
        inputMode="decimal"
        value={draft[key]}
        onChange={(event) => handleDraftChange(residentId, key, event.target.value)}
        onKeyDown={(event) => handleInputKeyDown(event, residentId)}
        placeholder={placeholder}
        className={isAbnormal ? abnormalInputClassName : inputClassName}
      />
    );
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => handleSelectTimeSlot(slot.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">ค้างบันทึกหน้านี้ {dirtyCurrentPageResidents.length} รายการ</span>
          <button
            type="button"
            onClick={() => void handleSaveAllCurrentPage()}
            disabled={isBulkSaving || dirtyCurrentPageResidents.length === 0}
            className="rounded bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {isBulkSaving ? "กำลังบันทึกทั้งหมด" : "บันทึกทั้งหมด"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">เรียงข้อมูล</span>
          <select
            value={sortField ?? "room"}
            onChange={(event) => {
              const next = event.target.value;
              setCurrentPage(1);

              if (next === "room") {
                setSortField(null);
                setSortDirection("asc");
                return;
              }

              setSortField(next as SortField);
              setSortDirection("asc");
            }}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
          >
            <option value="room">ห้อง (น้อยไปมาก)</option>
            <option value="temperature">อุณหภูมิ</option>
            <option value="heartRate">ชีพจร</option>
            <option value="bloodPressure">ความดัน</option>
            <option value="oxygenSaturation">O2</option>
            <option value="breathingRate">หายใจ</option>
            <option value="bloodGlucose">น้ำตาล</option>
            <option value="fluidIn">น้ำเข้า</option>
            <option value="fluidOut">น้ำออก</option>
            <option value="urineOutput">ปัสสาวะ</option>
            <option value="stool">อุจจาระ</option>
            <option value="diaperChange">ผ้าอ้อม</option>
          </select>
          {sortField ? (
            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs text-blue-700"
            >
              {sortDirection === "asc" ? "น้อยไปมาก" : "มากไปน้อย"}
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
          <span>กำลังเรียงตาม:</span>
          <span className="font-semibold text-slate-900">{getSortLabel(sortField)}</span>
          {sortField ? (
            sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-blue-700" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-700" />
          ) : (
            <span className="text-slate-500">(น้อยไปมาก)</span>
          )}
        </div>
      </div>

      <div className="hidden xl:block overflow-hidden rounded-lg" style={{ border: "1px solid rgba(103, 103, 103, 0.48)" }}>
        <div>
          <table className="table-fixed w-full">
            <thead>
              <tr style={{ backgroundColor: "rgba(239, 242, 247, 1)", borderBottom: "1px solid rgba(103, 103, 103, 0.48)" }}>
                <th className="w-[170px] text-left py-3 px-2 text-[11px] font-semibold" style={{ color: "rgba(126, 143, 164, 1)" }}>ชื่อ/ห้อง</th>
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
                <th className="w-[150px] text-center py-3 px-2 text-[11px] font-semibold" style={{ color: "rgba(126, 143, 164, 1)" }}>จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="py-6 px-4 text-center text-sm text-gray-500">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={13} className="py-6 px-4 text-center text-sm text-red-500">{error}</td>
                </tr>
              ) : pagedResidents.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 px-4 text-center">
                    <div className="text-sm text-gray-600">ไม่พบข้อมูลผู้พักที่ Active</div>
                    <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนเงื่อนไขการกรองอีกครั้ง</div>
                  </td>
                </tr>
              ) : (
                pagedResidents.map((resident) => {
                  const residentId = resident.resident_id;
                  const isDirty = isRowDirty(residentId);
                  const isFailed = failedRowIds.has(residentId);
                  const abnormalDraftKeys = getAbnormalDraftKeys(rowDrafts[residentId] || emptyDraft);
                  const hasPersisted = Boolean(vitalByResident.get(residentId) || labByResident.get(residentId));
                  const isSaving = savingRowId === residentId || isBulkSaving;
                  const residentName = `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || residentId;
                  const roomLabel = resident.room_number ? `ห้อง ${resident.room_number}` : "";

                  return (
                    <tr
                      key={residentId}
                      className={`transition-colors ${isFailed ? "bg-rose-50 hover:bg-rose-100" : "bg-white hover:bg-gray-50"}`}
                      style={{ borderBottom: "1px solid rgba(103, 103, 103, 0.48)" }}
                    >
                      <td className="py-3 px-2 text-[11px] text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate underline max-w-[130px]" title={residentName}>{residentName}</span>
                          {isDirty ? <span className="h-2 w-2 rounded-full bg-amber-500" /> : null}
                        </div>
                        {roomLabel ? <p className="text-[10px] text-gray-500">{roomLabel}</p> : null}
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium ${hasPersisted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {hasPersisted ? "มีข้อมูลแล้ว" : "ยังไม่เคยบันทึก"}
                          </span>
                          {abnormalDraftKeys.size > 0 ? <span className="text-[9px] text-rose-600">มีค่าผิดปกติ</span> : null}
                          {isDirty ? <span className="text-[9px] text-amber-600">ยังไม่บันทึก</span> : null}
                          {isFailed ? <span className="text-[9px] text-rose-600">บันทึกล่าสุดไม่สำเร็จ</span> : null}
                        </div>
                      </td>

                      <td className="py-2 px-1 text-center">{renderInput(residentId, "temperature", "36.5", { isAbnormal: abnormalDraftKeys.has("temperature") })}</td>
                      <td className="py-2 px-1 text-center">{renderInput(residentId, "heartRate", "72", { isAbnormal: abnormalDraftKeys.has("heartRate") })}</td>
                      <td className="py-2 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {renderInput(residentId, "bloodPressureSystolic", "120", { isAbnormal: abnormalDraftKeys.has("bloodPressureSystolic") })}
                          <span className="text-[10px] text-gray-400">/</span>
                          {renderInput(residentId, "bloodPressureDiastolic", "80", { isAbnormal: abnormalDraftKeys.has("bloodPressureDiastolic") })}
                        </div>
                      </td>
                      <td className="py-2 px-1 text-center">{renderInput(residentId, "oxygenSaturation", "98", { isAbnormal: abnormalDraftKeys.has("oxygenSaturation") })}</td>
                      <td className="py-2 px-1 text-center">{renderInput(residentId, "breathingRate", "16", { isAbnormal: abnormalDraftKeys.has("breathingRate") })}</td>

                      <td className="py-2 px-1 text-center">{renderInput(residentId, "bloodGlucose", "110", { isAbnormal: abnormalDraftKeys.has("bloodGlucose") })}</td>
                      <td className="py-2 px-1 text-center">{renderInput(residentId, "fluidIn", "250", { isAbnormal: abnormalDraftKeys.has("fluidIn") })}</td>
                      <td className="py-2 px-1 text-center">{renderInput(residentId, "fluidOut", "200", { isAbnormal: abnormalDraftKeys.has("fluidOut") })}</td>
                      <td className="py-2 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {renderInput(residentId, "urineOutput", "1", { isAbnormal: abnormalDraftKeys.has("urineOutput") })}
                          <button
                            type="button"
                            onClick={() =>
                              handleDraftChange(
                                residentId,
                                "urineType",
                                (rowDrafts[residentId]?.urineType || "times") === "times" ? "ml" : "times"
                              )
                            }
                            className="rounded border border-gray-300 bg-white px-1.5 py-1 text-[9px] text-gray-600 hover:bg-gray-50"
                            title="สลับหน่วยปัสสาวะ"
                          >
                            {(rowDrafts[residentId]?.urineType || "times") === "times" ? "ครั้ง" : "มล."}
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-1 text-center">{renderInput(residentId, "stool", "0", { isAbnormal: abnormalDraftKeys.has("stool") })}</td>
                      <td className="py-2 px-1 text-center">{renderInput(residentId, "diaperChange", "0", { isAbnormal: abnormalDraftKeys.has("diaperChange") })}</td>

                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSaveRow(residentId)}
                            disabled={isSaving}
                            className="rounded bg-blue-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-600 disabled:opacity-60"
                          >
                            {isSaving ? "กำลังบันทึก" : "บันทึก"}
                          </button>

                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            onClick={() => router.push(`/emr/${residentId}`)}
                            aria-label="ดูรายละเอียดผู้พัก"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="xl:hidden space-y-3">
        {isLoading ? (
          <div className="rounded-lg border border-gray-300 bg-white py-6 px-4 text-center text-sm text-gray-500">กำลังโหลดข้อมูล...</div>
        ) : error ? (
          <div className="rounded-lg border border-gray-300 bg-white py-6 px-4 text-center text-sm text-red-500">{error}</div>
        ) : pagedResidents.length === 0 ? (
          <div className="rounded-lg border border-gray-300 bg-white py-6 px-4 text-center">
            <div className="text-sm text-gray-600">ไม่พบข้อมูลผู้พักที่ Active</div>
            <div className="mt-1 text-xs text-gray-400">ลองเปลี่ยนเงื่อนไขการกรองอีกครั้ง</div>
          </div>
        ) : (
          pagedResidents.map((resident) => {
            const residentId = resident.resident_id;
            const isDirty = isRowDirty(residentId);
            const isFailed = failedRowIds.has(residentId);
            const abnormalDraftKeys = getAbnormalDraftKeys(rowDrafts[residentId] || emptyDraft);
            const hasPersisted = Boolean(vitalByResident.get(residentId) || labByResident.get(residentId));
            const isSaving = savingRowId === residentId || isBulkSaving;
            const residentName = `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || residentId;
            const roomLabel = resident.room_number ? `ห้อง ${resident.room_number}` : "";
            const urineType = rowDrafts[residentId]?.urineType || "times";

            return (
              <div
                key={residentId}
                className={`rounded-lg border px-3 py-3 ${isFailed ? "border-rose-300 bg-rose-50" : "border-gray-300 bg-white"}`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{residentName}</p>
                    {roomLabel ? <p className="text-xs text-gray-500">{roomLabel}</p> : null}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${hasPersisted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {hasPersisted ? "มีข้อมูลแล้ว" : "ยังไม่เคยบันทึก"}
                      </span>
                      {abnormalDraftKeys.size > 0 ? <span className="text-[10px] text-rose-600">มีค่าผิดปกติ</span> : null}
                      {isDirty ? <span className="text-[10px] text-amber-600">ยังไม่บันทึก</span> : null}
                      {isFailed ? <span className="text-[10px] text-rose-600">บันทึกล่าสุดไม่สำเร็จ</span> : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    onClick={() => router.push(`/emr/${residentId}`)}
                    aria-label="ดูรายละเอียดผู้พัก"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <label className="text-[11px] text-gray-600">อุณหภูมิ {renderInput(residentId, "temperature", "36.5", { isAbnormal: abnormalDraftKeys.has("temperature") })}</label>
                  <label className="text-[11px] text-gray-600">ชีพจร {renderInput(residentId, "heartRate", "72", { isAbnormal: abnormalDraftKeys.has("heartRate") })}</label>
                  <label className="text-[11px] text-gray-600">O2 {renderInput(residentId, "oxygenSaturation", "98", { isAbnormal: abnormalDraftKeys.has("oxygenSaturation") })}</label>
                  <label className="text-[11px] text-gray-600">หายใจ {renderInput(residentId, "breathingRate", "16", { isAbnormal: abnormalDraftKeys.has("breathingRate") })}</label>
                  <label className="text-[11px] text-gray-600">น้ำตาล {renderInput(residentId, "bloodGlucose", "110", { isAbnormal: abnormalDraftKeys.has("bloodGlucose") })}</label>
                  <label className="text-[11px] text-gray-600">น้ำเข้า {renderInput(residentId, "fluidIn", "250", { isAbnormal: abnormalDraftKeys.has("fluidIn") })}</label>
                  <label className="text-[11px] text-gray-600">น้ำออก {renderInput(residentId, "fluidOut", "200", { isAbnormal: abnormalDraftKeys.has("fluidOut") })}</label>
                  <label className="text-[11px] text-gray-600">อุจจาระ {renderInput(residentId, "stool", "0", { isAbnormal: abnormalDraftKeys.has("stool") })}</label>
                  <label className="text-[11px] text-gray-600">ผ้าอ้อม {renderInput(residentId, "diaperChange", "0", { isAbnormal: abnormalDraftKeys.has("diaperChange") })}</label>
                  <label className="text-[11px] text-gray-600">ความดันบน {renderInput(residentId, "bloodPressureSystolic", "120", { isAbnormal: abnormalDraftKeys.has("bloodPressureSystolic") })}</label>
                  <label className="text-[11px] text-gray-600">ความดันล่าง {renderInput(residentId, "bloodPressureDiastolic", "80", { isAbnormal: abnormalDraftKeys.has("bloodPressureDiastolic") })}</label>
                  <div className="col-span-2 sm:col-span-3">
                    <div className="flex items-end gap-2">
                      <label className="text-[11px] text-gray-600">ปัสสาวะ {renderInput(residentId, "urineOutput", "1", { isAbnormal: abnormalDraftKeys.has("urineOutput") })}</label>
                      <button
                        type="button"
                        onClick={() => handleDraftChange(residentId, "urineType", urineType === "times" ? "ml" : "times")}
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-50"
                        title="สลับหน่วยปัสสาวะ"
                      >
                        หน่วย: {urineType === "times" ? "ครั้ง" : "มล."}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveRow(residentId)}
                    disabled={isSaving}
                    className="w-full rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-60"
                  >
                    {isSaving ? "กำลังบันทึก" : "บันทึกข้อมูลแถวนี้"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-end">
        <Pagination currentPage={sortedSafeCurrentPage} totalPages={sortedTotalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
