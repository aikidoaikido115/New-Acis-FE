'use client';

import { AppFooter } from "@/components/shared/app-footer";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function StaffKitchenLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isSidebarOpen, setIsSidebarOpen, isSidebarCollapsed, setIsSidebarCollapsed, isReady } = useSidebarState();

  return (
    <ProtectedRoute allowedRoles={[
      "kitchen",
      "Kitchen",
      "KITCHEN",
      "ครัว",
      "โภชนา",
      "superuser",
      "Superuser",
      "SUPERUSER",
      "admin",
      "Admin",
      "ADMIN",
    ]}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppNavbar
          user={{
            firstName: user?.first_name || "ผู้ใช้งาน",
            role: user?.role_name,
            profile_image: user?.profile_image,
          }}

          notificationsCount={0}
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

          <main
            className={cn(
              "flex-1",
              isReady && "transition-[margin-left] duration-300",
              isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
            )}
          >
            {children}
          </main>
        </div>
        <div className={cn("mt-auto transition-[margin-left] duration-300", isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72")}>
          <AppFooter />
        </div>
      </div>
    </ProtectedRoute>
  );
}
