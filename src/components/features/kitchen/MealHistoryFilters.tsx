"use client";
import { Search, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import type { TimeOption } from "./MealHistory.types";

interface MealHistoryFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedDate: Date | null;
  onSelectedDateChange: (date: Date | null) => void;
  selectedTime: string;
  onSelectedTimeChange: (value: string) => void;
  timeOptions: TimeOption[];
}

export function MealHistoryFilters({
  searchTerm,
  onSearchTermChange,
  selectedDate,
  onSelectedDateChange,
  selectedTime,
  onSelectedTimeChange,
  timeOptions,
}: MealHistoryFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row w-full">
      <div className="w-full sm:w-[300px] sm:pr-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="ค้นหาชื่อเมนู..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-body-small rounded-md border border-slate-200 text-slate-700 focus:text-slate-900 focus:ring-slate-600 focus:border-slate-600 placeholder:text-[#CCCCCC] bg-white"
          />
        </div>
      </div>

      <div className="flex flex-row w-full gap-2 sm:w-auto">
        <div className="relative flex-1 sm:w-40 sm:flex-none">
          <DatePicker
            value={selectedDate}
            onChange={onSelectedDateChange}
            className="w-full pr-8 focus:ring-slate-600"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => onSelectedDateChange(null)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600"
              aria-label="ล้างวันที่"
              tabIndex={-1}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 sm:w-32 sm:flex-none">
          <Dropdown
            options={timeOptions}
            value={selectedTime}
            onChange={onSelectedTimeChange}
            placeholder="มื้ออาหาร"
            className="w-full focus:ring-slate-600"
          />
        </div>
      </div>
    </div>
  );
}
