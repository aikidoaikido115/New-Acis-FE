"use client";

import { useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import type { TimelineSortOrder } from "./note-timeline";

interface NoteTimelineControlsProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  sortOrder: TimelineSortOrder;
  onSortOrderChange: (value: TimelineSortOrder) => void;
  className?: string;
  showClearButton?: boolean;
}

export function NoteTimelineControls({
  selectedDate,
  onDateChange,
  sortOrder,
  onSortOrderChange,
  className,
  showClearButton = true,
}: NoteTimelineControlsProps) {
  const datePickerClassName = useMemo(
    () => "w-[200px] [&>button]:w-full [&>button]:justify-between [&>button]:border-2 [&>button]:border-blue-500 [&>button]:hover:bg-blue-50",
    []
  );

  return (
    <div className={className ? className : "flex flex-wrap items-center gap-3"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body-small text-gray-600">วันที่</span>
        <DatePicker
          value={selectedDate}
          onChange={onDateChange}
          placeholder="ทั้งหมด"
          className={datePickerClassName}
        />
        {selectedDate && showClearButton ? (
          <button
            type="button"
            onClick={() => onDateChange(null)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-body-small font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Calendar className="h-4 w-4" />
            ทั้งหมด
          </button>
        ) : null}
      </div>

      <div className="relative flex items-center gap-2">
        <span className="text-body-small text-gray-600">เรียงเวลา</span>
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value as TimelineSortOrder)}
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-10 text-body-small text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">ใหม่สุดก่อน</option>
            <option value="oldest">เก่าสุดก่อน</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
    </div>
  );
}