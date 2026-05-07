'use client';

import { useEffect, useState } from 'react';
import { RelativeSidebar } from '@/components/features/relative/sidebar';
import { Menu } from 'lucide-react';
import { AppFooterRelative } from '@/components/features/relative/footer-relative';
import { RelativeDashboardContent } from '@/components/features/relative/dashboard-content';
import { relativePortalService, type RelativeDashboardData } from '@/services/relative-portal.service';

export default function RelativeDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<RelativeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (date?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await relativePortalService.getDashboard(date);
      setDashboardData(result);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลภาพรวมประจำวันได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const handleDateChange = (date: string) => {
    void fetchDashboard(date);
  };

  const isInitialLoading = isLoading && !dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-80 z-50 pointer-events-auto">
        <RelativeSidebar isOpen={true} />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-80 min-h-screen">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50"
        >
          <Menu size={24} />
        </button>

        {/* Content */}
        <div className="flex-1 p-8 pt-20 lg:pt-8">
          <RelativeDashboardContent
            residentId={dashboardData?.resident_id}
            residentName={dashboardData?.resident_name}
            lastUpdatedAt={dashboardData?.last_updated_at}
            notes={dashboardData?.notes || []}
            isLoading={isLoading}
            isInitialLoading={isInitialLoading}
            error={error}
            onDateChange={handleDateChange}
          />
        </div>
        <AppFooterRelative />
      </div>
      {/* Sidebar for mobile */}
      <RelativeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
