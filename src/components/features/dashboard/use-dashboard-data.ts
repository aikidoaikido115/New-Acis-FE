"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { roomService } from "@/services/room.service";
import { residentService } from "@/services/resident.service";
import { warehouseService } from "@/services/warehouse.service";
import { vitalSignService } from "@/services/vital-sign.service";
import { drugPlanService } from "@/services/drug-plan.service";
import { useAuth } from "@/hooks/useAuth";
import type { GenderStats, ResidentStats } from "@/types/dashboard";
import type { Room } from "@/types/room";
import type { ResidentOverviewItem } from "@/types/resident";
import type { DrugPlan } from "@/types/drug-plan";
import type { VitalSign } from "@/types/vital-sign";
import {
  DEFAULT_MEDICINE_STATUS,
  DEFAULT_VITAL_STATS,
  INVENTORY_ITEMS,
  computeResidentAndGenderStats,
  filterResidents,
  formatThaiDate,
  getScheduleItemsForDate,
  isSameDay,
  resolveTimeOfDayKeys,
  toDateInputValue,
  type ResidentSnapshot,
  type InventoryStatKey,
} from "@/components/features/dashboard/dashboard-utils";
import { activityScheduleService } from "@/services/activity-schedule.service";
import { be } from "date-fns/locale";

const formatHHMM = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export type StatCardItem = { label: string; value: number };
export type VitalStatItem = { label: string; value: number; variant: "normal" | "warning" | "danger" };
export type MedicineStatusItem = { label: string; value: string };
export type ScheduleItemWithBadge = {
  time: string;
  title: string;
  detail: string;
  location: string;
  badge: string;
};
export type InventoryCardItem = {
  key: InventoryStatKey;
  label: string;
  href: string;
  count: number;
  valueClass: string;
  linkLabel: string;
};

const logApiError = (label: string, error: unknown) => {
  if (error && typeof error === "object") {
    const message = "message" in error ? String((error as { message?: string }).message || "") : undefined;
    const status = "status_code" in error ? (error as { status_code?: number }).status_code : undefined;
    console.error(label, { message, status, error });
    return;
  }

  console.error(label, error);
};

export function useDashboardData() {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activityDate, setActivityDate] = useState(new Date());
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [residents, setResidents] = useState<ResidentSnapshot[]>([]);
  const [vitalStats, setVitalStats] = useState<VitalStatItem[]>(DEFAULT_VITAL_STATS);
  const [medicineStatus, setMedicineStatus] = useState<MedicineStatusItem[]>(DEFAULT_MEDICINE_STATUS);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingWithdrawCount, setPendingWithdrawCount] = useState(0);
  const [pendingRestockCount, setPendingRestockCount] = useState(0);

  const normalizedFloor = useMemo(() => {
    const floorNumber = selectedFloor !== "all" ? Number(selectedFloor) : undefined;
    return Number.isFinite(floorNumber) ? floorNumber : undefined;
  }, [selectedFloor]);

  const residentById = useMemo(() => {
    const entries: Array<[string, ResidentSnapshot]> = [];
    residents.forEach((resident) => {
      if (resident.resident_id) {
        entries.push([String(resident.resident_id), resident]);
      }
    });
    return new Map(entries);
  }, [residents]);

  const filteredResidents = useMemo(
    () => filterResidents(residents, normalizedFloor, selectedDate),
    [residents, normalizedFloor, selectedDate]
  );

  const { residentStats, genderStats } = useMemo(
    () => computeResidentAndGenderStats(filteredResidents),
    [filteredResidents]
  );

  const scheduleBadge = useMemo(
    () => (isSameDay(activityDate, new Date()) ? "วันนี้" : formatThaiDate(activityDate)),
    [activityDate]
  );

  const [scheduleItemsApi, setScheduleItemsApi] = useState<ScheduleItemWithBadge[]>([]);
  const [schedulesByMonth, setSchedulesByMonth] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const dateKey = toDateInputValue(activityDate);
        const schedules = await activityScheduleService.getByDate(dateKey);
        if (!mounted) return;
        const mapped = (schedules || []).map((s) => ({
          time: `${formatHHMM(s.start_time)}-${formatHHMM(s.end_time)}`,
          title: s.activity?.activity_name || "กิจกรรม",
          detail: s.activity?.activity_type || "-",
          location: s.activity?.location || "-",
          badge: scheduleBadge,
        }));
        setScheduleItemsApi(mapped);
      } catch (err) {
        setScheduleItemsApi([]);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [activityDate, scheduleBadge]);

// Load schedules for the current month to display activity count on calendar
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const allSchedules = await activityScheduleService.getAll();
        if (!mounted) return;
        
        // Group schedules by date
        const byDate: Record<string, number> = {};
        (allSchedules || []).forEach((s) => {
          if (s.date) {
            // 1. นำข้อมูลมาแปลงเป็น Date Object เพื่อปรับ Timezone ให้ตรงกับเครื่องผู้ใช้ (ไทย)
            const d = new Date(s.date);
            
            // 2. เช็คว่าเป็นวันที่ที่ถูกต้อง ไม่ใช่ Invalid Date
            if (!Number.isNaN(d.getTime())) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              
              // 3. ประกอบร่าง YYYY-MM-DD ที่เป็นเวลา Local แล้ว
              const key = `${year}-${month}-${day}`; 
              
              byDate[key] = (byDate[key] || 0) + 1;
            }
          }
        });
        setSchedulesByMonth(byDate);
      } catch (err) {
        setSchedulesByMonth({});
      }
    };
    void load();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  const scheduleItems = useMemo<ScheduleItemWithBadge[]>(
    () => (scheduleItemsApi.length ? scheduleItemsApi : getScheduleItemsForDate(activityDate).map((item) => ({ ...item, badge: scheduleBadge }))),
    [activityDate, scheduleBadge, scheduleItemsApi]
  );

  const inventoryCards = useMemo<InventoryCardItem[]>(() => {
    const countMap: Record<InventoryStatKey, number> = {
      lowStock: lowStockCount,
      pendingWithdraw: pendingWithdrawCount,
      pendingRestock: pendingRestockCount,
    };

    return INVENTORY_ITEMS.map((item) => {
      const count = countMap[item.key] || 0;
      const valueClass = count > 0 ? "text-red-500" : "text-slate-500";
      const linkLabel = item.href === "/warehouse" ? "หน้ายาและเวชภัณฑ์" : "หน้าประวัติการทำรายการ";
      return { ...item, count, valueClass, linkLabel };
    });
  }, [lowStockCount, pendingWithdrawCount, pendingRestockCount]);

  const statCards = useMemo<StatCardItem[]>(
    () => [
      { label: "ผู้สูงอายุทั้งหมด", value: residentStats.total },
      { label: "ผู้สูงอายุทั่วไป", value: residentStats.general },
      { label: "ผู้สูงอายุช่วยเหลือตนเองได้บางส่วน", value: residentStats.partial_assist },
      { label: "ผู้สูงอายุติดเตียง", value: residentStats.bedridden },
    ],
    [residentStats]
  );

  const fetchResidentOverviewAll = useCallback(async () => {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const items: ResidentOverviewItem[] = [];

    do {
      const response = await residentService.getOverview({
        floor: normalizedFloor,
        status: "active",
        page,
        page_size: pageSize,
      });
      items.push(...(response.items || []));
      totalPages = response.pagination?.total_pages || 1;
      page += 1;
    } while (page <= totalPages);

    return items;
  }, [normalizedFloor]);

  const refreshResidents = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setRooms([]);
      setResidents([]);
      return;
    }
    setIsLoading(true);
    try {
      const [roomsRes, overviewItems] = await Promise.all([
        roomService.getAll(),
        fetchResidentOverviewAll(),
      ]);

      const normalizedOverview: ResidentSnapshot[] = overviewItems.map((item) => ({
        resident_id: item.resident_id,
        gender: item.gender || "",
        status: item.status || "",
        check_in_date: item.check_in_date || undefined,
        expected_check_out_date: item.expected_check_out_date || undefined,
        floor: typeof item.floor === "number" ? item.floor : undefined,
        intake_labels: item.intake_labels || [],
      }));

      setRooms(roomsRes || []);
      setResidents(normalizedOverview);
    } catch (error) {
      logApiError("Failed to fetch resident overview:", error);
      setResidents([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchResidentOverviewAll]);

  const loadInventoryItems = useCallback(async () => {
    if (!isAuthenticated) {
      setLowStockCount(0);
      return;
    }
    try {
      const items = await warehouseService.getItems();
      
      const lowStock = items.filter((item: any) => {
        const minThreshold = item.minimumQuantity ?? 5;
        
        return item.quantity <= minThreshold;
      }).length; 
      
      setLowStockCount(lowStock);
    } catch (error) {
      console.error("Failed to fetch warehouse items:", error);
      setLowStockCount(0);
    }
  }, [isAuthenticated]);

  const loadPendingTransactions = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingWithdrawCount(0);
      setPendingRestockCount(0);
      return;
    }
    try {
      const pendingTransactions = await warehouseService.getTransactions({
        status: "รออนุมัติ",
      });
      setPendingWithdrawCount(pendingTransactions.filter((tx) => tx.type === "เบิกสินค้า").length);
      setPendingRestockCount(pendingTransactions.filter((tx) => tx.type === "เติมสินค้า").length);
    } catch (error) {
      logApiError("Failed to fetch warehouse transactions:", error);
      setPendingWithdrawCount(0);
      setPendingRestockCount(0);
    }
  }, [isAuthenticated]);

  const loadVitalStats = useCallback(async () => {
    if (!isAuthenticated) {
      setVitalStats(DEFAULT_VITAL_STATS);
      return;
    }
    try {
      const dateKey = toDateInputValue(selectedDate);
      const pageSize = 100;
      let page = 1;
      let totalPages = 1;
      const allItems: VitalSign[] = [];

      do {
        const response = await vitalSignService.getOverview({
          floor: normalizedFloor,
          vitalsign_status: "all",
          date: dateKey,
          page,
          page_size: pageSize,
        });
        allItems.push(...(response.items || []));
        totalPages = response.pagination?.total_pages || 1;
        page += 1;
      } while (page <= totalPages);

      const latestByResident = new Map<string, { item: (typeof allItems)[number]; timestamp: number }>();
      allItems.forEach((item) => {
        if (!item?.resident_id) return;
        const timestamp = item.created_at ? new Date(item.created_at).getTime() : 0;
        const existing = latestByResident.get(item.resident_id);
        if (!existing || timestamp > existing.timestamp) {
          latestByResident.set(item.resident_id, { item, timestamp });
        }
      });

      const latestItems = Array.from(latestByResident.values()).map((entry) => entry.item);
      const normalCount = latestItems.filter((item: any) => (item.abnormal_list?.length ?? 0) === 0).length;
      const abnormalCount = latestItems.filter((item: any) => (item.abnormal_list?.length ?? 0) > 0).length;

      setVitalStats([
        { label: "ปกติ", value: normalCount, variant: "normal" },
        { label: "ต้องติดตาม", value: abnormalCount, variant: "danger" },
      ]);
    } catch (error) {
      logApiError("Failed to fetch vital sign stats:", error);
      setVitalStats(DEFAULT_VITAL_STATS);
    }
  }, [normalizedFloor, selectedDate, isAuthenticated]);

  const loadMedicineStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setMedicineStatus(DEFAULT_MEDICINE_STATUS);
      return;
    }
    try {
      // 1. ดึงข้อมูลแผนยาทั้งหมด
      const plans = await drugPlanService.getOverview();
      
      // 2. กรองตามชั้น (Floor)
      const filteredByFloor = normalizedFloor === undefined
        ? plans
        : plans.filter((plan: any) => {
            const residentId = plan.PersonalDrug?.resident_id;
            const resident = residentId ? residentById.get(String(residentId)) : undefined;
            return resident?.floor === normalizedFloor;
          });

      // 3. เตรียมตัวนับ
      const totals = {
        morning: new Set<string>(),
        noon: new Set<string>(),
        evening: new Set<string>(),
        bedtime: new Set<string>(),
      };
      const pending = {
        morning: new Set<string>(),
        noon: new Set<string>(),
        evening: new Set<string>(),
        bedtime: new Set<string>(),
      };

      // 5. นับจำนวนผู้สูงอายุที่รอให้ยาในแต่ละมื้อ (นับเป็นคน)
      filteredByFloor.forEach((plan: any) => {
        const timeOfDayString = plan.PersonalDrug?.time_of_day || plan.PersonalDrug?.timing || "";
        const residentId = plan.PersonalDrug?.resident_id;
        if (!residentId) return;
        const keys = resolveTimeOfDayKeys(timeOfDayString);
        const isPending = !plan.is_taken && !plan.is_omitted;

        keys.forEach((key) => {
          if (totals[key as keyof typeof totals]) {
            totals[key as keyof typeof totals].add(residentId);
            if (isPending) {
              pending[key as keyof typeof pending].add(residentId);
            }
          }
        });
      });

      const formatPending = (totalSet: Set<string>, pendingSet: Set<string>) => {
        if (totalSet.size === 0) return "-";
        if (pendingSet.size === 0) return "ครบ";
        return `รอให้ยา ${pendingSet.size} คน`;
      };

      // 6. อัปเดตสถานะเพื่อโชว์บนหน้า Dashboard
      setMedicineStatus([
        { label: "มื้อเช้า", value: formatPending(totals.morning, pending.morning) },
        { label: "มื้อกลางวัน", value: formatPending(totals.noon, pending.noon) },
        { label: "มื้อเย็น", value: formatPending(totals.evening, pending.evening) },
        { label: "ก่อนนอน", value: formatPending(totals.bedtime, pending.bedtime) },
      ]);
    } catch (error) {
      logApiError("Failed to fetch medicine status:", error);
      setMedicineStatus(DEFAULT_MEDICINE_STATUS);
    }
  }, [normalizedFloor, residentById, isAuthenticated]);

  useEffect(() => {
    void refreshResidents();
    void loadInventoryItems();
  }, [isAuthenticated, refreshResidents, loadInventoryItems]);

  useEffect(() => {
    void loadPendingTransactions();
  }, [isAuthenticated, loadPendingTransactions]);

  useEffect(() => {
    void loadVitalStats();
  }, [isAuthenticated, loadVitalStats]);

  useEffect(() => {
    void loadMedicineStatus();
  }, [isAuthenticated, loadMedicineStatus]);

  return {
    selectedDate,
    setSelectedDate,
    activityDate,
    setActivityDate,
    selectedFloor,
    setSelectedFloor,
    isLoading,
    rooms,
    statCards,
    genderStats,
    vitalStats,
    medicineStatus,
    scheduleItems,
    schedulesByMonth,
    inventoryCards,
    refreshResidents,
  };
}
