'use client';

import { useEffect, useState } from 'react';
import { DailySummaryHeader } from './daily-summary-header';
import { DailyActivities } from './daily-activities';
import { AdditionalNotes } from './additional-notes';

interface RelativeDashboardContentProps {
  residentName?: string;
  residentId?: string;
  lastUpdatedAt?: string;
  onDateChange?: (date: string) => void;
  showPreviewBanner?: boolean;
}

export function RelativeDashboardContent({ 
  residentName,
  residentId,
  lastUpdatedAt,
  onDateChange,
  showPreviewBanner = false 
}: RelativeDashboardContentProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [lastUpdatedAtState, setLastUpdatedAtState] = useState<string | undefined>(lastUpdatedAt);

  useEffect(() => {
    setLastUpdatedAtState(lastUpdatedAt);
  }, [lastUpdatedAt]);

  const formatDateKey = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : undefined;

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date && onDateChange) {
      onDateChange(formatDateKey(date));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Preview Banner */}
      {showPreviewBanner && residentName && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">ตัวอย่างหน้าที่ญาติจะเห็นของผู้สูงอายุ</span>: {residentName}
          </p>
        </div>
      )}

      {/* Header with date */}
      <DailySummaryHeader 
        onDateChange={handleDateChange}
        selectedDate={selectedDate}
        lastUpdatedAt={lastUpdatedAtState}
      />

      {/* Daily Activities */}
      <DailyActivities />

      {/* Additional Notes */}
      <AdditionalNotes
        residentId={residentId}
        selectedDate={selectedDateKey}
        onLastUpdatedChange={setLastUpdatedAtState}
      />
    </div>
  );
}
