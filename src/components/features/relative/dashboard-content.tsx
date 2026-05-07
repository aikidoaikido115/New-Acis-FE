'use client';

import { useState } from 'react';
import { DailySummaryHeader } from './daily-summary-header';
import { DailyActivities } from './daily-activities';
import { AdditionalNotes } from './additional-notes';
import type { RelativeDashboardNote } from '@/services/relative-portal.service';
import type { ActivityParticipation } from '@/types/activity-participation';

interface RelativeDashboardContentProps {
  residentId?: string;
  residentName?: string;
  lastUpdatedAt?: string;
  notes?: RelativeDashboardNote[];
  participations?: ActivityParticipation[];
  isLoading?: boolean;
  isInitialLoading?: boolean;
  error?: string | null;
  onDateChange?: (date: string) => void;
  showPreviewBanner?: boolean;
}

export function RelativeDashboardContent({ 
  residentName,
  lastUpdatedAt,
  notes = [],
  participations = [],
  isLoading = false,
  isInitialLoading = false,
  error = null,
  onDateChange,
  showPreviewBanner = false 
}: RelativeDashboardContentProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const formatDateKey = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date && onDateChange) {
      onDateChange(formatDateKey(date));
    }
  };

  return (
    <div className="max-w-full space-y-6">
      {/* Preview Banner */}
      {showPreviewBanner && residentName && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">ตัวอย่างหน้าที่ญาติจะเห็นของผู้สูงอายุ</span>: {residentName}
          </p>
        </div>
      )}

      {isInitialLoading ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="h-10 w-64 rounded bg-gray-200 animate-pulse" />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-7 w-56 rounded bg-gray-200 animate-pulse mb-6" />
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-7 w-64 rounded bg-gray-200 animate-pulse mb-6" />
            <div className="space-y-3">
              <div className="h-5 w-full rounded bg-gray-200 animate-pulse" />
              <div className="h-5 w-11/12 rounded bg-gray-200 animate-pulse" />
              <div className="h-5 w-10/12 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Header with date */}
          <DailySummaryHeader 
            onDateChange={handleDateChange}
            selectedDate={selectedDate}
            lastUpdatedAt={lastUpdatedAt}
          />

          {/* Daily Activities */}
          <DailyActivities participations={participations} lastUpdatedAt={lastUpdatedAt} />

          {/* Additional Notes */}
          <AdditionalNotes
            notes={notes}
            isLoading={isLoading}
            error={error}
          />
        </>
      )}
    </div>
  );
}
