"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { ElderTablePagination } from "@/components/features/elder-info/pagination";
import { MealHistoryFilters } from "@/components/features/kitchen/MealHistoryFilters";
import { MealHistoryTable } from "@/components/features/kitchen/MealHistoryTable";
import { MealHistoryMobileModal } from "@/components/features/kitchen/MealHistoryMobileModal";
import type { MealHistoryRow, TimeOption } from "@/components/features/kitchen/MealHistory.types";

export interface MealHistoryViewProps {
  onBack: () => void;
}

export function MealHistoryView({ onBack }: MealHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);

  const timeOptions: TimeOption[] = [
    { value: "", label: "ทุกมื้อ" },
    { value: "เช้า", label: "เช้า" },
    { value: "กลางวัน", label: "กลางวัน" },
    { value: "เย็น", label: "เย็น" },
  ];

  const formatThaiDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
  };

  const historyRows: MealHistoryRow[] = [
    { id: "1", date: "02/04/2569 06:32", time: "เช้า", menu: "ข้าวต้มปลา", servings: "24", notes: "ลดเค็ม", createdBy: "ครัวเช้า" },
    { id: "2", date: "02/04/2569 12:00", time: "กลางวัน", menu: "ข้าวผัดผักรวม", servings: "30", notes: "ไม่ใส่กุ้ง", createdBy: "ครัวกลางวัน" },
    { id: "3", date: "02/04/2569 17:05", time: "เย็น", menu: "แกงจืดเต้าหู้หมูสับ", servings: "28", notes: "แยกพริก", createdBy: "ครัวเย็น" },
    { id: "4", date: "01/04/2569 06:32", time: "เช้า", menu: "โจ๊กหมู", servings: "22", notes: "เนื้อหมูสับละเอียดมากๆ", createdBy: "ครัวเช้า" },
  ];

  const filteredRows = useMemo(() => {
    return historyRows.filter((row) => {
      const matchesSearch = !searchTerm.trim() ||
        row.menu.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const matchesTime = !selectedTime || row.time === selectedTime;
      const rowDateOnly = row.date.split(" ")[0];
      const matchesDate = !selectedDate || rowDateOnly === formatThaiDate(selectedDate);
      return matchesSearch && matchesTime && matchesDate;
    });
  }, [historyRows, searchTerm, selectedTime, selectedDate]);

  useEffect(() => {
    setCurrentPage(1);
    setOpenPopoverId(null);
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
  }, [searchTerm, selectedDate, selectedTime]);

  const ITEMS_PER_PAGE = 10;
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const handleOpenPopover = (id: string) => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    setOpenPopoverId(id);
  };

  const handleClosePopover = () => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    setOpenPopoverId(null);
  };

  const activeRow = openPopoverId
    ? historyRows.find((row) => row.id === openPopoverId) ?? null
    : null;

  return (
    <div className="space-y-6 px-2 sm:px-4 w-full min-w-0">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 rounded"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-body-small font-medium">ย้อนกลับ</span>
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-headline-5 font-bold text-gray-800">รายการแผนอาหารที่บันทึกไว้</h1>
      </div>

      <MealHistoryFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        selectedTime={selectedTime}
        onSelectedTimeChange={setSelectedTime}
        timeOptions={timeOptions}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden relative">
        <MealHistoryTable rows={paginatedRows} onOpenPopover={handleOpenPopover} />
        <MealHistoryMobileModal row={activeRow} onClose={handleClosePopover} />

        <ElderTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startItem={startItem}
          endItem={endItem}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}