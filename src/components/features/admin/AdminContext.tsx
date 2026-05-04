"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface AdminContextType {
  pendingCount: number;
  setPendingCount: (count: number) => void;
  refetchPendingCount: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);

  const refetchPendingCount = useCallback(async () => {
    try {
      const { adminService } = await import("@/services/admin.service");
      const users = await adminService.getUsers();
      const pending = users.filter((user) => user.status === "inactive").length;
      setPendingCount(pending);
    } catch (error) {
      console.error("Failed to refetch pending count:", error);
    }
  }, []);

  return (
    <AdminContext.Provider value={{ pendingCount, setPendingCount, refetchPendingCount }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within AdminProvider");
  }
  return context;
}
