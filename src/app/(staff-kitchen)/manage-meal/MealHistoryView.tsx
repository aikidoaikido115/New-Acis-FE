"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { ElderTablePagination } from "@/components/features/elder-info/pagination";
import { MealHistoryFilters } from "@/components/features/kitchen/MealHistoryFilters";
import { MealHistoryTable } from "@/components/features/kitchen/MealHistoryTable";
import { MealHistoryMobileModal } from "@/components/features/kitchen/MealHistoryMobileModal";
import type { MealHistoryRow, TimeOption } from "@/components/features/kitchen/MealHistory.types";
import { mealService } from "@/services/meal.service";

export interface MealHistoryViewProps {
  onBack: () => void;
}

export function MealHistoryView({ onBack }: MealHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<MealHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);

  const timeOptions: TimeOption[] = [
    { value: "", label: "ทุกมื้อ" },
    { value: "breakfast", label: "เช้า" },
    { value: "lunch", label: "กลางวัน" },
    { value: "dinner", label: "เย็น" },
  ];

  const formatThaiDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
  };

  const getThaiMealLabel = (mealType: string): string => {
    const mealMap: Record<string, string> = {
      breakfast: "เช้า",
      lunch: "กลางวัน",
      dinner: "เย็น",
    };
    return mealMap[mealType] || mealType;
  };

  // Fetch meal plans from API
  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const mealPlans = await mealService.getAllMealPlans();

        // Transform API response to MealHistoryRow format
        const rows: MealHistoryRow[] = mealPlans.map((plan) => {
          const createdDate = new Date(plan.created_at || new Date());
          const dateStr = formatThaiDate(createdDate);
          const timeStr = createdDate.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            id: plan.id,
            date: `${dateStr} ${timeStr}`,
            time: plan.meal_type,
            menu: plan.menu?.menu_name || "ไม่ระบุ",
            servings: String(plan.main_amount),
            notes: plan.menu?.description || "",
            createdBy: "ระบบ", // This would need to come from plan if available
          };
        });

        setHistoryRows(rows);
      } catch (err) {
        console.error("Failed to fetch meal plans:", err);
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMealPlans();
  }, []);

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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
