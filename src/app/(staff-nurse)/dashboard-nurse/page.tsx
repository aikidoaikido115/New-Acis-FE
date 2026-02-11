"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ClipboardList,
  Plus,
  ShoppingCart,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";

export default function Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const todayLabel = "31/12/2568";

  const statCards = [
    { label: "ผู้สูงอายุทั้งหมด", value: 45, change: "+20 %", icon: <UserRound className="h-4 w-4" /> },
    { label: "ผู้สูงอายุทั่วไป", value: 20, icon: <UserRound className="h-4 w-4" /> },
    { label: "ผู้สูงอายุช่วยเหลือตนเองได้บางส่วน", value: 17, icon: <UserRound className="h-4 w-4" /> },
    { label: "ผู้สูงอายุติดเตียง", value: 8, icon: <UserRound className="h-4 w-4" /> },
  ];

  const vitalStats = [
    { label: "ปกติ", value: 38, tone: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { label: "เสี่ยงสูง", value: 6, tone: "bg-amber-50 border-amber-200 text-amber-700" },
    { label: "ผิดปกติ", value: 1, tone: "bg-rose-50 border-rose-200 text-rose-700" },
  ];

  const medicineSummary = [
    { label: "มือเช้า", value: "ให้ครบ" },
    { label: "มือกลางวัน", value: "รอให้ยา (30/45)" },
    { label: "มือเย็น", value: "รอให้ยา (45/45)" },
  ];

  const scheduleItems = [
    {
      time: "09:00-10:30",
      title: "กิจกรรมประจำวัน",
      detail: "กิจกรรมฟื้นฟูสมรรถภาพ",
      location: "ห้องกิจกรรม",
    },
    {
      time: "14:00-15:30",
      title: "กิจกรรมประจำสัปดาห์",
      detail: "กิจกรรมพัฒนากล้ามเนื้อ",
      location: "โถงกิจกรรม",
    },
  ];

  const inventoryItems = [
    { label: "ผ้าอ้อม", total: 13, alert: 10 },
    { label: "ทิชชู่แห้ง", total: 5, alert: 3 },
    { label: "ทิชชู่เปียก", total: 12, alert: 8 },
  ];

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
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-800">ยินดีต้อนรับ, สมหญิง</h1>
                  <p className="text-sm text-slate-500">ภาพรวมการดูแลผู้สูงอายุประจำวันนี้</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    เพิ่มประวัติการทำยา
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    <Calendar className="h-4 w-4" />
                    {todayLabel}
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    ทั้งวัน
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                  <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>{card.label}</span>
                      <span className="text-slate-300">{card.icon}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-semibold text-slate-800">{card.value}</span>
                      {card.change && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                          {card.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">สัดส่วนเพศ</h2>
                    <span className="text-xs text-slate-400">อัปเดตล่าสุด</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="h-28 w-28 rounded-full bg-[conic-gradient(#4F7CFF_0%_56%,#F857B5_56%_100%)]" />
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#4F7CFF]" />
                        <span className="text-slate-600">เพศชาย</span>
                        <span className="text-slate-900">25 คน (56%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#F857B5]" />
                        <span className="text-slate-600">เพศหญิง</span>
                        <span className="text-slate-900">20 คน (44%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">Vital sign</h2>
                    <Stethoscope className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    {vitalStats.map((item) => (
                      <div key={item.label} className={`flex items-center justify-between rounded-lg border px-4 py-2 text-sm ${item.tone}`}>
                        <span>{item.label}</span>
                        <span>{item.value} คน</span>
                      </div>
                    ))}
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">ไปหน้ารายละเอียด</button>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">ยา</h2>
                    <ClipboardList className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="space-y-3 text-sm">
                    {medicineSummary.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-slate-600">
                        <span>{item.label}</span>
                        <span className="font-semibold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">ไปหน้าการให้ยา</button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700">รายการสินค้าใกล้หมด</h2>
                  <ShoppingCart className="h-4 w-4 text-slate-400" />
                </div>
                <div className="space-y-4 text-sm">
                  {inventoryItems.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="text-rose-500">เหลือ {item.alert} รายการ</span>
                      </div>
                      <p className="text-xs text-slate-500">รวมทั้งหมด {item.total} รายการ</p>
                    </div>
                  ))}
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">ไปหน้าจัดการสินค้า</button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">ตารางกิจกรรม</h2>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">ดูทั้งหมด</button>
              </div>
              <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
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
                    {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
                      <span
                        key={day}
                        className={`rounded-full px-2 py-1 ${day === 23 ? "bg-blue-600 text-white" : ""}`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {scheduleItems.map((item) => (
                    <div key={item.time} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <span>{item.time}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">วันนี้</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-800">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.detail}</div>
                      <div className="mt-2 text-xs text-slate-500">{item.location}</div>
                    </div>
                  ))}
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
