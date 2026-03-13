'use client';

import { AppFooter } from "@/components/shared/app-footer";
import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        {/* Main Content */}
        <main className="flex-1 w-full">
          {children}
        </main>
        
        {/* Footer at bottom */}
        <AppFooter />
      </div>
    </ProtectedRoute>
  );
}
