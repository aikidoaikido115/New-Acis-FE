"use client";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { isResidentActive, residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { drugMasterService } from "@/services/drug-master.service";
import { personalDrugService } from "@/services/personal-drug.service";
import { allergyService } from "../../../services/allergy.service";
import { drugAllergyService } from "../../../services/drug-allergy.service";
import { intakeService } from "@/services/intake.service";
import type { PersonalDrug } from "../../../services/personal-drug.service";
import type { ResidentAllergyItem } from "../../../services/allergy.service";
import type { ResidentDrugAllergyItem } from "../../../services/drug-allergy.service";
import { useToast } from "@/components/ui/toast";
import type { ResidentFormState, CreateResidentRequest, Resident as ApiResident, Medication } from "@/types/resident";
import type { Resident } from "@/types/elder";
import type { Room } from "@/types/room";
import { ResidentFormModal } from "@/components/features/elder-info/ResidentFormModal";
import { RelativeViewModal } from "@/components/features/elder-info/RelativeViewModal";
import { ResidentDetailModal } from "@/components/features/elder-info/ResidentDetailModal";
import { ElderTableFilter } from "@/components/features/elder-info/info-table-filter";
import { ElderTable } from "@/components/features/elder-info/elder-table";
import { ElderTablePagination } from "@/components/features/elder-info/pagination";

const ITEMS_PER_PAGE = 10;

// ปรับค่า Default เผื่อกรณีคนที่ไม่ได้กรอก Label แต่มีคะแนน ADL แทน
export const determineCareLevel = (adlScore?: number) => {
  if (adlScore === undefined || adlScore === null) return "";
  if (adlScore <= 5) return "ผู้สูงอายุติดเตียง";
  if (adlScore <= 11) return "ช่วยเหลือตัวเองได้บางส่วน";
  return "ผู้สูงอายุทั่วไป";
};

// ดึงชื่อ Label จาก DB มาแสดงผลตรงๆ เลย
export const resolveCareLevelFromLabels = (labels?: ApiResident["resident_labels"]) => {
  if (!labels || labels.length === 0) return "";
  return labels[0].intake_label?.label_name || "";
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543; // Convert to Buddhist year
  return `${day}/${month}/${year}`;
};

const frequencyTokensByValue: Record<string, string[]> = {
  morning: ["morning"],
  noon: ["noon"],
  evening: ["evening"],
  bedtime: ["bedtime"],
  morning_noon: ["morning", "noon"],
  morning_evening: ["morning", "evening"],
  morning_bedtime: ["morning", "bedtime"],
  noon_evening: ["noon", "evening"],
  noon_bedtime: ["noon", "bedtime"],
  evening_bedtime: ["evening", "bedtime"],
  morning_noon_evening: ["morning", "noon", "evening"],
  morning_noon_bedtime: ["morning", "noon", "bedtime"],
  morning_evening_bedtime: ["morning", "evening", "bedtime"],
  noon_evening_bedtime: ["noon", "evening", "bedtime"],
  four_times: ["morning", "noon", "evening", "bedtime"],
};

const timeOfDayAliasMap: Record<string, string> = {
  เช้า: "morning",
  กลางวัน: "noon",
  เย็น: "evening",
  ก่อนนอน: "bedtime",
  morning: "morning",
  noon: "noon",
  evening: "evening",
  bedtime: "bedtime",
};

const orderedTimeTokens = ["morning", "noon", "evening", "bedtime"];

export const frequencyToTimeOfDay = (value: string) => {
  const tokens = frequencyTokensByValue[value];
  if (!tokens) return null;
  return {
    frequency: tokens.length,
    timeOfDay: tokens.join(","),
  };
};

export const timeOfDayToFrequencyValue = (timeOfDay?: string | null) => {
  if (!timeOfDay) return "";
  const tokens = timeOfDay
    .split(",")
    .map((token) => timeOfDayAliasMap[token.trim().toLowerCase()] || "")
    .filter(Boolean);

  if (tokens.length === 0) return "";
  const uniqueTokens = Array.from(new Set(tokens));
  const orderedTokens = orderedTimeTokens.filter((token) => uniqueTokens.includes(token));
  if (orderedTokens.length === 4) return "four_times";
  return orderedTokens.join("_");
};

export const timingToMealType = (timing?: string | null) => {
  if (!timing) return "";
  const normalized = timing.toLowerCase();
  if (normalized.includes("ก่อน") || normalized.includes("before")) return "before_meal";
  if (normalized.includes("หลัง") || normalized.includes("after")) return "after_meal";
  return "";
};

export const mealTypeToTiming = (mealType?: string) => {
  if (mealType === "before_meal") return "ก่อนอาหาร";
  if (mealType === "after_meal") return "หลังอาหาร";
  return "";
};

export const parseDose = (dose: string) => {
  const trimmed = dose.trim();
  const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return null;
  const amount = match[1];
  const unit = match[2].trim();
  if (!unit) return null;
  return { amount, unit };
};

const transformResidentData = (apiResident: ApiResident): Resident => {
  const fullName = `${apiResident.first_name} ${apiResident.last_name}`;
  
  const labelBasedCareLevel = resolveCareLevelFromLabels(apiResident.resident_labels);
  const careLevel = labelBasedCareLevel || determineCareLevel(apiResident.adl_score);
  
  const isActive = isResidentActive({
    status: apiResident.status,
    check_in_date: apiResident.check_in_date,
    expected_check_out_date: apiResident.expected_check_out_date,
  });

  const backendId = apiResident.id || (apiResident as any).resident_id || "";

  return {
    id: backendId,
    name: fullName,
    nickname: apiResident.nickname || "-",
    room: apiResident.room_id || "",
    floor: apiResident.floor || 0,
    care: careLevel,
    admitted: formatDate(apiResident.check_in_date),
    discharged: formatDate(apiResident.expected_check_out_date),
    active: isActive,
  };
};

export default function Page() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [editingInitialValues, setEditingInitialValues] = useState<ResidentFormState | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isRelativeViewModalOpen, setIsRelativeViewModalOpen] = useState(false);
  const [relativeViewResidentName, setRelativeViewResidentName] = useState<string | null>(null);
  const [relativeViewResidentId, setRelativeViewResidentId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailResidentId, setDetailResidentId] = useState<string | null>(null);
  const [drugMasterOptions, setDrugMasterOptions] = useState<Array<{ value: string; label: string; name: string; dose?: string }>>([]);
  const originalMedicationIdsRef = useRef<string[]>([]);

  // Data state
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedCareType, setSelectedCareType] = useState("all");
  const [showActive, setShowActive] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const availableFloors = useMemo(() => {
    return Array.from(
      new Set(
        rooms
          .map((room) => String(room.floor))
          .filter((floor) => floor && floor !== "0" && floor !== "undefined")
      )
    ).sort((a, b) => Number(a) - Number(b));
  }, [rooms]);

  const roomFloorMap = useMemo(() => {
    const map = new Map<string, number>();
    rooms.forEach((room) => {
      const id = (room as { room_id?: string | number; id?: string | number }).room_id ?? room.id;
      if (id) map.set(String(id), Number(room.floor));
    });
    return map;
  }, [rooms]);

  const mapResidentToFormState = (resident: ApiResident, overrides: Partial<ResidentFormState> = {}): ResidentFormState => {
    const toDateString = (value?: string) => (value ? value.split("T")[0] || value : "");
    const roomKey = resident.room_id || (resident as any).room_id || "";
    const resolvedFloor = roomKey ? roomFloorMap.get(String(roomKey)) : undefined;
    const labelBasedCareLevel = resolveCareLevelFromLabels(resident.resident_labels);
    const fallbackCareLevel = labelBasedCareLevel || determineCareLevel(resident.adl_score);

    const baseState: ResidentFormState = {
      status: resident.status || "",
      firstName: resident.first_name || "",
      lastName: resident.last_name || "",
      nickname: resident.nickname || "",
      gender: resident.gender || "",
      dateOfBirth: toDateString(resident.date_of_birth),
      idCardNumber: resident.id_card_number || "",
      purpose: resident.purpose_of_stay || "",
      admitDate: toDateString(resident.check_in_date),
      expectedDischargeDate: toDateString(resident.expected_check_out_date),
      roomId: resident.room_id || "",
      floor: resolvedFloor ? String(resolvedFloor) : resident.floor ? String(resident.floor) : "",
      profileImage: null,
      profileImagePreview: resident.profile_image || "",
      chronicDiseases: resident.pre_existing_conditions || "",
      chronicDiseasesNote: resident.pre_existing_conditions_notes || "",
      medications: [],
      surgicalHistory: resident.surgical_history || "",
      drugAllergies: "",
      foodAllergies: "",
      adlScore: resident.adl_score !== undefined && resident.adl_score !== null ? String(resident.adl_score) : "",
      careLevel: fallbackCareLevel || "", 
      cprStatus: resident.resuscitation_status || "",
      emergencyHospital: resident.preferred_emergency_hospital || "",
      emergencyHospitalPhone: resident.emergency_hospital_phone || "",
      emergencyContacts: resident.emergency_contacts || [],
    };

    return {
      ...baseState,
      ...overrides,
    };
  };

  const fetchResidents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await residentService.getAll();
      const transformedData = data.map(transformResidentData);
      setAllResidents(transformedData);
    } catch (err: any) {
      const statusCode = err?.status_code || err?.response?.status || 0;
      let message = "ไม่สามารถโหลดข้อมูลผู้สูงอายุได้";

      if (statusCode === 401) {
        message = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง";
        showToast({ type: "error", title: "เซสชันหมดอายุ", message });
        router.push("/login");
        return;
      } else if (statusCode === 0) {
        message = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ";
      } else if (statusCode === 500) {
        message = "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์";
      } else {
        message = err?.message || err?.response?.data?.message || message;
      }

      setError(message);
      showToast({ type: "error", title: "โหลดข้อมูลไม่สำเร็จ", message });
    } finally {
      setIsLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomService.getAll();
        setRooms(data || []);
      } catch (err) {
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchDrugMasters = async () => {
      try {
        const data = await drugMasterService.getAll();
        const options = data
          .map((item) => {
            const id = item.dm_id || item.id || "";
            if (!id) return null;
            const label = item.dose ? `${item.name} (${item.dose})` : item.name;
            return { value: id, label, name: item.name, dose: item.dose };
          })
          .filter(Boolean) as Array<{ value: string; label: string; name: string; dose?: string }>;
        setDrugMasterOptions(options);
      } catch (err: any) {
        showToast({ type: "error", title: "โหลดรายการยาไม่สำเร็จ", message: "ไม่สามารถโหลดรายการยาจากระบบได้" });
        setDrugMasterOptions([]);
      }
    };
    fetchDrugMasters();
  }, [showToast]);

  const roomNumberMap = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((room) => {
      const roomId = room.id || (room as any).room_id;
      if (roomId) map.set(roomId, room.room_number);
    });
    return map;
  }, [rooms]);

  const filteredResidents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allResidents
      .map((resident) => {
        const mappedFloor = roomFloorMap.get(resident.room);
        return {
          ...resident,
          floor: mappedFloor ?? resident.floor,
        };
      })
      .filter((resident) => {
        const matchesSearch =
          !normalizedSearch ||
          resident.name.toLowerCase().includes(normalizedSearch) ||
          resident.nickname.toLowerCase().includes(normalizedSearch);

        const matchesFloor = selectedFloor === "all" || resident.floor.toString() === selectedFloor;
        
        const matchesCareType = 
          selectedCareType === "all" || 
          (resident.care && resident.care.includes(selectedCareType)) || 
          (selectedCareType && selectedCareType.includes(resident.care));

        const matchesActive = showActive ? resident.active === true : resident.active === false;

        return matchesSearch && matchesFloor && matchesCareType && matchesActive;
      });
  }, [allResidents, roomFloorMap, searchTerm, selectedFloor, selectedCareType, showActive]);

  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredResidents.slice(startIndex, endIndex).map(resident => ({
      ...resident,
      care: resident.care || "-",
      room: roomNumberMap.get(resident.room) || resident.room || "-",
    }));
  }, [filteredResidents, currentPage, ITEMS_PER_PAGE, roomNumberMap]);

  const totalPages = Math.ceil(filteredResidents.length / ITEMS_PER_PAGE);
  const totalItems = filteredResidents.length;
  const startItem = filteredResidents.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const handleFilterChange = (filterFn: () => void) => {
    filterFn();
    setCurrentPage(1);
  };

  const normalizeLines = (value: string) =>
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

  const normalizePhone = (value?: string) => value?.replace(/\D/g, "") || "";

  const toRFC3339 = (value?: string) => {
    if (!value) return undefined;
    if (value.includes("T")) return value;
    return `${value}T00:00:00+07:00`;
  };

  const getApiErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback;

  const appendFormValue = (form: FormData, key: string, value?: string | null) => {
    if (value === undefined || value === null) return;
    const trimmed = value.trim();
    if (trimmed === "") return;
    form.append(key, trimmed);
  };

  const buildResidentFormData = (formData: ResidentFormState, labels?: Array<{ label_name: string; note_text?: string }>) => {
    const form = new FormData();
    const emergencyPhone = normalizePhone(formData.emergencyHospitalPhone);
    const cleanedContacts = formData.emergencyContacts
      .map((contact) => ({
        name: contact.name.trim(),
        relation: contact.relation.trim(),
        phone: normalizePhone(contact.phone),
      }))
      .filter((contact) => contact.name || contact.relation || contact.phone);

    appendFormValue(form, "first_name", formData.firstName);
    appendFormValue(form, "last_name", formData.lastName);
    appendFormValue(form, "gender", formData.gender);
    appendFormValue(form, "status", formData.status);
    appendFormValue(form, "date_of_birth", toRFC3339(formData.dateOfBirth) || "");

    appendFormValue(form, "nickname", formData.nickname || "");
    appendFormValue(form, "id_card_number", formData.idCardNumber || "");
    appendFormValue(form, "purpose_of_stay", formData.purpose || "");
    appendFormValue(form, "check_in_date", toRFC3339(formData.admitDate) || "");
    appendFormValue(form, "expected_check_out_date", toRFC3339(formData.expectedDischargeDate) || "");
    appendFormValue(form, "room_id", formData.roomId || "");

    appendFormValue(form, "pre_existing_conditions", formData.chronicDiseases || "");
    appendFormValue(form, "pre_existing_conditions_notes", formData.chronicDiseasesNote || "");
    appendFormValue(form, "surgical_history", formData.surgicalHistory || "");
    appendFormValue(form, "resuscitation_status", formData.cprStatus || "");
    appendFormValue(form, "preferred_emergency_hospital", formData.emergencyHospital || "");
    appendFormValue(form, "emergency_hospital_phone", emergencyPhone || "");

    if (cleanedContacts.length > 0) {
      form.append("emergency_contacts", JSON.stringify(cleanedContacts));
    }
    if (labels && labels.length > 0) {
      form.append("labels", JSON.stringify(labels));
    }
    if (formData.profileImage) {
      form.append("profile_image", formData.profileImage);
    }

    return form;
  };

  const buildResidentPayload = (formData: ResidentFormState, labels?: Array<{ label_name: string; note_text?: string }>): CreateResidentRequest => {
    const emergencyPhone = normalizePhone(formData.emergencyHospitalPhone);
    const idCardNumber = formData.idCardNumber.trim();
    const checkInDate = toRFC3339(formData.admitDate);
    const expectedCheckOutDate = toRFC3339(formData.expectedDischargeDate);
    const roomId = formData.roomId.trim();
    const cleanedContacts = formData.emergencyContacts
      .map((contact) => ({
        name: contact.name.trim(),
        relation: contact.relation.trim(),
        phone: normalizePhone(contact.phone),
      }))
      .filter((contact) => contact.name || contact.relation || contact.phone);

    const payload: CreateResidentRequest = {
    first_name: formData.firstName,
    last_name: formData.lastName,
    nickname: formData.nickname || undefined,
    gender: formData.gender,
    date_of_birth: toRFC3339(formData.dateOfBirth) as string,
    id_card_number: idCardNumber || undefined,
    purpose_of_stay: formData.purpose || undefined,
    check_in_date: checkInDate || undefined,
    expected_check_out_date: expectedCheckOutDate || undefined,
    room_id: roomId || undefined,
    pre_existing_conditions: formData.chronicDiseases || undefined,
    pre_existing_conditions_notes: formData.chronicDiseasesNote || undefined,
    surgical_history: formData.surgicalHistory || undefined,
    resuscitation_status: formData.cprStatus || undefined,
    preferred_emergency_hospital: formData.emergencyHospital || undefined,
    emergency_hospital_phone: emergencyPhone || undefined,
    emergency_contacts: cleanedContacts.length > 0 ? cleanedContacts : undefined,
    profile_image: formData.profileImagePreview || undefined,
    status: formData.status,
  };

    if (labels && labels.length > 0) {
      payload.labels = labels;
    }

    return payload;
  };

  const syncAllergies = async (residentId: string, foodAllergies: string, drugAllergies: string) => {
    const foodNames = normalizeLines(foodAllergies);
    await allergyService.createByResident(
      residentId, 
      foodNames.map((name) => ({ allergy_name: name }))
    );

    const drugNames = normalizeLines(drugAllergies);
    await drugAllergyService.createByResident(
      residentId, 
      drugNames.map((name) => ({ allergy_name: name }))
    );
  };

  const ensureDrugMaster = async (name: string, dose: string) => {
    const matched = drugMasterOptions.find(
      (option) => option.name === name && (option.dose || "") === (dose || "")
    );
    if (matched) return matched;

    const created = await drugMasterService.create({ name, dose });
    const id = created.dm_id || created.id || "";
    const label = created.dose ? `${created.name} (${created.dose})` : created.name;
    const option = { value: id, label, name: created.name, dose: created.dose };
    setDrugMasterOptions((prev) => {
      if (!id || prev.some((item) => item.value === id)) return prev;
      return [...prev, option];
    });
    return option;
  };

  const validateMedications = (medications: Medication[]) => {
    const activeMeds = medications.filter((med) => med.name.trim() !== "");
    for (const med of activeMeds) {
      if (!med.dose.trim() || !med.frequency || !med.mealType) {
        throw new Error("กรุณากรอกข้อมูลยาให้ครบ (ชื่อยา, ปริมาณ/ขนาด, ความถี่, ประเภท)");
      }

      const parsedDose = parseDose(med.dose);
      if (!parsedDose) {
        throw new Error("รูปแบบปริมาณ/ขนาดไม่ถูกต้อง (เช่น 500mg)");
      }

      const timing = mealTypeToTiming(med.mealType);
      if (!timing) {
        throw new Error("กรุณาเลือกประเภทการกินยา (ก่อนอาหาร/หลังอาหาร)");
      }

      const timeOfDayInfo = frequencyToTimeOfDay(med.frequency);
      if (!timeOfDayInfo) {
        throw new Error("กรุณาเลือกความถี่การกินยา");
      }
    }
  };

  const syncMedications = async (residentId: string, medications: Medication[]) => {
    const activeMeds = medications.filter((med) => med.name.trim() !== "");
    const currentIds = new Set(activeMeds.map((med) => med.pdId).filter(Boolean) as string[]);
    const toDelete = originalMedicationIdsRef.current.filter((id) => !currentIds.has(id));

    for (const id of toDelete) {
      await personalDrugService.deleteById(id);
    }

    for (const med of activeMeds) {
      const trimmedName = med.name.trim();
      if (!trimmedName) continue;

      if (!med.dose.trim() || !med.frequency || !med.mealType) {
        throw new Error("กรุณากรอกข้อมูลยาให้ครบ (ชื่อยา, ปริมาณ/ขนาด, ความถี่, ประเภท)");
      }

      const parsedDose = parseDose(med.dose);
      if (!parsedDose) {
        throw new Error("รูปแบบปริมาณ/ขนาดไม่ถูกต้อง (เช่น 500mg)");
      }

      const timing = mealTypeToTiming(med.mealType);
      if (!timing) {
        throw new Error("กรุณาเลือกประเภทการกินยา (ก่อนอาหาร/หลังอาหาร)");
      }

      const timeOfDayInfo = frequencyToTimeOfDay(med.frequency);
      if (!timeOfDayInfo) {
        throw new Error("กรุณาเลือกความถี่การกินยา");
      }

      let dmId = med.dmId?.trim() || "";
      if (!dmId) {
        const created = await ensureDrugMaster(trimmedName, med.dose.trim());
        dmId = created.value;
      }

      const payload = {
        resident_id: residentId,
        dm_id: dmId,
        amount: parsedDose.amount,
        amount_unit: parsedDose.unit,
        frequency: timeOfDayInfo.frequency,
        time_of_day: timeOfDayInfo.timeOfDay,
        timing,
        take_type: "regular" as const,
      };

      if (med.pdId) {
        await personalDrugService.updateById(med.pdId, payload);
      } else {
        await personalDrugService.create(payload);
      }
    }
  };

  const handleCreateMedicationOption = useCallback(
    async (name: string, dose: string) => {
      try {
        const created = await drugMasterService.create({ name, dose });
        const id = created.dm_id || created.id || "";
        if (!id) return null;
        const label = created.dose ? `${created.name} (${created.dose})` : created.name;
        const option = { value: id, label, name: created.name, dose: created.dose };
        setDrugMasterOptions((prev) => {
          if (prev.some((item) => item.value === id)) return prev;
          return [...prev, option];
        });
        showToast({ type: "success", title: "เพิ่มยาใหม่สำเร็จ", message: created.name });
        return option;
      } catch (err: any) {
        const message = err?.response?.data?.message || "ไม่สามารถเพิ่มยาใหม่ได้";
        showToast({ type: "error", title: "เพิ่มยาไม่สำเร็จ", message });
        return null;
      }
    },
    [showToast]
  );

  const handleCreateRoomOption = useCallback(
    async (roomNumber: string, floor: string) => {
      const trimmed = roomNumber.trim();
      const numericFloor = Number(floor);
      if (!trimmed || !Number.isFinite(numericFloor)) return null;
      const existing = rooms.find(
        (room) => room.room_number === trimmed && Number(room.floor) === numericFloor
      );
      if (existing) {
        const existingId = (existing as { room_id?: string; id?: string }).room_id || existing.id || "";
        return existingId ? { value: existingId, label: existing.room_number } : null;
      }

      try {
        const created = await roomService.create({
          room_number: trimmed,
          floor: numericFloor,
        });
        const id = (created as { room_id?: string; id?: string }).room_id || created.id || "";
        if (!id) return null;
        setRooms((prev) => {
          if (prev.some((item) => ((item as any).room_id || item.id) === id)) return prev;
          return [...prev, created];
        });
        showToast({ type: "success", title: "เพิ่มห้องใหม่สำเร็จ", message: `ห้อง ${created.room_number}` });
        return { value: id, label: created.room_number };
      } catch (err: any) {
        const message = err?.response?.data?.message || "ไม่สามารถเพิ่มห้องใหม่ได้";
        showToast({ type: "error", title: "เพิ่มห้องไม่สำเร็จ", message });
        return null;
      }
    },
    [rooms, showToast]
  );

  // ฟังก์ชันสร้างห้องหลอก (auto-floor-) เพื่อบันทึกชั้นลงฐานข้อมูล
  const handleCreateFloorOption = useCallback(
    async (floorName: string) => {
      const trimmed = floorName.trim();
      const numericFloor = Number(trimmed);
      if (!trimmed || !Number.isFinite(numericFloor)) return null;

      try {
        const created = await roomService.create({
          room_number: `auto-floor-${Date.now()}`,
          floor: numericFloor,
        });
        const id = (created as any).room_id || (created as any).id || "";
        if (!id) return null;
        
        setRooms((prev) => {
          if (prev.some((item) => ((item as any).room_id || item.id) === id)) return prev;
          return [...prev, created];
        });
        showToast({ type: "success", title: "บันทึกชั้นเรียบร้อย", message: `ชั้น ${numericFloor}` });
        
        return { value: String(numericFloor), label: `ชั้น ${numericFloor}` };
      } catch (err: any) {
        const message = err?.response?.data?.message || "ไม่สามารถบันทึกชั้นได้";
        showToast({ type: "error", title: "บันทึกชั้นไม่สำเร็จ", message });
        return null;
      }
    },
    [showToast]
  );

  const handleResidentSubmit = async (formData: ResidentFormState) => {
    try {
      setIsSubmitting(true);

      validateMedications(formData.medications);

      const careLevelLabel = formData.careLevel?.trim();
      const labels = modalMode === "edit" && careLevelLabel ? [{ label_name: careLevelLabel }] : undefined;
      
      let savedResident: ApiResident;

      if (modalMode === "edit" && editingResidentId) {
        // โหมดแก้ไข: ถ้ามีรูปให้ส่ง FormData ถ้าไม่มีส่ง JSON
        const payload = formData.profileImage
          ? buildResidentFormData(formData, labels)
          : buildResidentPayload(formData, labels);
        savedResident = await residentService.update(editingResidentId, payload as any);
      } else {
        // โหมดสร้างใหม่: สร้างด้วย JSON ก่อนเสมอเพื่อหลบ 400 Bad Request
        const jsonPayload = buildResidentPayload(formData, labels);
        savedResident = await residentService.create(jsonPayload as any);

        // ถ้ามีการแนบรูปมาด้วย ให้อัปเดตตามไปทันที (เทคนิค 2 Step)
        if (formData.profileImage) {
          const newResidentId = savedResident.id || (savedResident as any).resident_id;
          if (newResidentId) {
            const formDataPayload = buildResidentFormData(formData, labels);
            savedResident = await residentService.update(newResidentId, formDataPayload as any);
          }
        }
      }

      const residentId = savedResident.id || (savedResident as any).resident_id || editingResidentId || "";
      if (!residentId) {
        throw new Error("ไม่พบรหัสผู้สูงอายุจากระบบ");
      }

      // บันทึกข้อมูลอื่นๆ เพิ่มเติม
      const postSaveTasks: Promise<unknown>[] = [];
      if (modalMode !== "edit" && careLevelLabel) {
        postSaveTasks.push(
          intakeService.createResidentLabels({
            resident_id: residentId,
            labels: [{ label_name: careLevelLabel }],
          })
        );
      }
      postSaveTasks.push(syncAllergies(residentId, formData.foodAllergies, formData.drugAllergies));
      postSaveTasks.push(syncMedications(residentId, formData.medications));

      const postSaveResults = await Promise.allSettled(postSaveTasks);
      const postSaveErrors = postSaveResults
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => getApiErrorMessage(result.reason, "ไม่สามารถซิงค์ข้อมูลเสริมได้"));

      showToast({
        type: "success",
        title: "บันทึกข้อมูลสำเร็จ",
        message: modalMode === "edit" ? "แก้ไขแฟ้มผู้สูงอายุเรียบร้อย" : "เพิ่มแฟ้มผู้สูงอายุเรียบร้อย",
      });

      if (postSaveErrors.length > 0) {
        showToast({
          type: "info",
          title: "ซิงค์ข้อมูลเสริมไม่ครบ",
          message: postSaveErrors[0],
        });
      }

      setIsAddModalOpen(false);
      setEditingResidentId(null);
      setEditingInitialValues(undefined);
      setModalMode("create");
      originalMedicationIdsRef.current = [];

      await fetchResidents();
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      showToast({ type: "error", title: "บันทึกข้อมูลล้มเหลว", message: errorMessage });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = async (id: string) => {
    setEditingResidentId(id);
    setEditingInitialValues(undefined);
    setModalMode("edit");
    setIsAddModalOpen(true);

    try {
      const resident = await residentService.getById(id);

      const [personalDrugs, residentAllergies, residentDrugAllergies] = await Promise.all([
        personalDrugService.getByResidentAll(id).catch(() => [] as PersonalDrug[]),
        allergyService.getByResident(id).catch(() => [] as ResidentAllergyItem[]),
        drugAllergyService.getByResident(id).catch(() => [] as ResidentDrugAllergyItem[]),
      ]);

      const medications = personalDrugs.map((drug: PersonalDrug) => {
        const dose = drug.amount && drug.amount_unit ? `${drug.amount}${drug.amount_unit}` : "";
        return {
          pdId: drug.pd_id || drug.id || "",
          dmId: drug.DrugMaster?.dm_id || drug.dm_id || "",
          name: drug.DrugMaster?.name || "",
          dose,
          frequency: timeOfDayToFrequencyValue(drug.time_of_day),
          time: "",
          mealType: timingToMealType(drug.timing) as Medication["mealType"],
          note: drug.description || "",
        };
      });

      const foodAllergyNames = residentAllergies
        .map((item: any) => item.allergy?.allergy_name || item.allergy_name)
        .filter(Boolean)
        .join("\n");

      const drugAllergyNames = residentDrugAllergies
        .map((item: any) => item.drug_allergy?.allergy_name || item.allergy_name)
        .filter(Boolean)
        .join("\n");

      originalMedicationIdsRef.current = medications.map((med: Medication) => med.pdId).filter(Boolean) as string[];

      setEditingInitialValues(
        mapResidentToFormState(resident, {
          medications: medications.length > 0 ? medications : [{ pdId: "", dmId: "", name: "", dose: "", frequency: "", time: "", mealType: "", note: "" }],
          foodAllergies: foodAllergyNames,
          drugAllergies: drugAllergyNames,
        })
      );
    } catch (error) {
      setEditingInitialValues(undefined);
      alert("ไม่สามารถโหลดข้อมูลผู้สูงอายุได้ ขึ้นฟอร์มว่างให้กรอกใหม่");
    }
  };

  const handleViewRelative = (id: string) => {
    const resident = allResidents.find(r => r.id === id);
    const residentName = resident ? resident.name : "ไม่พบข้อมูล";
    setRelativeViewResidentName(residentName);
    const resolvedId = (resident as { resident_id?: string; id?: string } | undefined)?.resident_id || resident?.id || id;
    setRelativeViewResidentId(resolvedId);
    setIsRelativeViewModalOpen(true);
  };

  const handleCopyRelativeMagicLink = async (id: string) => {
    try {
      const resident = allResidents.find((r) => r.id === id);
      const resolvedId = (resident as { resident_id?: string; id?: string } | undefined)?.resident_id || resident?.id || id;
      
      const fetchLinkPromise = residentService.getRelativeMagicLink(resolvedId)
        .then(linkData => new URL(linkData.magic_link, window.location.origin).toString());

      if (typeof ClipboardItem !== "undefined") {
        const blobPromise = fetchLinkPromise.then(text => new Blob([text], { type: "text/plain" }));
        const item = new ClipboardItem({ "text/plain": blobPromise });
        await navigator.clipboard.write([item]);
      } else {
        const absoluteLink = await fetchLinkPromise;
        await navigator.clipboard.writeText(absoluteLink);
      }

      showToast({
        type: "success",
        title: "คัดลอกลิงก์สำเร็จ",
        message: "ลิงก์สำหรับญาติถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
      });
    } catch (error) {
      const message = getApiErrorMessage(error, "ไม่สามารถคัดลอกลิงก์ญาติได้");
      showToast({
        type: "error",
        title: "คัดลอกไม่สำเร็จ",
        message,
      });
    }
  };

  const handleViewDetail = (id: string) => {
    const resident = allResidents.find(r => r.id === id);
    const resolvedId = (resident as { resident_id?: string; id?: string } | undefined)?.resident_id || resident?.id || id;
    setDetailResidentId(resolvedId);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-headline-5 font-bold text-gray-800">แฟ้มข้อมูลผู้สูงอายุ</h2>
          <button
            type="button"
            onClick={() => {
              setModalMode("create");
              setEditingResidentId(null);
              setEditingInitialValues(undefined);
              originalMedicationIdsRef.current = [];
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0080D0] active:bg-[#0070C0] transition"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:inline md:hidden">เพิ่มประวัติ</span>
            <span className="hidden md:inline">เพิ่มประวัติแรกเข้า</span>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ElderTableFilter
            searchTerm={searchTerm}
            onSearchChange={(value) => handleFilterChange(() => setSearchTerm(value))}
            selectedFloor={selectedFloor}
            onFloorChange={(value) => handleFilterChange(() => setSelectedFloor(value))}
            selectedCareType={selectedCareType}
            onCareTypeChange={(value) => handleFilterChange(() => setSelectedCareType(value))}
            showActive={showActive}
            onShowActiveToggle={() => handleFilterChange(() => setShowActive(!showActive))}
            availableFloors={availableFloors}
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="text-sm">กำลังโหลดข้อมูลผู้สูงอายุ...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <div className="text-sm mb-4">{error}</div>
              <button
                onClick={fetchResidents}
                className="px-4 py-2 bg-[#0093EF] text-white rounded-lg text-sm hover:bg-[#0080D0] transition"
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : (
            <>
              <ElderTable
                residents={paginatedResidents}
                onEdit={handleEditClick}
                onViewDetail={handleViewDetail}
                onViewRelative={handleViewRelative}
                onCopyMagicLink={handleCopyRelativeMagicLink}
              />

              {totalItems > 0 && (
                <ElderTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  startItem={startItem}
                  endItem={endItem}
                  onPageChange={setCurrentPage}
                />
              )}

              {totalItems === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</div>
                  <div className="text-xs mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Record Modal */}
      <ResidentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleResidentSubmit}
        isLoading={isSubmitting}
        rooms={rooms}
        initialValues={editingInitialValues}
        mode={modalMode}
        medicationOptions={drugMasterOptions}
        onCreateMedicationOption={handleCreateMedicationOption}
        onCreateRoomOption={handleCreateRoomOption}
        onCreateFloorOption={handleCreateFloorOption} // เปิดใช้งาน Prop นี้แล้ว
      />

      {/* Relative View Modal */}
      <RelativeViewModal
        isOpen={isRelativeViewModalOpen}
        onClose={() => setIsRelativeViewModalOpen(false)}
        residentName={relativeViewResidentName}
        residentId={relativeViewResidentId}
      />

      {/* Resident Detail Modal */}
      <ResidentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        residentId={detailResidentId}
      />
    </>
  );
}