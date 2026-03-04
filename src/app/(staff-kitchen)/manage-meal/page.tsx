"use client";
import { useState, useEffect } from "react";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function ManageMealPage() {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebarState();
  const { user, isLoading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // Wait for user data to load
  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppNavbar
        user={{
          firstName: user.first_name || "ผู้ใช้งาน",
          role: user.role_name
        }}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />
      
      <div className="flex flex-1 pt-16">
        <AppSidebar
          role="kitchen"
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          isReady={isReady}
          onClose={() => setIsSidebarOpen(false)}
          onCollapsedChange={setIsSidebarCollapsed}
        />
        
        <main className={cn(
          "flex-1 overflow-auto transition-[margin-left] duration-300",
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
        )}>
          <div className="p-6">
              <h1 className="text-2xl font-semibold text-slate-800">
                   จัดการมื้ออาหาร
              </h1>
          </div>
        </main>
      </div>

      <div className={cn(
        "mt-auto transition-[margin-left] duration-300",
        isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
      )}>
        <AppFooter />
      </div>
    </div>
  );
}
