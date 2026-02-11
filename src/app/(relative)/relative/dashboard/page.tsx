'use client';

import { useState } from 'react';
import { RelativeSidebar } from '@/components/features/relative/sidebar';
import { Menu } from 'lucide-react';
import { AppFooterRelative } from '@/components/features/relative/footer-relative';
import { DailySummaryHeader } from '@/components/features/relative/daily-summary-header';
import { NursingCareLog } from '@/components/features/relative/nursing-care-log';
import { DailyActivities } from '@/components/features/relative/daily-activities';
import { AdditionalNotes } from '@/components/features/relative/additional-notes';

export default function RelativeDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // TODO: Replace with actual data from backend API
  // This would come from the backend response
  const mockLastUpdatedAt = '2025-02-12T20:00:00+07:00';

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // TODO: Fetch data for the selected date from backend
    console.log('Selected date:', date);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-80 z-50">
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
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header with date */}
            <DailySummaryHeader 
              onDateChange={handleDateChange}
              lastUpdatedAt={mockLastUpdatedAt}
            />

            {/* Nursing Care Log */}
            <NursingCareLog />

            {/* Daily Activities */}
            <DailyActivities />

            {/* Additional Notes */}
            <AdditionalNotes />
          </div>
        </div>
        <AppFooterRelative />
      </div>
      {/* Sidebar for mobile */}
      <RelativeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
