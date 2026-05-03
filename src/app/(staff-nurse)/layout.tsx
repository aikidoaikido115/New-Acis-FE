'use client';

import { AppFooter } from "@/components/shared/app-footer";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

function isSuperuserRole(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return (
    normalizedRole.includes("superuser") ||
    normalizedRole.includes("super user") ||
    normalizedRole.includes("super_user")
  );
}

function isKitchenRole(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return normalizedRole.includes("kitchen") || normalizedRole.includes("ครัว") || normalizedRole.includes("โภชนา");
}

export default function StaffNurseLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen, isSidebarCollapsed, setIsSidebarCollapsed, isReady } = useSidebarState();

  const allowKitchenForThisPage = pathname.startsWith("/support-tickets");
  const allowedRoles = allowKitchenForThisPage
    ? ["nurse", "Nurse", "NURSE", "kitchen", "Kitchen", "KITCHEN", "superuser", "Superuser", "SUPERUSER", "admin", "Admin", "ADMIN"]
    : ["nurse", "Nurse", "NURSE", "superuser", "Superuser", "SUPERUSER", "admin", "Admin", "ADMIN"];

  const sidebarRole = isKitchenRole(user?.role_name)
    ? "kitchen"
    : isSuperuserRole(user?.role_name)
      ? "superuser"
      : "nurse";

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppNavbar
          user={{
            firstName: user?.first_name || "ผู้ใช้งาน",
            role: user?.role_name,
            profile_image: user?.profile_image,
          }}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="flex flex-1 pt-16">
          <AppSidebar
            role={sidebarRole}
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
