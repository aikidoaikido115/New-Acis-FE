"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ResidentFormModal } from "@/components/features/elder-info/ResidentFormModal";
import {
  DashboardHeader,
  DashboardOverviewRow,
  DashboardScheduleRow,
  DashboardStatCards,
} from "@/components/features/dashboard/dashboard-sections";
import { useDashboardData } from "@/components/features/dashboard/use-dashboard-data";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { drugMasterService } from "@/services/drug-master.service";
import { personalDrugService } from "@/services/personal-drug.service";
import { allergyService } from "../../../services/allergy.service";
import { drugAllergyService } from "../../../services/drug-allergy.service";
import { intakeService } from "@/services/intake.service";
import type { CreateResidentRequest, ResidentFormState } from "@/types/resident";
import type { Room } from "@/types/room";

const FLOOR_OPTIONS = [
  { value: "all", label: "ทุกชั้น" },
  { value: "1", label: "ชั้นที่ 1" },
  { value: "2", label: "ชั้นที่ 2" },
  { value: "3", label: "ชั้นที่ 3" },
  { value: "4", label: "ชั้นที่ 4" },
];

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

const frequencyToTimeOfDay = (value: string) => {
  const tokens = frequencyTokensByValue[value];
  if (!tokens) return null;
  return {
    frequency: tokens.length,
    timeOfDay: tokens.join(","),
  };
};

const mealTypeToTiming = (mealType?: string) => {
  if (mealType === "before_meal") return "ก่อนอาหาร";
  if (mealType === "after_meal") return "หลังอาหาร";
  return "";
};

const parseDose = (dose: string) => {
  const trimmed = dose.trim();
  const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return null;
  const amount = match[1];
  const unit = match[2].trim();
  if (!unit) return null;
  return { amount, unit };
};

const careLevelToLabelName = (value?: string) => {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "partial_assist" || normalized === "partial") return "ช่วยเหลือตัวเองได้บางส่วน";
  if (normalized === "bedridden") return "ติดเตียง";
  if (normalized === "general") return "ช่วยเหลือตัวเองได้ทั้งหมด";
  return "";
};

export default function Page() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drugMasterOptions, setDrugMasterOptions] = useState<Array<{ value: string; label: string; name: string; dose?: string }>>([]);
  const [extraRooms, setExtraRooms] = useState<Room[]>([]);

  const {
    selectedDate,
    setSelectedDate,
    activityDate,
    setActivityDate,
    selectedFloor,
    setSelectedFloor,
    isLoading,
    rooms,
    statCards,
    genderStats,
    vitalStats,
    medicineStatus,
    scheduleItems,
    schedulesByMonth,
    inventoryCards,
    refreshResidents,
  } = useDashboardData();

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
      } catch {
        setDrugMasterOptions([]);
      }
    };
    fetchDrugMasters();
  }, []);

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

  const buildResidentPayload = (formData: ResidentFormState): CreateResidentRequest => {
    const emergencyPhone = normalizePhone(formData.emergencyHospitalPhone);
    const idCardNumber = formData.idCardNumber.trim();
    const cleanedContacts = formData.emergencyContacts
      .map((contact) => ({
        name: contact.name.trim(),
        relation: contact.relation.trim(),
        phone: normalizePhone(contact.phone),
      }))
      .filter((contact) => contact.name || contact.relation || contact.phone);

    return {
    first_name: formData.firstName,
    last_name: formData.lastName,
    nickname: formData.nickname || undefined,
    gender: formData.gender,
    date_of_birth: toRFC3339(formData.dateOfBirth) as string,
    id_card_number: idCardNumber || undefined,
    purpose_of_stay: formData.purpose || undefined,
    check_in_date: toRFC3339(formData.admitDate) as string,
    expected_check_out_date: toRFC3339(formData.expectedDischargeDate) || undefined,
    room_id: formData.roomId,
    pre_existing_conditions: formData.chronicDiseases || undefined,
    pre_existing_conditions_notes: formData.chronicDiseasesNote || undefined,
    surgical_history: formData.surgicalHistory || undefined,
    resuscitation_status: formData.cprStatus || undefined,
    preferred_emergency_hospital: formData.emergencyHospital || undefined,
    emergency_hospital_phone:
      emergencyPhone.length >= 4 && emergencyPhone.length <= 10 ? emergencyPhone : undefined,
    emergency_contacts: cleanedContacts.length > 0 ? cleanedContacts : undefined,
    profile_image: formData.profileImagePreview || undefined,
    status: formData.status,
  };
  };

  const syncAllergies = async (residentId: string, foodAllergies: string, drugAllergies: string) => {
    const foodNames = normalizeLines(foodAllergies);
    if (foodNames.length > 0) {
      await allergyService.createByResident(residentId, foodNames.map((name) => ({ allergy_name: name })));
    }

    const drugNames = normalizeLines(drugAllergies);
    if (drugNames.length > 0) {
      await drugAllergyService.createByResident(residentId, drugNames.map((name) => ({ allergy_name: name })));
    }
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

  const syncMedications = async (residentId: string, medications: ResidentFormState["medications"]) => {
    const activeMeds = medications.filter((med) => med.name.trim() !== "");

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

      await personalDrugService.create({
        resident_id: residentId,
        dm_id: dmId,
        amount: parsedDose.amount,
        amount_unit: parsedDose.unit,
        frequency: timeOfDayInfo.frequency,
        time_of_day: timeOfDayInfo.timeOfDay,
        timing,
        take_type: "regular",
      });
    }
  };

  const handleCreateMedicationOption = useCallback(async (name: string, dose: string) => {
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
      return option;
    } catch {
      return null;
    }
  }, []);

  const mergedRooms = useMemo(() => {
    const map = new Map<string, Room>();
    rooms.forEach((room) => {
      const id = (room as { room_id?: string; id?: string }).room_id || room.id || "";
      if (id) map.set(id, room);
    });
    extraRooms.forEach((room) => {
      const id = (room as { room_id?: string; id?: string }).room_id || room.id || "";
      if (id && !map.has(id)) map.set(id, room);
    });
    return Array.from(map.values());
  }, [rooms, extraRooms]);

  const handleCreateRoomOption = useCallback(
    async (roomNumber: string, floor: string) => {
      const trimmed = roomNumber.trim();
      const numericFloor = Number(floor);
      if (!trimmed || !Number.isFinite(numericFloor)) return null;

      const existing = mergedRooms.find(
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
        setExtraRooms((prev) => {
          if (prev.some((item) => ((item as any).room_id || item.id) === id)) return prev;
          return [...prev, created];
        });
        return { value: id, label: created.room_number };
      } catch {
        alert("ไม่สามารถเพิ่มห้องใหม่ได้");
        return null;
      }
    },
    [mergedRooms]
  );

  const handleResidentSubmit = async (formData: ResidentFormState) => {
    try {
      setIsSubmitting(true);
      const payload = buildResidentPayload(formData);
      const resident = await residentService.create(payload as any);
      const residentId = resident.id || (resident as any).resident_id || "";
      if (residentId) {
        const careLevelLabel = careLevelToLabelName(formData.careLevel);
        if (careLevelLabel) {
          await intakeService.createResidentLabels({
            resident_id: residentId,
            labels: [{ label_name: careLevelLabel }],
          });
        }
        await syncAllergies(residentId, formData.foodAllergies, formData.drugAllergies);
        await syncMedications(residentId, formData.medications);
      }
      setIsAddModalOpen(false);
      refreshResidents();
    } catch (error: any) {
      alert(error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4">
          <DashboardHeader
            userName={user?.first_name || "ผู้ใช้งาน"}
            selectedDate={selectedDate}
            selectedFloor={selectedFloor}
            floorOptions={FLOOR_OPTIONS}
            onDateChange={setSelectedDate}
            onFloorChange={setSelectedFloor}
            onAddResident={() => setIsAddModalOpen(true)}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCards isLoading={isLoading} statCards={statCards} />
          </div>
        </div>

        <DashboardOverviewRow
          vitalStats={vitalStats}
          medicineStatus={medicineStatus}
          genderStats={genderStats}
          isLoading={isLoading}
        />

        <DashboardScheduleRow
          activityDate={activityDate}
          onActivityDateChange={setActivityDate}
          scheduleItems={scheduleItems}
          schedulesByMonth={schedulesByMonth}
          inventoryCards={inventoryCards}
        />
      </div>

      <ResidentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleResidentSubmit}
        isLoading={isSubmitting}
        rooms={mergedRooms}
        medicationOptions={drugMasterOptions}
        onCreateMedicationOption={handleCreateMedicationOption}
        onCreateRoomOption={handleCreateRoomOption}
      />
    </>
  );
}
