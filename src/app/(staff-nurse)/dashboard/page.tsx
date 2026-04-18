"use client";

import { useState } from "react";
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
import { adaptResidentPayload } from "@/utils/resident-adapter";
import type { CreateResidentRequest, ResidentFormState } from "@/types/resident";

const FLOOR_OPTIONS = [
  { value: "all", label: "ทุกชั้น" },
  { value: "1", label: "ชั้นที่ 1" },
  { value: "2", label: "ชั้นที่ 2" },
  { value: "3", label: "ชั้นที่ 3" },
  { value: "4", label: "ชั้นที่ 4" },
];

export default function Page() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    inventoryCards,
    refreshResidents,
  } = useDashboardData();

  const buildResidentPayload = (formData: ResidentFormState): CreateResidentRequest => ({
    first_name: formData.firstName,
    last_name: formData.lastName,
    nickname: formData.nickname || undefined,
    gender: formData.gender,
    date_of_birth: formData.dateOfBirth,
    id_card_number: formData.idCardNumber || undefined,
    purpose: formData.purpose || undefined,
    admit_date: formData.admitDate,
    expected_discharge_date: formData.expectedDischargeDate || undefined,
    room_id: formData.roomId || undefined,
    floor: formData.floor ? parseInt(formData.floor) : undefined,
    chronic_diseases: formData.chronicDiseases || undefined,
    chronic_diseases_note: formData.chronicDiseasesNote || undefined,
    medications: formData.medications.filter((m) => m.name.trim() !== ""),
    surgical_history: formData.surgicalHistory || undefined,
    drug_allergies: formData.drugAllergies || undefined,
    food_allergies: formData.foodAllergies || undefined,
    adl_score: formData.adlScore ? parseInt(formData.adlScore) : undefined,
    cpr_status: formData.cprStatus || undefined,
    emergency_hospital: formData.emergencyHospital || undefined,
    emergency_hospital_phone: formData.emergencyHospitalPhone || undefined,
    emergency_contacts: formData.emergencyContacts.filter((c) => c.name.trim() !== ""),
    care_level: "general",
  });

  const handleResidentSubmit = async (formData: ResidentFormState) => {
    try {
      setIsSubmitting(true);
      const backendPayload = adaptResidentPayload(buildResidentPayload(formData));
      await residentService.create(backendPayload as any);
      setIsAddModalOpen(false);
      refreshResidents();
    } catch (error: any) {
      console.error("Failed to create resident:", error);
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
          inventoryCards={inventoryCards}
        />
      </div>

      <ResidentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleResidentSubmit}
        isLoading={isSubmitting}
        rooms={rooms}
      />
    </>
  );
}
