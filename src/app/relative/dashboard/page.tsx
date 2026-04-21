'use client';

import { useState } from 'react';
import { RelativeSidebar } from '@/components/features/relative/sidebar';
import { Menu } from 'lucide-react';
import { AppFooterRelative } from '@/components/features/relative/footer-relative';
import { RelativeDashboardContent } from '@/components/features/relative/dashboard-content';

export default function RelativeDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleDateChange = (date: string) => {
    // TODO: Fetch data for the selected date from backend
    console.log('Selected date:', date);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
