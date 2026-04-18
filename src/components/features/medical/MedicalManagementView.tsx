"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  Download,
  Plus,
  Sunrise,
  Sun,
  Sunset,
  MoonStar,
} from "lucide-react";
import { MedicationCard } from "./MedicationCard";
import { PatientProfileCard } from "./PatientProfileCard";
import { RoutineMedsTable } from "./tables/RoutineMedsTable";
import { CombinedMedsTable } from "./tables/CombinedMedsTable";
import { HistoryTable } from "./tables/HistoryTable";
import { Pagination } from "@/components/ui/pagination";
import { DatePicker } from "@/components/ui/date-picker";
import { AddMedicationModal } from "./modals";
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
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import type { DrugAdministrationStatus, DrugPlan } from "@/types/drug-plan";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

type ViewType = "main" | "details" | "history";

const TIME_SLOTS: TimeSlot[] = ["เช้า", "กลางวัน", "เย็น", "ก่อนนอน"];
const HISTORY_PAGE_SIZE = 10;

const getResidentPrimaryId = (resident: Resident): string => resident.resident_id || resident.id;
const getRoomPrimaryId = (room: Room): string => room.room_id || room.id;

const toHelpLevel = (careLevel?: string): string => {
  switch ((careLevel || "").toLowerCase()) {
    case "general":
      return "ช่วยเหลือตัวเองได้";
    case "partial_assist":
      return "ต้องการความช่วยเหลือ";
    case "bedridden":
      return "ติดเตียง";
    default:
      return "-";
  }
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

const parseDateValue = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!isoMatch) {
    return null;
  }

  const year = Number(isoMatch[1]);
  const month = Number(isoMatch[2]);
  const day = Number(isoMatch[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return date;
  }

  return null;
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

  return {
    id: pdId,
    pdId,
    name: drugName,
    dose,
    frequency: `${frequencyPerDay} ครั้ง/วัน (${timeOfDay})`,
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
  const debouncedHistorySearchTerm = useDebouncedValue(historySearchTerm, 400);
  const [selectedFloor, setSelectedFloor] = useState("ทุกชั้น");
  const [selectedHelpLevel, setSelectedHelpLevel] = useState("ทั้งหมด");
  const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
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

  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const [selectedDate, setSelectedDate] = useState(formatIsoDate(new Date()));
  const datePickerClassName =
    "w-[200px] [&>button]:w-full [&>button]:justify-between [&>button]:border-2 [&>button]:border-blue-500 [&>button]:hover:bg-blue-50";

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
      setResidents(residentData || []);
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
      const overview = await drugPlanService.getOverviewPaginated({
        time_of_day: selectedTimeSlot,
      });
      setOverviewPlans(overview.items || []);
    } catch (error) {
      showToast({
        type: "error",
        title: "โหลดรายการยาไม่สำเร็จ",
        message: extractErrorMessage(error, "ไม่สามารถโหลดรายการยาประจำวันได้"),
      });
    } finally {
      setIsLoadingMain(false);
    }
  }, [selectedTimeSlot, showToast]);

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
          date: selectedDate || undefined,
          search: debouncedHistorySearchTerm || undefined,
          status: toHistoryQueryStatus(selectedStatus),
          page,
          page_size: HISTORY_PAGE_SIZE,
        });

        const mapped: MedicationHistory[] = (response.items || []).map((item) => ({
          id: item.drug_plan_id,
          time: formatHistoryTime(item.action_at),
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
    [debouncedHistorySearchTerm, selectedDate, selectedStatus, showToast]
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

      const staff = ensureStaffIdentity();
      await drugPlanService.takeById(medication.drugPlanId, staff);
      await refreshAfterMutation();

      showToast({
        type: "success",
        title: "บันทึกสำเร็จ",
        message: `บันทึกการให้ยา ${medication.name} เรียบร้อยแล้ว`,
      });
    },
    [ensureStaffIdentity, refreshAfterMutation, showToast]
  );

  const handleWithholdMedication = useCallback(
    async (medication: Medication, payload: WithholdFormData) => {
      if (!medication.drugPlanId) {
        throw new Error("ไม่พบรายการแผนให้ยาที่ต้องการอัปเดต");
      }

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
    },
    [ensureStaffIdentity, refreshAfterMutation, showToast]
  );

  const handleGiveAllMeds = useCallback(
    async (patientId: string, payload: GiveAllFormData) => {
      const staff = ensureStaffIdentity();
      await drugPlanService.takeByResidentToday(patientId, {
        ...staff,
        note: payload.note || undefined,
      });
      await refreshAfterMutation();

      showToast({
        type: "success",
        title: "บันทึกสำเร็จ",
        message: "บันทึกการให้ยาทั้งหมดของผู้พักเรียบร้อยแล้ว",
      });
    },
    [ensureStaffIdentity, refreshAfterMutation, showToast]
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

        const startDate = takeType === "as_needed" ? normalizeDateInput(data.startDate) : undefined;
        const endDate = takeType === "as_needed" ? normalizeDateInput(data.endDate) : undefined;

        await personalDrugService.create({
          resident_id: selectedPatientId,
          dm_id: dmId,
          amount,
          amount_unit: amountUnit,
          frequency: frequencyPerDay,
          time_of_day: data.route,
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

        const startDate = takeType === "as_needed" ? normalizeDateInput(data.startDate) : undefined;
        const endDate = takeType === "as_needed" ? normalizeDateInput(data.endDate) : undefined;

        await personalDrugService.updateById(medication.pdId, {
          dm_id: dmId,
          amount,
          amount_unit: amountUnit,
          frequency: frequencyPerDay,
          time_of_day: data.route,
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

  const allPatientMedications = useMemo<PatientMedication[]>(() => {
    const patientsMap = new Map<string, PatientMedication>();

    overviewPlans.forEach((plan) => {
      const personalDrug = plan.PersonalDrug;
      const residentId = personalDrug?.resident_id;
      const planId = plan.dpln_id || plan.id;

      if (!residentId || !planId) {
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
          allergies: parseListFromText(resident?.drug_allergies || resident?.allergies),
          helpLevel: toHelpLevel(resident?.care_level),
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
        personalDrug?.time_of_day,
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
  }, [overviewPlans, residentById, roomById]);

  const filteredPatients = useMemo(() => {
    return allPatientMedications.filter((patient) => {
      const matchesSearch = patient.name.toLowerCase().includes(mainSearchTerm.toLowerCase());
      const matchesFloor = selectedFloor === "ทุกชั้น" || String(patient.floor) === selectedFloor;
      const matchesHelp = selectedHelpLevel === "ทั้งหมด" || patient.helpLevel === selectedHelpLevel;
      return matchesSearch && matchesFloor && matchesHelp;
    });
  }, [allPatientMedications, mainSearchTerm, selectedFloor, selectedHelpLevel]);

  const selectedPatient = useMemo(
    () => allPatientMedications.find((patient) => patient.id === selectedPatientId),
    [allPatientMedications, selectedPatientId]
  );

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
    if (!selectedPatient?.name) {
      return historyItems;
    }
    return historyItems.filter((item) => item.patientName === selectedPatient.name);
  }, [historyItems, selectedPatient?.name]);

  const visibleHistory = useMemo(() => {
    if (selectedFloor === "ทุกชั้น") {
      return historyItems;
    }

    const floor = Number(selectedFloor);
    if (Number.isNaN(floor)) {
      return historyItems;
    }

    return historyItems.filter((item) => residentNameToFloor.get(item.patientName) === floor);
  }, [historyItems, residentNameToFloor, selectedFloor]);

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

  const renderMainView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-5 font-bold text-gray-800">จัดการยา</h1>
        <DatePicker
          value={parseDateValue(selectedDate)}
          onChange={(date) => {
            setSelectedDate(date ? formatIsoDate(date) : "");
            setCurrentPage(1);
          }}
          placeholder="เลือกวันที่"
          className={datePickerClassName}
        />
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

          <div className="relative">
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
            >
              <option>ทุกชั้น</option>
              {[...new Set(rooms.map((room) => room.floor))]
                .sort((a, b) => a - b)
                .map((floor) => (
                  <option key={floor} value={String(floor)}>
                    {floor}
                  </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <span className="text-body-small text-gray-600">การช่วยเหลือตัวเอง</span>

          <div className="relative">
            <select
              value={selectedHelpLevel}
              onChange={(e) => setSelectedHelpLevel(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
            >
              <option>ทั้งหมด</option>
              <option>ช่วยเหลือตัวเองได้</option>
              <option>ต้องการความช่วยเหลือ</option>
              <option>ติดเตียง</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
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
          <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white py-12 px-4 text-center text-sm text-gray-600">
            กำลังโหลดรายการยา...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white py-12 px-4 text-center">
            <div className="text-sm text-gray-600">ไม่พบรายชื่อผู้พัก</div>
            <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองชั้นและการช่วยเหลือตัวเอง</div>
          </div>
        ) : (
          filteredPatients.map((patient) => (
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

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-5 font-bold text-gray-800">ข้อมูลและประวัติการให้ยา</h1>
          <p className="text-body-small text-gray-500 mt-3">{selectedPatient?.name || "-"}</p>
        </div>

        <div className="flex flex-col items-end gap-3">
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

          <DatePicker
            value={parseDateValue(selectedDate)}
            onChange={(date) => {
              setSelectedDate(date ? formatIsoDate(date) : "");
              setCurrentPage(1);
            }}
            placeholder="เลือกวันที่"
            className={datePickerClassName}
          />
        </div>
      </div>

      {selectedPatient ? (
        <PatientProfileCard
          name={selectedPatient.name}
          room={selectedPatient.room}
          allergies={selectedPatient.allergies}
          chronicDiseases={[]}
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
            <div className="rounded-lg border border-gray-200 bg-white py-10 px-4 text-center text-sm text-gray-600">
              กำลังโหลดข้อมูลรายการยา...
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
          {isLoadingHistory ? <div className="py-6 text-center text-sm text-gray-600">กำลังโหลดประวัติ...</div> : null}
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

        <div className="relative">
          <select
            value={selectedFloor}
            onChange={(e) => {
              setSelectedFloor(e.target.value);
              setCurrentPage(1);
            }}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
          >
            <option>ทุกชั้น</option>
            {[...new Set(rooms.map((room) => room.floor))]
              .sort((a, b) => a - b)
              .map((floor) => (
                <option key={floor} value={String(floor)}>
                  {floor}
                </option>
              ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <span className="text-body-small text-gray-600">สถานะ</span>

        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
          >
            <option>ทั้งหมด</option>
            <option>ให้แล้ว</option>
            <option>งด</option>
            <option>รอให้</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <DatePicker
            value={parseDateValue(selectedDate)}
            onChange={(date) => {
              setSelectedDate(date ? formatIsoDate(date) : "");
              setCurrentPage(1);
            }}
            placeholder="เลือกวันที่"
            className={datePickerClassName}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-body-small font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
            onClick={() => {
              showToast({
                type: "info",
                title: "ยังไม่รองรับ",
                message: "ฟังก์ชันพิมพ์/Export PDF จะพัฒนาในขั้นถัดไป",
              });
            }}
          >
            <Download className="w-4 h-4" />
            <span>พิมพ์ / Export PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {isLoadingHistory ? (
          <div className="py-6 text-center text-sm text-gray-600">กำลังโหลดประวัติ...</div>
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
    </div>
  );
}
