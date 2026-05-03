'use client';

import { useState, useEffect } from 'react';
import { DailySummaryHeader } from './daily-summary-header';
import { DailyActivities } from './daily-activities';
import { AdditionalNotes } from './additional-notes';
import { activityParticipationService } from '@/services/activity-participation.service';
import type { RelativeDashboardNote } from '@/services/relative-portal.service';
import type { ActivityParticipation } from '@/types/activity-participation';

interface RelativeDashboardContentProps {
  residentId?: string;
  residentName?: string;
  lastUpdatedAt?: string;
  notes?: RelativeDashboardNote[];
  isLoading?: boolean;
  isInitialLoading?: boolean;
  error?: string | null;
  onDateChange?: (date: string) => void;
  showPreviewBanner?: boolean;
}

export function RelativeDashboardContent({ 
  residentId,
  residentName,
  lastUpdatedAt,
  notes = [],
  isLoading = false,
  isInitialLoading = false,
  error = null,
  onDateChange,
  showPreviewBanner = false 
}: RelativeDashboardContentProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [participations, setParticipations] = useState<ActivityParticipation[]>([]);
  const [participationsLoading, setParticipationsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for manual refresh

  const formatDateKey = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fetch participations for the selected date
  const fetchParticipations = async () => {
    if (!residentId || !selectedDate) {
      setParticipations([]);
      return;
    }

    setParticipationsLoading(true);
    try {
      const allParticipations = await activityParticipationService.getAll();
      const dateKey = formatDateKey(selectedDate);
      
      // Filter participations for this resident on the selected date
      const filtered = (allParticipations || []).filter(p => {
        const scheduleDate = p.activity_schedule?.date;
        const scheduleKey = scheduleDate ? formatDateKey(new Date(scheduleDate)) : "";
        return p.resident_id === residentId && scheduleKey === dateKey;
      });
      
      setParticipations(filtered);
    } catch (err) {
      console.error('Failed to fetch participations:', err);
      setParticipations([]);
    } finally {
      setParticipationsLoading(false);
    }
  };

  // Auto-refresh participations on date change
  useEffect(() => {
    void fetchParticipations();
  }, [residentId, selectedDate, refreshTrigger]);

  // Auto-poll for participation updates every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      void fetchParticipations();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [residentId, selectedDate]);

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
