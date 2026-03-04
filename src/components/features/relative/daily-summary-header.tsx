'use client';

import { useEffect, useState } from 'react';
import { DatePicker } from 'antd';
import type { DatePickerProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface DailySummaryHeaderProps {
  onDateChange?: (date: string) => void;
  lastUpdatedAt?: string; // ISO timestamp from backend
}

export function DailySummaryHeader({ onDateChange, lastUpdatedAt }: DailySummaryHeaderProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isMounted, setIsMounted] = useState(false);

  // TODO: Replace with actual last updated time from backend
  const mockLastUpdated = lastUpdatedAt || '2025-02-12T20:00:00+07:00';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDateChange: DatePickerProps['onChange'] = (date) => {
    if (date && !Array.isArray(date)) {
      setSelectedDate(date);
      if (onDateChange) {
        onDateChange(date.format('YYYY-MM-DD'));
      }
    }
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!isMounted) return '';
    const date = dayjs(mockLastUpdated);
    const buddhistYear = date.year() + 543;
    const formattedDate = `${date.format('DD/MM')}/${buddhistYear}`;
    const formattedTime = date.format('HH:mm');
    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <h1 className="text-2xl font-bold text-gray-800">ภาพรวมประจำวัน</h1>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        {isMounted && (
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format={{
              format: 'DD/MM/BBBB',
              type: 'mask',
            }}
            className="w-full md:w-auto"
            placeholder="เลือกวันที่"
          />
        )}
        {isMounted && (
          <div className="text-sm text-gray-500 whitespace-nowrap mr-3">
            อัปเดตล่าสุด: {formatLastUpdated()}
          </div>
        )}
      </div>
    </div>
  );
}
