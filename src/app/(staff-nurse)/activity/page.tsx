"use client";
import { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import { ActivityCalendar } from "@/components/features/nurse/activity/activity-calendar";
import { ActivityFormModal, type ActivityFormData } from "@/components/features/nurse/activity/activity-form-modal";

const DAYS_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

interface EmptyActivityCardProps {
  selectedDate: Date;
  onAddActivity: () => void;
}

function EmptyActivityCard({ selectedDate, onAddActivity }: EmptyActivityCardProps) {
  const dayName = DAYS_FULL[selectedDate.getDay()];
  const date = selectedDate.getDate();
  const monthName = MONTHS[selectedDate.getMonth()];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-700">
          กิจกรรมประจำวัน{dayName}ที่ {date} {monthName}
        </h2>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200">
          <Calendar className="h-10 w-10 text-slate-300" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-700">ไม่มีกิจกรรมในวันนี้</p>
          <p className="text-sm text-slate-500">เริ่มสร้างกิจกรรมของคุณ</p>
        </div>
        <button
          type="button"
          onClick={onAddActivity}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          เพิ่มกิจกรรมในวันนี้
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const { user } = useAuth();
  const { isSidebarOpen, setIsSidebarOpen, isSidebarCollapsed, setIsSidebarCollapsed, isReady } = useSidebarState();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddActivity = () => {
    setIsModalOpen(true);
  };

  const handleSubmitActivity = (data: ActivityFormData) => {
    console.log("Activity created:", data);
    // TODO: Integrate with backend API
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppNavbar
        user={{ 
          firstName: user?.first_name || "ผู้ใช้งาน", 
          role: user?.role_name 
        }}
        notificationsCount={3}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      <div className="flex flex-1 pt-16">
        <AppSidebar
          role="nurse"
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          isReady={isReady}
          onClose={() => setIsSidebarOpen(false)}
          onCollapsedChange={setIsSidebarCollapsed}
        />

        <main
          className={cn(
            "flex-1 p-4 sm:p-6 lg:p-8",
            isReady && "transition-[margin-left] duration-300",
            isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
          )}
        >
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">ตารางกิจกรรม</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <ActivityCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              <EmptyActivityCard selectedDate={selectedDate} onAddActivity={handleAddActivity} />
            </div>
          </div>
        </main>
      </div>

      <div className={cn("mt-auto transition-[margin-left] duration-300", isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72")}>
        <AppFooter />
      </div>

      <ActivityFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitActivity}
        defaultDate={selectedDate}
      />
    </div>
  );
}
