'use client';

import { useEffect, useMemo, useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';

interface DailySummaryHeaderProps {
  onDateChange?: (date: Date | null) => void;
  selectedDate?: Date | null;
  lastUpdatedAt?: string; // ISO timestamp from backend
}

export function DailySummaryHeader({ onDateChange, selectedDate, lastUpdatedAt }: DailySummaryHeaderProps) {
  const [internalDate, setInternalDate] = useState<Date | null>(selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate !== undefined) {
      setInternalDate(selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (date: Date | null) => {
    setInternalDate(date);
    onDateChange?.(date);
  };

  const displayLastUpdated = useMemo(() => {
    if (!lastUpdatedAt) return '-';
    const date = new Date(lastUpdatedAt);
    if (Number.isNaN(date.getTime())) return '-';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear() + 543);
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }, [lastUpdatedAt]);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <h1 className="text-2xl font-bold text-gray-800">ภาพรวมประจำวัน</h1>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <DatePicker
          value={internalDate}
          onChange={handleDateChange}
          className="w-full md:w-auto"
          placeholder="เลือกวันที่"
        />
        <div className="text-sm text-gray-500 whitespace-nowrap mr-3">
          อัปเดตล่าสุด: {displayLastUpdated}
        </div>
      </div>
    </div>
  );
}
