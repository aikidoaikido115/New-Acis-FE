"use client";

import type { ReactNode } from "react";
import {
  Calendar,
  ChevronDown,
  ClipboardList,
  Loader2,
  Mars,
  Pill,
  Plus,
  ShoppingBag,
  UserRound,
  Venus,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/components/ui/dropdown";
import {
  DashboardCard,
  GenderChart,
  LinkButton,
  MedicineSummaryItem,
  ScheduleItem,
  StatCard,
  VitalSignItem,
} from "@/components/features/dashboard/dashboard-cards";
import type { GenderStats } from "@/types/dashboard";
import type {
  InventoryCardItem,
  MedicineStatusItem,
  ScheduleItemWithBadge,
  StatCardItem,
  VitalStatItem,
} from "@/components/features/dashboard/use-dashboard-data";
import { DAYS_SHORT, formatThaiMonthYear } from "@/components/features/dashboard/dashboard-utils";

interface DashboardHeaderProps {
  userName: string;
  selectedDate: Date;
  selectedFloor: string;
  floorOptions: Array<{ value: string; label: string }>;
  onDateChange: (date: Date) => void;
  onFloorChange: (value: string) => void;
  onAddResident: () => void;
}

export function DashboardHeader({
  userName,
  selectedDate,
  selectedFloor,
  floorOptions,
  onDateChange,
  onFloorChange,
  onAddResident,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ยินดีต้อนรับ, {userName}</h2>
          <p className="text-sm mt-2 text-slate-500">ภาพรวมการดูแลผู้สูงอายุประจำวันนี้</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onAddResident}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            เพิ่มประวัติแรกเข้า
          </button>
          <DatePicker value={selectedDate} onChange={(date) => date && onDateChange(date)} />
          <Dropdown options={floorOptions} value={selectedFloor} onChange={onFloorChange} placeholder="เลือกชั้น" />
        </div>
      </div>
    </div>
  );
}

export function DashboardStatCards({ isLoading, statCards }: { isLoading: boolean; statCards: StatCardItem[] }) {
  if (isLoading) {
    return (
      <div className="col-span-4 flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#0093EF]" />
      </div>
    );
  }

  return (
    <>
      {statCards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={<UserRound className="h-4 w-4" />}
          unit=""
        />
      ))}
    </>
  );
}

interface DashboardOverviewRowProps {
  vitalStats: VitalStatItem[];
  medicineStatus: MedicineStatusItem[];
  genderStats: GenderStats;
  isLoading: boolean;
}

export function DashboardOverviewRow({ vitalStats, medicineStatus, genderStats, isLoading }: DashboardOverviewRowProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <DashboardCard title="Vital sign" icon={<ClipboardList className="h-4 w-4" />}>
        <div className="space-y-3">
          {vitalStats.map((item) => (
            <VitalSignItem {...item} key={item.label} />
          ))}
          <LinkButton href="/emr">[ไปหน้าเวชระเบียน]</LinkButton>
        </div>
      </DashboardCard>

      <DashboardCard title="ยา" icon={<Pill className="h-4 w-4" />} className="p-8">
        <div className="space-y-6 text-sm">
          {medicineStatus.map((item) => (
            <MedicineSummaryItem {...item} key={item.label} />
          ))}
          <div className="mt-10">
            <LinkButton href="/medicine">[ไปหน้าจัดการยา]</LinkButton>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="สัดส่วนเพศ" icon={<GenderIcon />}>
        {!isLoading ? (
          <GenderChart {...genderStats} />
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

interface DashboardScheduleRowProps {
  activityDate: Date;
  onActivityDateChange: (date: Date) => void;
  scheduleItems: ScheduleItemWithBadge[];
  inventoryCards: InventoryCardItem[];
}

export function DashboardScheduleRow({
  activityDate,
  onActivityDateChange,
  scheduleItems,
  inventoryCards,
}: DashboardScheduleRowProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <DashboardCard
        title="ตารางกิจกรรม"
        icon={<Calendar className="h-4 w-4" />}
        action={<DatePicker value={activityDate} onChange={(date) => date && onActivityDateChange(date)} />}
      >
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <MiniCalendar selectedDate={activityDate} />
          <div className="space-y-4">
            {scheduleItems.length > 0 ? (
              scheduleItems.map((item) => <ScheduleItem {...item} key={item.time} />)
            ) : (
              <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                ไม่มีกิจกรรมในวันนี้
              </div>
            )}
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="สินค้าคงคลัง" icon={<ShoppingBag className="h-4 w-4" />}>
        <div className="space-y-6 text-sm">
          {inventoryCards.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="truncate">{item.label}</span>
                <span className={`ml-4 ${item.valueClass}`}>{`${item.count} รายการ`}</span>
              </div>
              <LinkButton href={item.href}>[ไป{item.linkLabel}]</LinkButton>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}

function MiniCalendar({ selectedDate }: { selectedDate: Date }) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const selectedDay = selectedDate.getDate();

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>{formatThaiMonthYear(selectedDate)}</span>
        <ChevronDown className="h-4 w-4" />
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
        {DAYS_SHORT.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 text-center text-xs text-slate-600">
        {Array.from({ length: firstDay }).map((_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <span key={day} className={`rounded-full px-2 py-1 ${day === selectedDay ? "bg-blue-600 text-white" : ""}`}>
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

function GenderIcon(): ReactNode {
  return (
    <div className="relative h-4 w-4">
      <Mars className="absolute inset-0 h-4 w-4" />
      <Venus className="absolute inset-0 h-4 w-4 translate-x-0.5 translate-y-0.5 opacity-80" />
    </div>
  );
}
