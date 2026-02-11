"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";

export default function Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const dates = Array.from({ length: 31 }, (_, index) => index + 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppNavbar
        user={{ name: "สมหญิง", role: "เจ้าหน้าที่ดูแล" }}
        notificationsCount={3}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onLogout={() => {
          // TODO: hook logout logic when API is ready
        }}
      />

      <div className="flex flex-1 pt-16">
        <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-72">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">ตารางกิจกรรม</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700">
                  <button className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>ธันวาคม 2568</span>
                  <button className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                    {days.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-2 text-center text-sm text-slate-700">
                    {dates.map((date) => (
                      <button
                        key={date}
                        className={`mx-auto h-8 w-8 rounded-full ${
                          date === 30 ? "bg-blue-600 text-white" : "hover:bg-slate-100"
                        }`}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-sm font-semibold text-slate-700">
                    กิจกรรมประจำวันอังคารที่ 30 ธันวาคม
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
                  <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    เพิ่มกิจกรรมในวันนี้
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="lg:ml-72 mt-auto">
        <AppFooter />
      </div>
    </div>
  );
}
