"use client";

import { useState } from "react";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";

export default function Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      <div className="flex flex-1">
        <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:ml-72">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-800">first page</h1>
            <p className="mt-2 text-sm text-slate-500">
              หน้านี้เชื่อมต่อกับ navbar, sidebar, และ footer แล้ว
            </p>
          </div>
        </main>
      </div>

      <div className="lg:ml-72 mt-auto">
        <AppFooter />
      </div>
    </div>
  );
}
