"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { ElderTablePagination } from "@/components/features/elder-info/pagination";
import { MealHistoryFilters } from "@/components/features/kitchen/MealHistoryFilters";
import { MealHistoryTable } from "@/components/features/kitchen/MealHistoryTable";
import { MealHistoryMobileModal } from "@/components/features/kitchen/MealHistoryMobileModal";
import type { MealHistoryRow, TimeOption } from "@/components/features/kitchen/MealHistory.types";
import { mealService } from "@/services/meal.service";
import { useToast } from "@/components/ui/toast";
import type { Menu } from "@/types/meal"; 

export interface MealHistoryViewProps {
  onBack: () => void;
  availableMenus: Menu[];
}

export function MealHistoryView({ onBack, availableMenus }: MealHistoryViewProps) { 
  const getMenuName = (id: string) => {
    if (!id) return "ไม่ระบุ";
    const foundMenu = availableMenus.find(menu => menu.menu_id === id);
    return foundMenu ? foundMenu.menu_name : 'หาเมนูไม่พบ';
  }
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<MealHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        const mealPlans = await mealService.getAllMealPlans();

        const rows: MealHistoryRow[] = mealPlans.flatMap((plan) => {
          const createdDate = new Date(plan.created_at || new Date());
          const dateStr = formatThaiDate(createdDate);
          const timeStr = createdDate.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const baseId = plan.id || plan.meal_plan_id || Math.random().toString();

          const mainRow: MealHistoryRow = {
            id: `${baseId}-main`, 
            date: `${dateStr} ${timeStr}`,
            time: getThaiMealLabel(plan.meal_type),
            menu: getMenuName(plan.menu_id), 
            servings: String(plan.main_amount || 0),
            notes: plan.menu?.description || "",
            createdBy: plan.staff_name || "ระบบ", 
          };

          const resultRows = [mainRow];

          if (plan.backup_menu_id) {
            const backupRow: MealHistoryRow = {
              id: `${baseId}-backup`,
              date: `${dateStr} ${timeStr}`,
              time: getThaiMealLabel(plan.meal_type), 
              menu: `${getMenuName(plan.backup_menu_id)} (เมนูรอง)`, 
              servings: String(plan.backup_amount || 0),
              notes: "เมนูรองสำหรับผู้แพ้อาหาร",
              createdBy: plan.staff_name || "ระบบ", 
            };
            resultRows.push(backupRow);
          }

          return resultRows;
        });

        setHistoryRows(rows);
      } catch (err) {
        console.error("Failed to fetch meal plans:", err);
        showToast({
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถดึงข้อมูลประวัติแผนอาหารได้ กรุณาลองใหม่อีกครั้ง",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMealPlans();
  }, [showToast, availableMenus]);

  const filteredRows = useMemo(() => {
    return historyRows.filter((row) => {
      const matchesSearch = !searchTerm.trim() ||
        row.menu.toLowerCase().includes(searchTerm.trim().toLowerCase());
      
      const targetTimeLabel = selectedTime ? getThaiMealLabel(selectedTime) : "";
      const matchesTime = !selectedTime || row.time === targetTimeLabel;

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