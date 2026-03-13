'use client';

import { AppFooter } from "@/components/shared/app-footer";
import { ManualSidebar } from "@/components/features/manual/manual-sidebar";
import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";

export default function ManualLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Sidebar as top section */}
          <ManualSidebar />
          
          {/* Content Area */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
        
        {/* Footer at bottom */}
        <AppFooter />
      </div>
    </ProtectedRoute>
  );
}
