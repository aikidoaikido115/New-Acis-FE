"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/components/ui/dropdown";
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
  const datePickerClassName = useMemo(() => "w-[200px]", []);

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
        <Dropdown
          options={[
            { value: "newest", label: "ใหม่สุดก่อน" },
            { value: "oldest", label: "เก่าสุดก่อน" },
          ]}
          value={sortOrder}
          onChange={(value) => onSortOrderChange(value as TimelineSortOrder)}
          placeholder="เลือก"
        />
      </div>
    </div>
  );
}