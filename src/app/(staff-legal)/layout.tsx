'use client';

import { useState } from "react";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function StaffLegalLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Map role_name to sidebar role
  const getSidebarRole = (): "nurse" | "kitchen" => {
    if (user?.role_name === "kitchen") return "kitchen";
    return "nurse"; // default
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <AppNavbar
        user={{ 
          firstName: user?.first_name || "ผู้ใช้งาน", 
          role: user?.role_name 
        }}
        notificationsCount={0}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      <div className="flex flex-1 pt-16">
        <AppSidebar
          role={getSidebarRole()}
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onClose={() => setIsSidebarOpen(false)}
          onCollapsedChange={setIsSidebarCollapsed}
        />

        <div
          className={cn(
            "flex-1 flex flex-col min-h-[calc(100vh-4rem)] transition-[margin-left] duration-300",
            isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
          )}
        >
          <main className="flex-1 w-full">
            {children}
          </main>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
