'use client';

import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";

export default function StaffKitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["kitchen", "Kitchen", "KITCHEN"]}>
      {children}
    </ProtectedRoute>
  );
}
