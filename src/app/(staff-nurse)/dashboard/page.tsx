"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ClipboardList,
  Plus,
  ShoppingBag,
  UserRound,
  Pill,
  Calendar,
  Loader2,
  Venus,
  Mars,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/components/ui/dropdown";
import { ResidentFormModal } from "@/components/features/nurse/elder-info/ResidentFormModal";
import {
  StatCard,
  DashboardCard,
  VitalSignItem,
  MedicineSummaryItem,
  ScheduleItem,
  GenderChart,
  LinkButton,
} from "@/components/features/nurse/dashboard-cards";
import { dashboardService } from "@/services/dashboard.service";
import { roomService } from "@/services/room.service";
import { residentService } from "@/services/resident.service";
import { adaptResidentPayload } from "@/utils/resident-adapter";
import type { ResidentStats, GenderStats } from "@/types/dashboard";
import type { Room } from "@/types/room";
import type { ResidentFormState, CreateResidentRequest, Resident } from "@/types/resident";

const FLOOR_OPTIONS = [
  { value: "all", label: "ทุกชั้น" },
  { value: "1", label: "ชั้นที่ 1" },
  { value: "2", label: "ชั้นที่ 2" },
  { value: "3", label: "ชั้นที่ 3" },
  { value: "4", label: "ชั้นที่ 4" },
];

type DashboardState = {
  residentStats: ResidentStats | null;
  genderStats: GenderStats | null;
  rooms: Room[];
  selectedDate: Date;
  selectedFloor: string;
  isLoading: boolean;
  isAddModalOpen: boolean;
  isSubmitting: boolean;
};

const INITIAL_STATE: DashboardState = {
  residentStats: null,
  genderStats: null,
  rooms: [],
  selectedDate: new Date(),
  selectedFloor: "all",
  isLoading: true,
  isAddModalOpen: false,
  isSubmitting: false,
};

// Simplified dashboard data
const DASHBOARD_DATA = {
  vitalStats: [
    { label: "ปกติ", value: 0, variant: "normal" as const },
    { label: "เสี่ยงสูง", value: 0, variant: "warning" as const },
    { label: "ผิดปกติ", value: 0, variant: "danger" as const },
  ],
  medicineStatus: [
    { label: "มื้อเช้า", value: "ให้ครบ" },
    { label: "มื้อกลางวัน", value: "ให้ครบ" },
    { label: "มื้อเย็น", value: "ให้ครบ" },
  ],
  scheduleItems: [
    { time: "09:00-10:30", title: "กิจกรรมประจำวัน", detail: "กิจกรรมฟื้นฟูสมรรถภาพ", location: "ห้องกิจกรรม" },
    { time: "14:00-15:30", title: "กิจกรรมประจำสัปดาห์", detail: "กิจกรรมพัฒนากล้ามเนื้อ", location: "โถงกิจกรรม" },
  ],
  inventory: [
    { label: "รายการสินค้าใกล้หมด", value: "0/0 รายการ", href: "/warehouse" },
    { label: "รายการเบิกของรออนุมัติ", value: "0 รายการ", href: "/warehouse/transactions" },
    { label: "รายการเติมของรออนุมัติ", value: "0 รายการ", href: "/warehouse/transactions" },
  ]
};

const computeStatsFromResidents = (residents: Resident[]) => {
  const acc = residents.reduce(
    (totals, resident) => {
      const level = resident.care_level || "general";
      totals.total += 1;
      if (level === "partial_assist") totals.partial_assist += 1;
      else if (level === "bedridden") totals.bedridden += 1;
      else totals.general += 1;

      if (resident.gender === "male") totals.male += 1;
      else if (resident.gender === "female") totals.female += 1;

      return totals;
    },
    { total: 0, general: 0, partial_assist: 0, bedridden: 0, male: 0, female: 0 }
  );

  return {
    residentStats: {
      total: acc.total,
      general: acc.general,
      partial_assist: acc.partial_assist,
      bedridden: acc.bedridden,
    },
    genderStats: {
      male: acc.male,
      female: acc.female,
    },
  };
};

export default function Page() {
  const { user } = useAuth();

  const [dashboardState, setDashboardState] = useState<DashboardState>(INITIAL_STATE);
  const { residentStats, genderStats, rooms, selectedDate, selectedFloor, isLoading, isAddModalOpen, isSubmitting } = dashboardState;

  const mergeStats = (statsRes: ResidentStats | null, computed: ReturnType<typeof computeStatsFromResidents>) =>
    statsRes && statsRes.total > 0 ? statsRes : computed.residentStats;

  const mergeGender = (genderRes: GenderStats | null, computed: ReturnType<typeof computeStatsFromResidents>) =>
    genderRes && genderRes.male + genderRes.female > 0 ? genderRes : computed.genderStats;

  const fetchDashboardData = useCallback(async () => {
    try {
      setDashboardState((prev) => ({ ...prev, isLoading: true }));

      const [statsRes, genderRes, roomsRes, residents] = await Promise.all([
        dashboardService.getResidentStats().catch(() => null),
        dashboardService.getGenderStats().catch(() => null),
        roomService.getAll().catch(() => []),
        residentService.getAll().catch(() => []),
      ]);

      const computed = computeStatsFromResidents(residents);

      setDashboardState((prev) => ({
        ...prev,
        residentStats: mergeStats(statsRes, computed),
        genderStats: mergeGender(genderRes, computed),
        rooms: roomsRes,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch dashboard data (using resident fallback):", error);

      try {
        const residents = await residentService.getAll();
        const computed = computeStatsFromResidents(residents);

        setDashboardState((prev) => ({
          ...prev,
          residentStats: computed.residentStats,
          genderStats: computed.genderStats,
          isLoading: false,
        }));
      } catch (fallbackError) {
        console.error("Fallback fetch residents failed:", fallbackError);
        setDashboardState((prev) => ({ ...prev, isLoading: false }));
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
      setDashboardState((prev) => ({ ...prev, isSubmitting: true }));
      const backendPayload = adaptResidentPayload(buildResidentPayload(formData));
      await residentService.create(backendPayload as any);
      setDashboardState((prev) => ({ ...prev, isAddModalOpen: false }));
      fetchDashboardData();
    } catch (error: any) {
      console.error("Failed to create resident:", error);
      alert(error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setDashboardState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Simplified stat cards
  const statCards = [
    { label: "ผู้สูงอายุทั้งหมด", value: residentStats?.total ?? 0 },
    { label: "ผู้สูงอายุทั่วไป", value: residentStats?.general ?? 0 },
    { label: "ผู้สูงอายุช่วยเหลือตนเองได้บางส่วน", value: residentStats?.partial_assist ?? 0 },
    { label: "ผู้สูงอายุติดเตียง", value: residentStats?.bedridden ?? 0 },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                ยินดีต้อนรับ, {user?.first_name || "ผู้ใช้งาน"}
              </h2>
              <p className="text-sm mt-2 text-slate-500">ภาพรวมการดูแลผู้สูงอายุประจำวันนี้</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setDashboardState((prev) => ({ ...prev, isAddModalOpen: true }))}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                เพิ่มประวัติแรกเข้า
              </button>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setDashboardState((prev) => ({ ...prev, selectedDate: date }))}
              />
              <Dropdown
                options={FLOOR_OPTIONS}
                value={selectedFloor}
                onChange={(value) => setDashboardState((prev) => ({ ...prev, selectedFloor: value }))}
                placeholder="เลือกชั้น"
              />
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading ? (
              <div className="col-span-4 flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#0093EF]" />
              </div>
            ) : (
              statCards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  icon={<UserRound className="h-4 w-4" />}
                  unit=""
                />
              ))
            )}
          </div>
        </div>

        {/* Row 1: Vital Sign, ยา, สัดส่วนเพศ */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Vital Sign */}
          <DashboardCard title="Vital sign" icon={<ClipboardList className="h-4 w-4" />}>
            <div className="space-y-3">
              {DASHBOARD_DATA.vitalStats.map((item) => (
                <VitalSignItem {...item} key={item.label} />
              ))}
              <LinkButton href="/emr">[ไปหน้าเวชระเบียน]</LinkButton>
            </div>
          </DashboardCard>

          {/* Medicine */}
          <DashboardCard title="ยา" icon={<Pill className="h-4 w-4" />} className="p-8">
            <div className="space-y-6 text-sm">
              {DASHBOARD_DATA.medicineStatus.map((item) => (
                <MedicineSummaryItem {...item} key={item.label} />
              ))}
              <div className="mt-10">
                <LinkButton href="/medicine">[ไปหน้าจัดการยา]</LinkButton>
              </div>
            </div>
          </DashboardCard>

          {/* Gender Chart */}
          <DashboardCard
            title="สัดส่วนเพศ"
            icon={
              <div className="relative h-4 w-4">
                <Mars className="absolute inset-0 h-4 w-4" />
                <Venus className="absolute inset-0 h-4 w-4 translate-x-0.5 translate-y-0.5 opacity-80" />
              </div>
            }
          >
            {genderStats ? (
              <GenderChart {...genderStats} />
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Row 2: ตารางกิจกรรม, รายการสินค้าใกล้หมด */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Schedule Section */}
          <DashboardCard title="ตารางกิจกรรม" icon={<Calendar className="h-4 w-4" />}>
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              {/* Mini Calendar */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>ธันวาคม 2568</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                  {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2 text-center text-xs text-slate-600">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                    <span
                      key={day}
                      className={`rounded-full px-2 py-1 ${day === 23 ? "bg-blue-600 text-white" : ""}`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {/* Schedule Items */}
              <div className="space-y-4">
                {DASHBOARD_DATA.scheduleItems.map((item) => (
                  <ScheduleItem {...item} key={item.time} />
                ))}
              </div>
            </div>
          </DashboardCard>

          {/* Inventory */}
          <DashboardCard title="สินค้าคงคลัง" icon={<ShoppingBag className="h-4 w-4" />}>
            <div className="space-y-6 text-sm">
              {DASHBOARD_DATA.inventory.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="truncate">{item.label}</span>
                    <span className="text-red-500 ml-4">{item.value}</span>
                  </div>
                  <LinkButton href={item.href}>[ไป{item.href === "/warehouse" ? "หน้าสินค้าคงคลัง" : "หน้าประวัติการทำรายการ"}]</LinkButton>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Add Record Modal */}
      <ResidentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setDashboardState((prev) => ({ ...prev, isAddModalOpen: false }))}
        onSubmit={handleResidentSubmit}
        isLoading={isSubmitting}
        rooms={rooms}
      />
    </>
  );
}
