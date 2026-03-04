"use client";
import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

type ViewMode = "days" | "months" | "years";

const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

function formatThaiDate(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543;
  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({ value, onChange, placeholder = "เลือกวันที่", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("days");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setViewDate(value);
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setViewMode("days");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Year range for year picker (show 12 years)
  const startYear = Math.floor(year / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => startYear + i);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handlePrevYearRange = () => {
    setViewDate(new Date(year - 12, month, 1));
  };

  const handleNextYearRange = () => {
    setViewDate(new Date(year + 12, month, 1));
  };

  const handlePrevYear = () => {
    setViewDate(new Date(year - 1, month, 1));
  };

  const handleNextYear = () => {
    setViewDate(new Date(year + 1, month, 1));
  };

  const handleSelectMonth = (selectedMonth: number) => {
    setViewDate(new Date(year, selectedMonth, 1));
    setViewMode("days");
  };

  const handleSelectYear = (selectedYear: number) => {
    setViewDate(new Date(selectedYear, month, 1));
    setViewMode("months");
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(year, month, day);
    onChange?.(newDate);
    setIsOpen(false);
    setViewMode("days");
  };

  const handleHeaderClick = () => {
    if (viewMode === "days") {
      setViewMode("months");
    } else if (viewMode === "months") {
      setViewMode("years");
    }
  };

  const isSelected = (day: number): boolean => {
    if (!value) return false;
    return value.getDate() === day && value.getMonth() === month && value.getFullYear() === year;
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isCurrentMonth = (m: number): boolean => {
    const today = new Date();
    return today.getMonth() === m && today.getFullYear() === year;
  };

  const isSelectedMonth = (m: number): boolean => {
    if (!value) return false;
    return value.getMonth() === m && value.getFullYear() === year;
  };

  const isCurrentYear = (y: number): boolean => {
    const today = new Date();
    return today.getFullYear() === y;
  };

  const isSelectedYear = (y: number): boolean => {
    if (!value) return false;
    return value.getFullYear() === y;
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:bg-slate-50"
      >
        <Calendar className="h-4 w-4" />
        {value ? formatThaiDate(value) : placeholder}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          {/* Days View */}
          {viewMode === "days" && (
            <>
              {/* Month/Year Header */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleHeaderClick}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {MONTHS[month]} {year + 543}
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
                {DAYS.map((day) => (
                  <span key={day} className="py-1">{day}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <span key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    className={cn(
                      "rounded-full py-1.5 transition",
                      isSelected(day)
                        ? "bg-blue-600 text-white"
                        : isToday(day)
                        ? "bg-blue-100 text-blue-600"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Months View */}
          {viewMode === "months" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleHeaderClick}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {year + 543}
                </button>
                <button
                  type="button"
                  onClick={handleNextYear}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MONTHS_SHORT.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMonth(i)}
                    className={cn(
                      "rounded-lg py-2 text-sm transition",
                      isSelectedMonth(i)
                        ? "bg-blue-600 text-white"
                        : isCurrentMonth(i)
                        ? "bg-blue-100 text-blue-600"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Years View */}
          {viewMode === "years" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevYearRange}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-semibold text-slate-700">
                  {startYear + 543} - {startYear + 11 + 543}
                </span>
                <button
                  type="button"
                  onClick={handleNextYearRange}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleSelectYear(y)}
                    className={cn(
                      "rounded-lg py-2 text-sm transition",
                      isSelectedYear(y)
                        ? "bg-blue-600 text-white"
                        : isCurrentYear(y)
                        ? "bg-blue-100 text-blue-600"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {y + 543}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}