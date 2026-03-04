'use client';

import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";

export default function StaffNurseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["nurse", "Nurse", "NURSE"]}>
      {children}
    </ProtectedRoute>
  );
}
