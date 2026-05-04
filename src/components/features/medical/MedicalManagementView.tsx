"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Download,
  Printer,
  Plus,
  Sunrise,
  Sun,
  Sunset,
  MoonStar,
} from "lucide-react";
import { MedicationCard } from "./MedicationCard";
import { NoteTimelineControls } from "@/components/features/EMR/NoteTimelineControls";
import { PatientProfileCard } from "./PatientProfileCard";
import { RoutineMedsTable } from "./tables/RoutineMedsTable";
import { CombinedMedsTable } from "./tables/CombinedMedsTable";
import { HistoryTable } from "./tables/HistoryTable";
import { Pagination } from "@/components/ui/pagination";
import { Dropdown } from "@/components/ui/dropdown";
import { AddMedicationModal } from "./modals";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AddMedicationFormData, EditMedicationFormData } from "./modals";
import type { GiveAllFormData } from "./modals/GiveAllMedicationsModal";
import type { WithholdFormData } from "./modals/WithholdMedicationModal";
import type {
  Medication,
  MedicationHistory,
  PatientMedication,
  RoutineMedication,
  TimeSlot,
} from "./medical.types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/components/ui/toast";
import { authService } from "@/services/auth.service";
import { drugMasterService } from "@/services/drug-master.service";
import { drugPlanService } from "@/services/drug-plan.service";
import { personalDrugService, type PersonalDrug } from "@/services/personal-drug.service";
import { isResidentActive, residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { drugAllergyService } from "@/services/drug-allergy.service";
import type { DrugAdministrationStatus, DrugPlan } from "@/types/drug-plan";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import { getBangkokDateKey } from "@/components/features/EMR/note-timeline";

type ViewType = "main" | "details" | "history";

const TIME_SLOTS: TimeSlot[] = ["เช้า", "กลางวัน", "เย็น", "ก่อนนอน"];
const HISTORY_PAGE_SIZE = 10;
const MAX_FREQUENCY_PER_DAY = 4;

const getResidentPrimaryId = (resident: Resident): string => resident.resident_id || resident.id;
const getRoomPrimaryId = (room: Room): string => room.room_id || room.id;

const toHelpLevel = (labels?: Resident["resident_labels"]): string => {
  const labelName = labels
    ?.map((label) => label.intake_label?.label_name || "")
    .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
    ?.trim();

  if (labelName === "ช่วยเหลือตัวเองได้ทั้งหมด") return "ช่วยเหลือตัวเองได้";
  if (labelName === "ช่วยเหลือตัวเองได้บางส่วน") return "ต้องการความช่วยเหลือ";
  if (labelName === "ติดเตียง") return "ติดเตียง";
  return "-";
};

const toThaiStatus = (isTaken: boolean, isOmitted?: boolean | null): Medication["status"] => {
  if (isTaken) {
    return "ให้ยา";
  }
  if (isOmitted) {
    return "งด";
  }
  return "รอให้";
};

const parseListFromTextMulti = (value?: string | null): string[] => {
  if (!value) {
    return [];
  }

  return value
    .replace(/\r\n/g, "\n")
    .split(/[\n,;]+/)
    .map((text) => text.trim())
    .filter(Boolean);
};

const toStatusBadge = (labels?: Resident["resident_labels"]): string => {
  const labelName = labels
    ?.map((label) => label.intake_label?.label_name || "")
    .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
    ?.trim();

  if (labelName === "ช่วยเหลือตัวเองได้ทั้งหมด") return "ช่วยเหลือตัวเองได้";
  if (labelName === "ช่วยเหลือตัวเองได้บางส่วน") return "ต้องการความช่วยเหลือ";
  if (labelName === "ติดเตียง") return "ติดเตียง";
  return "-";
};

const toHistoryStatus = (status: DrugAdministrationStatus): MedicationHistory["status"] => {
  switch (status) {
    case "taken":
      return "ให้แล้ว";
    case "omitted":
      return "งด";
    case "pending":
    default:
      return "รอให้";
  }
};

const toHistoryQueryStatus = (status: string): DrugAdministrationStatus | undefined => {
  if (status === "ให้แล้ว") {
    return "taken";
  }
  if (status === "งด") {
    return "omitted";
  }
  if (status === "รอให้") {
    return "pending";
  }
  return undefined;
};

const parseListFromText = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatHistoryTime = (dateText?: string | null): string => {
  if (!dateText) {
    return "-";
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const TIME_SLOT_QUERY_ALIASES: Record<TimeSlot, string[]> = {
  "เช้า": ["เช้า", "morning"],
  "กลางวัน": ["กลางวัน", "noon"],
  "เย็น": ["เย็น", "evening"],
  "ก่อนนอน": ["ก่อนนอน", "bedtime"],
};

const toThaiTimeOfDayLabel = (rawTimeOfDay?: string): string => {
  const normalized = (rawTimeOfDay || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  if (normalized.includes("morning") || normalized.includes("เช้า")) {
    return "เช้า";
  }
  if (normalized.includes("noon") || normalized.includes("กลางวัน")) {
    return "กลางวัน";
  }
  if (normalized.includes("evening") || normalized.includes("เย็น")) {
    return "เย็น";
  }
  if (normalized.includes("bedtime") || normalized.includes("ก่อนนอน")) {
    return "ก่อนนอน";
  }

  return rawTimeOfDay || "";
};

const toThaiTimeOfDayListLabel = (rawTimeOfDay?: string): string => {
  if (!rawTimeOfDay) {
    return "-";
  }

  const labels = rawTimeOfDay
    .split(",")
    .map((slot) => toThaiTimeOfDayLabel(slot))
    .filter(Boolean);

  if (labels.length === 0) {
    const fallback = toThaiTimeOfDayLabel(rawTimeOfDay);
    return fallback || rawTimeOfDay || "-";
  }

  return Array.from(new Set(labels)).join(", ");
};

const includesTimeSlot = (rawTimeOfDay: string | undefined, selectedSlot: TimeSlot): boolean => {
  const normalized = (rawTimeOfDay || "").toLowerCase();
  if (!normalized.trim()) {
    return false;
  }

  return TIME_SLOT_QUERY_ALIASES[selectedSlot].some((alias) => normalized.includes(alias));
};

const normalizeDose = (doseInput: string): string => {
  const dose = doseInput.trim();
  const pattern = /^([0-9]+(?:\.[0-9]+)?)\s*(mcg|mg|g|kg|ml|l|iu)$/i;
  const match = dose.match(pattern);

  if (!match) {
    throw new Error("กรุณากรอกปริมาณ/ขนาด เป็นรูปแบบเช่น 500 mg หรือ 5 cc หรือ 2 tab ");
  }

  const amount = match[1];
  const unitRaw = match[2].toLowerCase();
  const unitMap: Record<string, string> = {
    mcg: "mcg",
    mg: "mg",
    g: "g",
    kg: "kg",
    ml: "mL",
    l: "L",
    iu: "IU",
  };

  return `${amount} ${unitMap[unitRaw]}`;
};

const normalizeDateInput = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const raw = value.trim();
  if (!raw) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const thaiDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!thaiDate) {
    throw new Error("รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้รูปแบบ YYYY-MM-DD หรือ DD/MM/YYYY");
  }

  const day = Number(thaiDate[1]);
  const month = Number(thaiDate[2]);
  let year = Number(thaiDate[3]);
  if (year > 2400) {
    year -= 543;
  }

  const normalized = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;

  if (Number.isNaN(new Date(normalized).getTime())) {
    throw new Error("วันที่ไม่ถูกต้อง");
  }

  return normalized;
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
};

const toRoutineMedication = (drug: PersonalDrug): RoutineMedication | null => {
  const pdId = drug.pd_id || drug.id;
  if (!pdId) {
    return null;
  }

  const dmId = drug.DrugMaster?.dm_id || drug.DrugMaster?.id || "";
  const drugName = drug.DrugMaster?.name || "ไม่ระบุชื่อยา";
  const dose = drug.DrugMaster?.dose || `${drug.amount || "-"} ${drug.amount_unit || ""}`.trim();
  const amount = (drug.amount || "1").trim();
  const amountUnit = (drug.amount_unit || "เม็ด").trim();
  const frequencyPerDay = Math.max(1, Number(drug.frequency || 1));
  const timeOfDay = (drug.time_of_day || "-").trim();
  const timing = (drug.timing || "หลังอาหาร").trim();
  const description = (drug.description || "").trim();
  const timeOfDayLabel = toThaiTimeOfDayListLabel(timeOfDay);

  return {
    id: pdId,
    pdId,
    name: drugName,
    dose,
    frequency: `${Math.min(MAX_FREQUENCY_PER_DAY, frequencyPerDay)} ครั้ง/วัน (${timeOfDayLabel})`,
    note: [timing, description].filter(Boolean).join(" | ") || "-",
    takeType: (drug.take_type || "regular") === "as_needed" ? "as_needed" : "regular",
    timeOfDay,
    timing,
    frequencyPerDay,
    amount,
    amountUnit,
    description: description || undefined,
    dmId,
    startDate: drug.start_date ? String(drug.start_date).slice(0, 10) : undefined,
    endDate: drug.end_date ? String(drug.end_date).slice(0, 10) : undefined,
  };
};

export function MedicalManagementView() {
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>("เช้า");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [mainSearchTerm, setMainSearchTerm] = useState("");
  const [detailSearchTerm, setDetailSearchTerm] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [printDateTime, setPrintDateTime] = useState<string>("");
  const debouncedHistorySearchTerm = useDebouncedValue(historySearchTerm, 400);
  const [selectedFloor, setSelectedFloor] = useState("ทุกชั้น");
  const [selectedHelpLevel, setSelectedHelpLevel] = useState("ทั้งหมด");
  const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
  const [historySortOrder, setHistorySortOrder] = useState<"newest" | "oldest">("newest");
  const [historySelectedDate, setHistorySelectedDate] = useState<Date | null>(null);
  const [detailsTab, setDetailsTab] = useState<"meds" | "history">("meds");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [medsDisplayMode, setMedsDisplayMode] = useState<"split" | "combined">("split");

  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [overviewPlans, setOverviewPlans] = useState<DrugPlan[]>([]);
  const [residentMedications, setResidentMedications] = useState<RoutineMedication[]>([]);
  const [historyItems, setHistoryItems] = useState<MedicationHistory[]>([]);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [selectedPatientDrugAllergies, setSelectedPatientDrugAllergies] = useState<string[]>([]);

  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const roomById = useMemo(() => {
    return new Map(rooms.map((room) => [getRoomPrimaryId(room), room] as const));
  }, [rooms]);

  const residentById = useMemo(() => {
    return new Map(residents.map((resident) => [getResidentPrimaryId(resident), resident] as const));
  }, [residents]);

  const residentNameToFloor = useMemo(() => {
    const map = new Map<string, number>();
    residents.forEach((resident) => {
      const room = resident.room_id ? roomById.get(resident.room_id) : undefined;
      const fullName = `${resident.first_name || ""} ${resident.last_name || ""}`.trim();
      const floor = room?.floor ?? resident.floor;
      if (fullName && typeof floor === "number") {
        map.set(fullName, floor);
      }
    });
    return map;
  }, [residents, roomById]);

  const ensureStaffIdentity = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    const firstName = currentUser?.first_name?.trim();
    const lastName = currentUser?.last_name?.trim();

    if (!firstName || !lastName) {
      throw new Error("ไม่พบชื่อเจ้าหน้าที่ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่");
    }

    return {
      staff_first_name: firstName,
      staff_last_name: lastName,
    };
  }, []);

  const loadReferenceData = useCallback(async () => {
    try {
      const [residentData, roomData] = await Promise.all([residentService.getAll(), roomService.getAll()]);
      setResidents((residentData || []).filter(isResidentActive));
      setRooms(roomData || []);
    } catch (error) {
      showToast({
        type: "error",
        title: "โหลดข้อมูลผู้พักไม่สำเร็จ",
        message: extractErrorMessage(error, "ไม่สามารถโหลดรายชื่อผู้พักหรือห้องพักได้"),
      });
    }
  }, [showToast]);

  const loadOverview = useCallback(async () => {
    setIsLoadingMain(true);
    try {
      const firstPage = await drugPlanService.getOverviewPaginated({
        page: 1,
        page_size: 100,
      });

      const allItems = [...(firstPage.items || [])];
      const totalPages = Math.max(1, firstPage.pagination.total_pages || 1);

      if (totalPages > 1) {
        // Fetch remaining pages sequentially to avoid stale data race conditions
        for (let p = 2; p <= totalPages; p++) {
          const page = await drugPlanService.getOverviewPaginated({
            page: p,
            page_size: 100,
          });
          allItems.push(...(page.items || []));
        }
      }

      setOverviewPlans(allItems);
    } catch (error) {
      showToast({
        type: "error",
        title: "โหลดรายการยาไม่สำเร็จ",
        message: extractErrorMessage(error, "ไม่สามารถโหลดรายการยาประจำวันได้"),
      });
    } finally {
      setIsLoadingMain(false);
    }
  }, [showToast]);

  const loadPatientMedicationList = useCallback(
    async (residentId: string) => {
      setIsLoadingDetails(true);
      try {
        const list = await personalDrugService.getByResidentAll(residentId);
        const mapped = list.map(toRoutineMedication).filter((item): item is RoutineMedication => item !== null);
        setResidentMedications(mapped);
      } catch (error) {
        showToast({
          type: "error",
          title: "โหลดข้อมูลยาไม่สำเร็จ",
          message: extractErrorMessage(error, "ไม่สามารถโหลดข้อมูลยาของผู้พักได้"),
        });
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [showToast]
  );

  const loadHistory = useCallback(
    async (page: number) => {
      setIsLoadingHistory(true);
      try {
        const response = await drugPlanService.getAdministrationHistory({
          date: historySelectedDate ? formatIsoDate(historySelectedDate) : undefined,
          search: debouncedHistorySearchTerm || undefined,
          status: toHistoryQueryStatus(selectedStatus),
          page,
          page_size: HISTORY_PAGE_SIZE,
        });

        const mapped: MedicationHistory[] = (response.items || []).map((item) => ({
          id: item.drug_plan_id,
          time: formatHistoryTime(item.action_at),
          actionAt: item.action_at || undefined,
          patientName: item.resident_name,
          medication: [item.drug_name, item.drug_dose].filter(Boolean).join(" "),
          status: toHistoryStatus(item.status),
          note: item.note || "-",
          givenBy: item.given_by_staff_name || "-",
        }));

        setHistoryItems(mapped);
        setHistoryTotalPages(Math.max(1, response.pagination.total_pages || 1));
      } catch (error) {
        showToast({
          type: "error",
          title: "โหลดประวัติไม่สำเร็จ",
          message: extractErrorMessage(error, "ไม่สามารถโหลดประวัติการให้ยาได้"),
        });
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [debouncedHistorySearchTerm, historySelectedDate, selectedStatus, showToast]
  );

  const ensureDrugMasterId = useCallback(async (name: string, dose: string): Promise<string> => {
    const normalizedName = name.trim().toLowerCase();
    const normalizedDose = dose.trim().toLowerCase();

    const masters = await drugMasterService.getAll();
    const existing = masters.find(
      (item) => item.name.trim().toLowerCase() === normalizedName && item.dose.trim().toLowerCase() === normalizedDose
    );

    if (existing?.dm_id || existing?.id) {
      return existing.dm_id || existing.id || "";
    }

    const created = await drugMasterService.create({ name: name.trim(), dose: dose.trim() });
    const id = created.dm_id || created.id;
    if (!id) {
      throw new Error("ไม่สามารถระบุรหัสรายการยาได้");
    }

    return id;
  }, []);

  const refreshAfterMutation = useCallback(async () => {
    await loadOverview();
    if (selectedPatientId) {
      await loadPatientMedicationList(selectedPatientId);
    }
  }, [loadOverview, loadPatientMedicationList, selectedPatientId]);

  const handleGiveMedication = useCallback(
    async (medication: Medication) => {
      if (!medication.drugPlanId) {
        throw new Error("ไม่พบรายการแผนให้ยาที่ต้องการอัปเดต");
      }

      // Optimistic update: mark as given immediately
      setOverviewPlans((prev) =>
        prev.map((p) =>
          (p.dpln_id || p.id) === medication.drugPlanId
            ? { ...p, is_taken: true, is_omitted: false }
            : p
        )
      );

      try {
        const staff = ensureStaffIdentity();
        await drugPlanService.takeById(medication.drugPlanId, staff);
        await refreshAfterMutation();

        showToast({
          type: "success",
          title: "บันทึกสำเร็จ",
          message: `บันทึกการให้ยา ${medication.name} เรียบร้อยแล้ว`,
        });
      } catch (error) {
        // Revert optimistic update on failure
        await loadOverview();
        throw error;
      }
    },
    [ensureStaffIdentity, refreshAfterMutation, loadOverview, showToast]
  );

  const handleWithholdMedication = useCallback(
    async (medication: Medication, payload: WithholdFormData) => {
      if (!medication.drugPlanId) {
        throw new Error("ไม่พบรายการแผนให้ยาที่ต้องการอัปเดต");
      }

      // Optimistic update: mark as omitted immediately
      setOverviewPlans((prev) =>
        prev.map((p) =>
          (p.dpln_id || p.id) === medication.drugPlanId
            ? { ...p, is_taken: false, is_omitted: true }
            : p
        )
      );

      try {
        const staff = ensureStaffIdentity();
        await drugPlanService.omitById(medication.drugPlanId, {
          ...staff,
          omitted_reason: payload.reason,
          note: payload.note || undefined,
        });
        await refreshAfterMutation();

        showToast({
          type: "success",
          title: "บันทึกสำเร็จ",
          message: `บันทึกการงดยา ${medication.name} เรียบร้อยแล้ว`,
        });
      } catch (error) {
        // Revert optimistic update on failure
        await loadOverview();
        throw error;
      }
    },
    [ensureStaffIdentity, refreshAfterMutation, loadOverview, showToast]
  );

  const handleGiveAllMeds = useCallback(
    async (patientId: string, payload: GiveAllFormData) => {
      const staff = ensureStaffIdentity();

      // Find all drug plan ids for this resident that match the currently selected time slot
      const plansToTake = overviewPlans
        .filter((plan) => {
          const personalDrug = plan.PersonalDrug;
          const residentId = personalDrug?.resident_id;
          const planId = plan.dpln_id || plan.id;
          if (!planId) return false;
          if (!residentId || residentId !== patientId) return false;
          if (!includesTimeSlot(personalDrug?.time_of_day, selectedTimeSlot)) return false;
          if (plan.is_taken) return false;
          if (plan.is_omitted) return false;
          return true;
        })
        .map((p) => p.dpln_id || p.id)
        .filter(Boolean) as string[];

      if (plansToTake.length === 0) {
        showToast({ type: "info", title: "ไม่มีรายการให้ยา", message: "ไม่พบรายการยาที่ต้องให้ในช่วงเวลานี้" });
        return;
      }

      // Optimistic update: mark those plans as taken immediately
      setOverviewPlans((prev) =>
        prev.map((p) => {
          const id = p.dpln_id || p.id;
          if (id && plansToTake.includes(id)) {
            return { ...p, is_taken: true, is_omitted: false };
          }
          return p;
        })
      );

      try {
        // Send take request for each plan individually to restrict to the selected time slot
        await Promise.all(
          plansToTake.map((id) =>
            drugPlanService.takeById(id, {
              ...staff,
              note: payload.note || undefined,
            })
          )
        );

        await refreshAfterMutation();

        showToast({
          type: "success",
          title: "บันทึกสำเร็จ",
          message: "บันทึกการให้ยาทั้งหมดของผู้พักเรียบร้อยแล้ว",
        });
      } catch (error) {
        // Revert optimistic update on failure
        await loadOverview();
        throw error;
      }
    },
    [ensureStaffIdentity, refreshAfterMutation, showToast, overviewPlans, selectedTimeSlot, loadOverview]
  );

  const handleAddMedication = useCallback(
    async (data: AddMedicationFormData) => {
      if (!selectedPatientId) {
        showToast({ type: "error", title: "ไม่พบผู้พัก", message: "กรุณาเลือกผู้พักก่อนเพิ่มรายการยา" });
        return;
      }

      setIsMutating(true);
      try {
        const dose = normalizeDose(data.dosage);
        const medicationName = data.medicationName.trim();
        if (!medicationName) {
          throw new Error("กรุณากรอกชื่อยา");
        }

        const dmId = await ensureDrugMasterId(medicationName, dose);
        const takeType = data.medicationType === "ประจำ" ? "regular" : "as_needed";
        const amount = data.amount.trim();
        const amountUnit = data.amountUnit.trim();
        const frequencyPerDay = Number(data.frequencyPerDay);

        if (!amount || !amountUnit) {
          throw new Error("กรุณาระบุจำนวนยาและหน่วยให้ครบถ้วน");
        }

        if (!Number.isFinite(frequencyPerDay) || frequencyPerDay <= 0) {
          throw new Error("กรุณาระบุความถี่ต่อวันให้ถูกต้อง");
        }

        if (frequencyPerDay > MAX_FREQUENCY_PER_DAY) {
          throw new Error("ความถี่ต่อวันต้องไม่เกิน 4 ครั้ง");
        }

        const startDate = takeType === "as_needed" ? normalizeDateInput(data.startDate) : undefined;
        const endDate = takeType === "as_needed" ? normalizeDateInput(data.endDate) : undefined;

        await personalDrugService.create({
          resident_id: selectedPatientId,
          dm_id: dmId,
          amount,
          amount_unit: amountUnit,
          frequency: frequencyPerDay,
          time_of_day: Array.isArray(data.route) ? data.route.join(",") : data.route,
          timing: data.administrationTiming,
          description: data.note || undefined,
          take_type: takeType,
          start_date: startDate,
          end_date: endDate,
        });

        setShowAddMedicationModal(false);
        await refreshAfterMutation();

        showToast({
          type: "success",
          title: "เพิ่มรายการยาแล้ว",
          message: `เพิ่มยา ${medicationName} สำเร็จ`,
        });
      } catch (error) {
        showToast({
          type: "error",
          title: "เพิ่มรายการยาไม่สำเร็จ",
          message: extractErrorMessage(error, "ไม่สามารถเพิ่มรายการยาได้"),
        });
      } finally {
        setIsMutating(false);
      }
    },
    [ensureDrugMasterId, refreshAfterMutation, selectedPatientId, showToast]
  );

  const handleEditMedication = useCallback(
    async (medication: RoutineMedication, data: EditMedicationFormData) => {
      setIsMutating(true);
      try {
        const dose = normalizeDose(data.dosage);
        const medicationName = data.medicationName.trim();
        if (!medicationName) {
          throw new Error("กรุณากรอกชื่อยา");
        }

        const dmId = await ensureDrugMasterId(medicationName, dose);
        const takeType = data.medicationType === "ประจำ" ? "regular" : "as_needed";
        const amount = data.amount.trim();
        const amountUnit = data.amountUnit.trim();
        const frequencyPerDay = Number(data.frequencyPerDay);

        if (!amount || !amountUnit) {
          throw new Error("กรุณาระบุจำนวนยาและหน่วยให้ครบถ้วน");
        }

        if (!Number.isFinite(frequencyPerDay) || frequencyPerDay <= 0) {
          throw new Error("กรุณาระบุความถี่ต่อวันให้ถูกต้อง");
        }

        if (frequencyPerDay > MAX_FREQUENCY_PER_DAY) {
          throw new Error("ความถี่ต่อวันต้องไม่เกิน 4 ครั้ง");
        }

        const startDate = takeType === "as_needed" ? normalizeDateInput(data.startDate) : undefined;
        const endDate = takeType === "as_needed" ? normalizeDateInput(data.endDate) : undefined;

        await personalDrugService.updateById(medication.pdId, {
          dm_id: dmId,
          amount,
          amount_unit: amountUnit,
          frequency: frequencyPerDay,
          time_of_day: Array.isArray(data.route) ? data.route.join(",") : data.route,
          timing: data.administrationTiming,
          description: data.note || undefined,
          take_type: takeType,
          start_date: startDate,
          end_date: endDate,
        });

        await refreshAfterMutation();

        showToast({
          type: "success",
          title: "แก้ไขสำเร็จ",
          message: `แก้ไขรายการยา ${medication.name} เรียบร้อยแล้ว`,
        });
      } catch (error) {
        showToast({
          type: "error",
          title: "แก้ไขไม่สำเร็จ",
          message: extractErrorMessage(error, "ไม่สามารถแก้ไขรายการยาได้"),
        });
      } finally {
        setIsMutating(false);
      }
    },
    [ensureDrugMasterId, refreshAfterMutation, showToast]
  );

  const handleDeleteMedication = useCallback(
    async (medicationId: string) => {
      setIsMutating(true);
      try {
        await personalDrugService.deleteById(medicationId);
        await refreshAfterMutation();

        showToast({
          type: "success",
          title: "ลบรายการยาแล้ว",
          message: "ลบรายการยาสำเร็จ",
        });
      } catch (error) {
        showToast({
          type: "error",
          title: "ลบรายการยาไม่สำเร็จ",
          message: extractErrorMessage(error, "ไม่สามารถลบรายการยาได้"),
        });
      } finally {
        setIsMutating(false);
      }
    },
    [refreshAfterMutation, showToast]
  );

  const handleOpenDetails = useCallback(
    async (patientId: string) => {
      setSelectedPatientId(patientId);
      setCurrentView("details");
      setDetailsTab("meds");
      setDetailSearchTerm("");
      await loadPatientMedicationList(patientId);
    },
    [loadPatientMedicationList]
  );

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (currentView !== "history" && !(currentView === "details" && detailsTab === "history")) {
      return;
    }

    void loadHistory(currentPage);
  }, [currentView, detailsTab, currentPage, loadHistory]);

  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatientDrugAllergies([]);
      return;
    }

    let isActive = true;

    const loadDrugAllergies = async () => {
      try {
        const items = await drugAllergyService.getByResident(selectedPatientId);
        const names = (items || [])
          .map((item) => item.drug_allergy?.allergy_name || item.allergy_name)
          .filter(Boolean) as string[];

        if (isActive) {
          setSelectedPatientDrugAllergies(Array.from(new Set(names)));
        }
      } catch {
        if (isActive) {
          setSelectedPatientDrugAllergies([]);
        }
      }
    };

    void loadDrugAllergies();

    return () => {
      isActive = false;
    };
  }, [selectedPatientId]);

  useEffect(() => {
    const handleBeforePrint = () => {
      const now = new Date();
      const thaiDate = now.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "2-digit" });
      const thaiTime = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setPrintDateTime(`${thaiDate} ${thaiTime}`);
      document.body.classList.add("print-drug-history");
    };
    const handleAfterPrint = () => {
      document.body.classList.remove("print-drug-history");
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const allPatientMedications = useMemo<PatientMedication[]>(() => {
    const patientsMap = new Map<string, PatientMedication>();

    overviewPlans.forEach((plan) => {
      const personalDrug = plan.PersonalDrug;
      const residentId = personalDrug?.resident_id;
      // Backend entity DrugPlan uses `dpln_id` as the JSON key for its primary key
      const planId = plan.dpln_id || plan.id;

      if (!planId) {
        return;
      }

      if (!includesTimeSlot(personalDrug?.time_of_day, selectedTimeSlot)) {
        return;
      }

      if (!residentId) {
        return;
      }

      const resident = residentById.get(residentId);
      const room = resident?.room_id ? roomById.get(resident.room_id) : undefined;
      const residentNameFromPlan = `${personalDrug?.Resident?.first_name || ""} ${personalDrug?.Resident?.last_name || ""}`.trim();
      const residentName = resident
        ? `${resident.first_name || ""} ${resident.last_name || ""}`.trim()
        : residentNameFromPlan || residentId;

      const floor = room?.floor ?? resident?.floor ?? 0;
      const roomText = room ? `ห้อง ${room.room_number} ชั้น ${room.floor}` : "ไม่ระบุห้อง";

      if (!patientsMap.has(residentId)) {
        patientsMap.set(residentId, {
          id: residentId,
          name: residentName,
          room: roomText,
          floor,
          profileImage: resident?.profile_image,
          allergies: parseListFromText(resident?.allergies),
          drugAllergies: parseListFromText(resident?.drug_allergies),
          helpLevel: toHelpLevel(resident?.resident_labels),
          medications: [],
          pendingCount: 0,
        });
      }

      const patient = patientsMap.get(residentId);
      if (!patient) {
        return;
      }

      const drugName = personalDrug?.DrugMaster?.name || "ไม่ทราบชื่อยา";
      const drugDose = personalDrug?.DrugMaster?.dose || "";
      const medicationName = [drugName, drugDose].filter(Boolean).join(" ").trim();
      const dosage = [
        personalDrug?.amount && personalDrug?.amount_unit
          ? `${personalDrug.amount} ${personalDrug.amount_unit}`
          : undefined,
        personalDrug?.timing,
        toThaiTimeOfDayLabel(personalDrug?.time_of_day),
      ]
        .filter(Boolean)
        .join(" | ");

      const medication: Medication = {
        id: planId,
        drugPlanId: planId,
        personalDrugId: personalDrug?.pd_id || personalDrug?.id || "",
        name: medicationName || "ไม่ทราบชื่อยา",
        dosage: dosage || "-",
        status: toThaiStatus(plan.is_taken, plan.is_omitted),
      };

      patient.medications.push(medication);
    });

    const allPatients = Array.from(patientsMap.values()).map((patient) => ({
      ...patient,
      medications: patient.medications,
      pendingCount: patient.medications.filter((item) => item.status === "รอให้").length,
    }));

    return allPatients.sort((a, b) => a.name.localeCompare(b.name));
  }, [overviewPlans, residentById, roomById, selectedTimeSlot]);

  const filteredPatients = useMemo(() => {
    return allPatientMedications.filter((patient) => {
      const matchesSearch = patient.name.toLowerCase().includes(mainSearchTerm.toLowerCase());
      const matchesFloor = selectedFloor === "ทุกชั้น" || String(patient.floor) === selectedFloor;
      const matchesHelp = selectedHelpLevel === "ทั้งหมด" || patient.helpLevel === selectedHelpLevel;
      return matchesSearch && matchesFloor && matchesHelp;
    });
  }, [allPatientMedications, mainSearchTerm, selectedFloor, selectedHelpLevel]);

  const visiblePatients = useMemo(() => {
    return filteredPatients.filter((patient) => patient.pendingCount > 0);
  }, [filteredPatients]);

  const selectedPatient = useMemo(() => {
    const patient = allPatientMedications.find((patient) => patient.id === selectedPatientId);
    if (!patient || !selectedPatientId) {
      return undefined;
    }

    // Enhance with additional resident data
    const resident = residentById.get(selectedPatientId);
    if (!resident) {
      return patient as PatientMedication & {
        chronicDiseases?: string[];
        surgicalHistory?: string[];
        drugAllergies?: string[];
        profileImage?: string;
        status?: string;
      };
    }

    return {
      ...patient,
      profileImage: resident.profile_image,
      chronicDiseases: parseListFromTextMulti(resident.pre_existing_conditions),
      surgicalHistory: parseListFromTextMulti(resident.surgical_history),
      drugAllergies: patient.drugAllergies || [],
      status: toStatusBadge(resident.resident_labels),
    };
  }, [allPatientMedications, selectedPatientId, residentById]);

  const routineMedications = useMemo(() => {
    return residentMedications.filter((item) => {
      const isRoutine = item.takeType === "regular";
      if (!isRoutine) {
        return false;
      }

      if (!detailSearchTerm) {
        return true;
      }

      const keyword = detailSearchTerm.toLowerCase();
      return item.name.toLowerCase().includes(keyword) || item.note.toLowerCase().includes(keyword);
    });
  }, [residentMedications, detailSearchTerm]);

  const prnMedications = useMemo(() => {
    return residentMedications.filter((item) => {
      const isPrn = item.takeType === "as_needed";
      if (!isPrn) {
        return false;
      }

      if (!detailSearchTerm) {
        return true;
      }

      const keyword = detailSearchTerm.toLowerCase();
      return item.name.toLowerCase().includes(keyword) || item.note.toLowerCase().includes(keyword);
    });
  }, [residentMedications, detailSearchTerm]);

  const historyBySelectedPatient = useMemo(() => {
    const sorted = [...historyItems].sort((a, b) => {
      const aTime = a.actionAt ? new Date(a.actionAt).getTime() : 0;
      const bTime = b.actionAt ? new Date(b.actionAt).getTime() : 0;
      return historySortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    const dateKey = historySelectedDate ? getBangkokDateKey(historySelectedDate.toISOString()) : null;
    const filteredByDate = dateKey
      ? sorted.filter((item) => getBangkokDateKey(item.actionAt) === dateKey)
      : sorted;

    if (!selectedPatient?.name) {
      return filteredByDate;
    }
    return filteredByDate.filter((item) => item.patientName === selectedPatient.name);
  }, [historyItems, historySelectedDate, historySortOrder, selectedPatient?.name]);

  const visibleHistory = useMemo(() => {
    const sorted = [...historyItems].sort((a, b) => {
      const aTime = a.actionAt ? new Date(a.actionAt).getTime() : 0;
      const bTime = b.actionAt ? new Date(b.actionAt).getTime() : 0;
      return historySortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    const dateKey = historySelectedDate ? getBangkokDateKey(historySelectedDate.toISOString()) : null;
    const filteredByDate = dateKey
      ? sorted.filter((item) => getBangkokDateKey(item.actionAt) === dateKey)
      : sorted;

    if (selectedFloor === "ทุกชั้น") {
      return filteredByDate;
    }

    const floor = Number(selectedFloor);
    if (Number.isNaN(floor)) {
      return filteredByDate;
    }

    return filteredByDate.filter((item) => residentNameToFloor.get(item.patientName) === floor);
  }, [historyItems, historySelectedDate, historySortOrder, residentNameToFloor, selectedFloor]);

  const pendingCount = useMemo(
    () => allPatientMedications.reduce((acc, patient) => acc + patient.pendingCount, 0),
    [allPatientMedications]
  );

  const completedCount = useMemo(
    () =>
      allPatientMedications.reduce(
        (acc, patient) => acc + patient.medications.filter((medication) => medication.status === "ให้ยา").length,
        0
      ),
    [allPatientMedications]
  );

  const getTimeSlotIcon = (slot: TimeSlot) => {
    switch (slot) {
      case "เช้า":
        return <Sunrise className="w-4 h-4" />;
      case "กลางวัน":
        return <Sun className="w-4 h-4" />;
      case "เย็น":
        return <Sunset className="w-4 h-4" />;
      case "ก่อนนอน":
        return <MoonStar className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleExport = () => {
    const now = new Date();
    const thaiDate = now.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "2-digit" });
    const thaiTime = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setPrintDateTime(`${thaiDate} ${thaiTime}`);
    document.body.classList.add("print-drug-history");
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const renderMainView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-5 font-bold text-gray-800">จัดการยา</h1>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTimeSlot(slot)}
              className={`px-4 py-2 rounded-full text-body-small font-medium transition-colors inline-flex items-center gap-2 ${
                selectedTimeSlot === slot
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {getTimeSlotIcon(slot)}
              {slot}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-40 px-6 py-3 bg-white border border-gray-300 rounded-lg text-center text-body-large font-semibold text-yellow-600">
            รอให้ยา <span className="ml-1">{pendingCount}</span>
          </div>
          <div className="min-w-40 px-6 py-3 bg-white border border-gray-300 rounded-lg text-center text-body-large font-semibold text-green-600">
            ให้ยาแล้ว <span className="ml-1">{completedCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              value={mainSearchTerm}
              onChange={(e) => setMainSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black"
            />
          </div>

          <span className="text-body-small text-gray-600">ชั้น</span>

          <Dropdown
            options={[
              { value: "ทุกชั้น", label: "ทุกชั้น" },
              ...[...new Set(rooms.map((room) => room.floor))]
                .sort((a, b) => a - b)
                .map((floor) => ({
                  value: String(floor),
                  label: String(floor),
                })),
            ]}
            value={selectedFloor}
            onChange={(value) => setSelectedFloor(value)}
            className="w-32"
          />

          <span className="text-body-small text-gray-600">ประเภท</span>

          <Dropdown
            options={[
              { value: "ทั้งหมด", label: "ทั้งหมด" },
              { value: "ช่วยเหลือตัวเองได้", label: "ช่วยเหลือตัวเองได้" },
              { value: "ต้องการความช่วยเหลือ", label: "ต้องการความช่วยเหลือ" },
              { value: "ติดเตียง", label: "ติดเตียง" },
            ]}
            value={selectedHelpLevel}
            onChange={(value) => setSelectedHelpLevel(value)}
            className="w-48"
          />
        </div>

        <button
          onClick={() => {
            setCurrentView("history");
            setCurrentPage(1);
          }}
          className="px-4 py-2 border-2 border-gray-300 bg-gray-100 text-gray-700 rounded-lg text-body-small font-medium hover:bg-gray-200 transition-colors"
        >
          [ ประวัติการให้ยา ]
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoadingMain ? (
          <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white py-12 px-4 text-center">
            <LoadingSpinner />
          </div>
        ) : visiblePatients.length === 0 ? (
          <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white py-12 px-4 text-center">
            <div className="text-sm text-gray-600">ไม่พบรายการยาที่ต้องดำเนินการ</div>
            <div className="text-xs text-gray-400 mt-1">รายการที่ให้ยาแล้วหรืองดแล้วจะถูกซ่อน และแยกตามช่วงเวลาที่เลือก</div>
          </div>
        ) : (
          visiblePatients.map((patient) => (
            <MedicationCard
              key={patient.id}
              patient={patient}
              onViewDetails={(id) => {
                void handleOpenDetails(id);
              }}
              onGiveMedication={handleGiveMedication}
              onWithholdMedication={handleWithholdMedication}
              onGiveAllMeds={handleGiveAllMeds}
            />
          ))
        )}
      </div>
    </div>
  );

  const renderDetailsView = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentView("main")}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-body-small font-medium">ย้อนกลับ</span>
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-headline-5 font-bold text-gray-800">ข้อมูลและประวัติการให้ยา</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDetailsTab("meds")}
              className={`px-4 py-2 rounded-md text-body-small font-medium transition-colors ${
                detailsTab === "meds"
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              ข้อมูลยา
            </button>
            <button
              onClick={() => {
                setDetailsTab("history");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-md text-body-small font-medium transition-colors ${
                detailsTab === "history"
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              ประวัติการให้ยา
            </button>
          </div>
        </div>
      </div>

      {selectedPatient ? (
        <PatientProfileCard
          name={selectedPatient.name}
          room={selectedPatient.room}
          allergies={selectedPatient.allergies}
          drugAllergies={
            selectedPatientDrugAllergies.length > 0
              ? selectedPatientDrugAllergies
              : selectedPatient.drugAllergies || []
          }
          chronicDiseases={selectedPatient.chronicDiseases || []}
          surgicalHistory={selectedPatient.surgicalHistory || []}
          profileImage={selectedPatient.profileImage}
          status={selectedPatient.status}
        />
      ) : null}

      {detailsTab === "meds" ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อยา..."
                value={detailSearchTerm}
                onChange={(e) => setDetailSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black"
              />
            </div>
            <button
              onClick={() => setShowAddMedicationModal(true)}
              disabled={!selectedPatientId || isMutating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-body-small font-medium hover:bg-blue-600 transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มยาใหม่</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-body-small text-gray-600">มุมมองตารางยา:</span>
            <button
              type="button"
              onClick={() => setMedsDisplayMode("split")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                medsDisplayMode === "split"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              แยกประเภท
            </button>
            <button
              type="button"
              onClick={() => setMedsDisplayMode("combined")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                medsDisplayMode === "combined"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ตารางรวม
            </button>
          </div>

          {isLoadingDetails ? (
            <div className="rounded-lg border border-gray-200 bg-white py-10 px-4 text-center">
              <LoadingSpinner />
            </div>
          ) : medsDisplayMode === "split" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-headline-7 font-semibold text-gray-800 mb-4">ยาประจำ</h3>
                <RoutineMedsTable
                  medications={routineMedications}
                  onAddMed={() => setShowAddMedicationModal(true)}
                  onEditMed={(medication, formData) => {
                    void handleEditMedication(medication, formData);
                  }}
                  onDeleteMed={(id) => {
                    void handleDeleteMedication(id);
                  }}
                  patientName={selectedPatient?.name}
                  patientRoom={selectedPatient?.room}
                  emptyMessage="ไม่พบรายการยาประจำ"
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-headline-7 font-semibold text-gray-800 mb-4">ยาตามอาการ / ชั่วคราว</h3>
                <RoutineMedsTable
                  medications={prnMedications}
                  onAddMed={() => setShowAddMedicationModal(true)}
                  onEditMed={(medication, formData) => {
                    void handleEditMedication(medication, formData);
                  }}
                  onDeleteMed={(id) => {
                    void handleDeleteMedication(id);
                  }}
                  patientName={selectedPatient?.name}
                  patientRoom={selectedPatient?.room}
                  emptyMessage="ไม่พบรายการยาตามอาการ / ชั่วคราว"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-headline-7 font-semibold text-gray-800 mb-4">ตารางยารวม</h3>
              <CombinedMedsTable
                routineMedications={routineMedications}
                prnMedications={prnMedications}
                onEditMed={() => {
                  showToast({
                    type: "info",
                    title: "คำแนะนำ",
                    message: "การแก้ไขข้อมูลยาในตอนนี้ให้ใช้มุมมองแยกประเภท",
                  });
                }}
                onDeleteMed={(id) => {
                  void handleDeleteMedication(id);
                }}
              />
            </div>
          )}

          <AddMedicationModal
            isOpen={showAddMedicationModal}
            onClose={() => setShowAddMedicationModal(false)}
            onSubmit={(data) => {
              void handleAddMedication(data);
            }}
          />
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <NoteTimelineControls
              selectedDate={historySelectedDate}
              onDateChange={(date) => {
                setHistorySelectedDate(date);
                setCurrentPage(1);
              }}
              sortOrder={historySortOrder}
              onSortOrderChange={(value) => {
                setHistorySortOrder(value);
                setCurrentPage(1);
              }}
            />
          </div>
          {isLoadingHistory ? <div className="py-6 text-center"><LoadingSpinner /></div> : null}
          <HistoryTable history={historyBySelectedPatient} />
        </div>
      )}
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-6">
      <button
        onClick={() => setCurrentView("main")}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-body-small font-medium">ย้อนกลับ</span>
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-headline-5 font-bold text-gray-800">ประวัติการให้ยา</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ..."
            value={historySearchTerm}
            onChange={(e) => {
              setHistorySearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black"
          />
        </div>

        <span className="text-body-small text-gray-600">ชั้น</span>

        <Dropdown
          options={[
            { value: "ทุกชั้น", label: "ทุกชั้น" },
            ...[...new Set(rooms.map((room) => room.floor))]
              .sort((a, b) => a - b)
              .map((floor) => ({
                value: String(floor),
                label: String(floor),
              })),
          ]}
          value={selectedFloor}
          onChange={(value) => {
            setSelectedFloor(value);
            setCurrentPage(1);
          }}
          className="w-32"
        />

        <span className="text-body-small text-gray-600">สถานะ</span>

        <Dropdown
          options={[
            { value: "ทั้งหมด", label: "ทั้งหมด" },
            { value: "ให้แล้ว", label: "ให้แล้ว" },
            { value: "งด", label: "งด" },
            { value: "รอให้", label: "รอให้" },
          ]}
          value={selectedStatus}
          onChange={(value) => {
            setSelectedStatus(value);
            setCurrentPage(1);
          }}
          className="w-32"
        />

        <div className="ml-auto">
          <NoteTimelineControls
            selectedDate={historySelectedDate}
            onDateChange={(date) => {
              setHistorySelectedDate(date);
              setCurrentPage(1);
            }}
            sortOrder={historySortOrder}
            onSortOrderChange={(value) => {
              setHistorySortOrder(value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button
            className="print-hide flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-body-small font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
            onClick={handleExport}
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ / Export PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {isLoadingHistory ? (
          <div className="py-6 text-center">
            <LoadingSpinner />
          </div>
        ) : null}
        <HistoryTable history={visibleHistory} />
        <Pagination currentPage={currentPage} totalPages={historyTotalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto">
        {currentView === "main" && renderMainView()}
        {currentView === "details" && renderDetailsView()}
        {currentView === "history" && renderHistoryView()}
      </div>

      <style>{`
        .print-hide {
          display: inline-flex;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }

          :global(html, body) {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: block !important;
          }

          :global(body.print-drug-history *) {
            visibility: hidden !important;
          }
          :global(body.print-drug-history [style*="min-h-screen"]),
          :global(body.print-drug-history [style*="min-h-screen"] *) {
            visibility: visible !important;
          }

          .print-hide {
            display: none !important;
          }

          table {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
