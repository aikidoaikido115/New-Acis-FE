"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ActivityCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function ActivityCalendar({ selectedDate, onSelectDate }: ActivityCalendarProps) {
  const [viewDate, setViewDate] = useState(selectedDate);
  const [viewMode, setViewMode] = useState<ViewMode>("days");

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

  const handlePrevYear = () => {
    setViewDate(new Date(year - 1, month, 1));
  };

  const handleNextYear = () => {
    setViewDate(new Date(year + 1, month, 1));
  };

  const handlePrevYearRange = () => {
    setViewDate(new Date(year - 12, month, 1));
  };

  const handleNextYearRange = () => {
    setViewDate(new Date(year + 12, month, 1));
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
    onSelectDate(newDate);
  };

  const handleHeaderClick = () => {
    if (viewMode === "days") {
      setViewMode("months");
    } else if (viewMode === "months") {
      setViewMode("years");
    }
  };

  const isSelected = (day: number): boolean => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isCurrentMonth = (m: number): boolean => {
    const today = new Date();
    return today.getMonth() === m && today.getFullYear() === year;
  };

  const isSelectedMonth = (m: number): boolean => {
    return selectedDate.getMonth() === m && selectedDate.getFullYear() === year;
  };

  const isCurrentYear = (y: number): boolean => {
    const today = new Date();
    return today.getFullYear() === y;
  };

  const isSelectedYear = (y: number): boolean => {
    return selectedDate.getFullYear() === y;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      {/* Days View */}
      {viewMode === "days" && (
        <>
          {/* Month/Year Header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="เดือนก่อนหน้า"
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
              aria-label="เดือนถัดไป"
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
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDate(day)}
                className={cn(
                  "rounded-full py-1.5 transition",
                  isSelected(day)
                    ? "bg-blue-600 text-white font-semibold"
                    : isToday(day)
                    ? "bg-blue-100 text-blue-600 font-medium"
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
              aria-label="ปีก่อนหน้า"
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
              aria-label="ปีถัดไป"
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
              aria-label="ช่วงปีก่อนหน้า"
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
              aria-label="ช่วงปีถัดไป"
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
  );
}
