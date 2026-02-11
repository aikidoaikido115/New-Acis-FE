"use client";

import { useState } from "react";
import {
  ChevronDown,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
  Search,
} from "lucide-react";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";

export default function Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const residents = [
    { id: 1, name: "คุณยายมณี โชคดี", nickname: "แวว", room: 1, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 2, name: "คุณตาประทีป แสงทอง", nickname: "ยิ้ม", room: 2, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 3, name: "คุณยายมะลิ ศรีนิตย์", nickname: "บา", room: 3, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 4, name: "คุณตาทองสัน ปานช่วย", nickname: "ตุ", room: 4, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 5, name: "คุณยายบุญธรรม คลี", nickname: "บุษ", room: 5, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 6, name: "คุณยายเพ็ญ คำฟ้า", nickname: "บัว", room: 6, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 7, name: "คุณยายบุญธรรม คลี", nickname: "สุข", room: 7, care: "ผู้สูงอายุพึ่งพาตนเองได้บางส่วน", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 8, name: "คุณตาทอง หลอม", nickname: "สม", room: 8, care: "ผู้สูงอายุพึ่งพาตนเองได้บางส่วน", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 9, name: "คุณตาประชา อินทโชติ", nickname: "หนู", room: 9, care: "ผู้สูงอายุพึ่งพาตนเองได้บางส่วน", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 10, name: "คุณยายประทุม แก้วตา", nickname: "ญา", room: 10, care: "ผู้สูงอายุพึ่งพาตนเองได้บางส่วน", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 11, name: "คุณยายสมนึก นามสวย", nickname: "ตา", room: 11, care: "ผู้สูงอายุพึ่งพาตนเองได้บางส่วน", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 12, name: "คุณตาวัฒนา สุวรรณ", nickname: "แป", room: 12, care: "ผู้สูงอายุพึ่งพาตนเองได้บางส่วน", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 13, name: "คุณยายบุญธรรม คลี", nickname: "วรรณ", room: 13, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 14, name: "คุณยายกำลัง สังขา", nickname: "พล", room: 14, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 15, name: "คุณยายพักพิง นามทอง", nickname: "แมว", room: 15, care: "ผู้สูงอายุทั่วไป", admitted: "20/5/2568", discharged: "20/5/2568" },
    { id: 16, name: "คุณตากล้าศึก บุญมา", nickname: "ไก่", room: 16, care: "ผู้สูงอายุพึ่งพาตนเองได้บางส่วน", admitted: "20/5/2568", discharged: "20/5/2568" },
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl font-semibold text-slate-800">แฟ้มข้อมูลผู้สูงอายุ</h1>
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                เพิ่มประวัติคนไข้
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหารายชื่อ..."
                    className="h-9 w-56 rounded-md border border-slate-200 pl-9 pr-3 text-sm text-slate-700"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  ชั้น
                  <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-slate-700">
                    ทุกชั้น
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  การช่วยเหลือต้องการ
                  <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-slate-700">
                    ทุกกลุ่ม
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <button className="ml-auto inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                  อัพเดทล่าสุด
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-3">ชื่อเล่น</th>
                      <th className="px-4 py-3">ห้อง</th>
                      <th className="px-4 py-3">การช่วยเหลือต้องการ</th>
                      <th className="px-4 py-3">การเข้าพัก</th>
                      <th className="px-4 py-3">คาดว่าจะออก</th>
                      <th className="px-4 py-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {residents.map((resident) => (
                      <tr key={resident.id} className="text-slate-700">
                        <td className="px-4 py-3">{resident.name}</td>
                        <td className="px-4 py-3">{resident.nickname}</td>
                        <td className="px-4 py-3">{resident.room}</td>
                        <td className="px-4 py-3">{resident.care}</td>
                        <td className="px-4 py-3">{resident.admitted}</td>
                        <td className="px-4 py-3">{resident.discharged}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-3">
                            <button className="text-blue-500 hover:text-blue-700" aria-label="View">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-orange-500 hover:text-orange-700" aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button className="text-emerald-500 hover:text-emerald-700" aria-label="Print">
                              <Printer className="h-4 w-4" />
                            </button>
                            <button className="text-slate-600 hover:text-slate-800" aria-label="More options">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
                <span>แสดงผลลัพธ์ผู้สูงอายุทั้งหมด 16 รายการ</span>
                <div className="flex items-center gap-1">
                  <button className="rounded border border-slate-200 px-2 py-1">&lt;&lt;</button>
                  <button className="rounded border border-slate-200 px-2 py-1">&lt;</button>
                  {[1, 2, 3, 4, 5].map((page) => (
                    <button
                      key={page}
                      className={`rounded border border-slate-200 px-2 py-1 ${
                        page === 3 ? "bg-blue-600 text-white" : "text-slate-600"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button className="rounded border border-slate-200 px-2 py-1">&gt;</button>
                  <button className="rounded border border-slate-200 px-2 py-1">&gt;&gt;</button>
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
