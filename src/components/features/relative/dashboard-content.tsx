'use client';

import { DailySummaryHeader } from './daily-summary-header';
import { NursingCareLog } from './nursing-care-log';
import { DailyActivities } from './daily-activities';
import { AdditionalNotes } from './additional-notes';

interface RelativeDashboardContentProps {
  residentName?: string;
  lastUpdatedAt?: string;
  onDateChange?: (date: string) => void;
  showPreviewBanner?: boolean;
}

export function RelativeDashboardContent({ 
  residentName,
  lastUpdatedAt = '2025-02-12T20:00:00+07:00',
  onDateChange,
  showPreviewBanner = false 
}: RelativeDashboardContentProps) {
  
  const handleDateChange = (date: string) => {
    if (onDateChange) {
      onDateChange(date);
    }
    // TODO: Fetch data for the selected date
    console.log('Selected date:', date);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Preview Banner */}
      {showPreviewBanner && residentName && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">ตัวอย่างหน้าที่ญาติจะเห็น</span>: {residentName}
          </p>
        </div>
      )}

      {/* Header with date */}
      <DailySummaryHeader 
        onDateChange={handleDateChange}
        lastUpdatedAt={lastUpdatedAt}
      />

      {/* Nursing Care Log */}
      <NursingCareLog />

      {/* Daily Activities */}
      <DailyActivities />

      {/* Additional Notes */}
      <AdditionalNotes />
    </div>
  );
}
