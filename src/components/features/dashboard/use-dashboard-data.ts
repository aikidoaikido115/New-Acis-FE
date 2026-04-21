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
import {
  DEFAULT_MEDICINE_STATUS,
  DEFAULT_VITAL_STATS,
  INVENTORY_ITEMS,
  buildMedicineValue,
  computeResidentAndGenderStats,
  filterByDate,
  filterResidents,
  formatThaiDate,
  getScheduleItemsForDate,
  isSameDay,
  resolveTimeOfDayKey,
  toDateInputValue,
  type ResidentSnapshot,
  type InventoryStatKey,
} from "@/components/features/dashboard/dashboard-utils";

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

  const scheduleItems = useMemo<ScheduleItemWithBadge[]>(
    () => getScheduleItemsForDate(activityDate).map((item) => ({ ...item, badge: scheduleBadge })),
    [activityDate, scheduleBadge]
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
      const linkLabel = item.href === "/warehouse" ? "หน้าสินค้าคงคลัง" : "หน้าประวัติการทำรายการ";
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
        gender: item.gender,
        status: item.status,
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
      const lowStock = items.filter((item) => {
        const minimum = item.minimumQuantity ?? 0;
        return minimum > 0 && item.quantity <= minimum;
      }).length;
      setLowStockCount(lowStock);
    } catch (error) {
      logApiError("Failed to fetch warehouse items:", error);
      setLowStockCount(0);
    }
  }, []);

  const loadPendingTransactions = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingWithdrawCount(0);
      setPendingRestockCount(0);
      return;
    }
    try {
      const dateKey = toDateInputValue(selectedDate);
      const pendingTransactions = await warehouseService.getTransactions({
        status: "รออนุมัติ",
        startDate: dateKey,
        endDate: dateKey,
      });
      setPendingWithdrawCount(pendingTransactions.filter((tx) => tx.type === "เบิกสินค้า").length);
      setPendingRestockCount(pendingTransactions.filter((tx) => tx.type === "เติมสินค้า").length);
    } catch (error) {
      logApiError("Failed to fetch warehouse transactions:", error);
      setPendingWithdrawCount(0);
      setPendingRestockCount(0);
    }
  }, [selectedDate]);

  const loadVitalStats = useCallback(async () => {
    if (!isAuthenticated) {
      setVitalStats(DEFAULT_VITAL_STATS);
      return;
    }
    try {
      const [allVitals, normalVitals, abnormalVitals] = await Promise.all([
        vitalSignService.getOverview({ floor: normalizedFloor, vitalsign_status: "all" }),
        vitalSignService.getOverview({ floor: normalizedFloor, vitalsign_status: "normal" }),
        vitalSignService.getOverview({ floor: normalizedFloor, vitalsign_status: "abnormal" }),
      ]);

      const allByDate = filterByDate(allVitals.items, selectedDate);
      const normalByDate = filterByDate(normalVitals.items, selectedDate);
      const abnormalByDate = filterByDate(abnormalVitals.items, selectedDate);
      const warningCount = Math.max(0, allByDate.length - normalByDate.length - abnormalByDate.length);

      setVitalStats([
        { label: "ปกติ", value: normalByDate.length, variant: "normal" },
        { label: "เสี่ยงสูง", value: warningCount, variant: "warning" },
        { label: "ผิดปกติ", value: abnormalByDate.length, variant: "danger" },
      ]);
    } catch (error) {
      logApiError("Failed to fetch vital sign stats:", error);
      setVitalStats(DEFAULT_VITAL_STATS);
    }
  }, [normalizedFloor, selectedDate]);

  const loadMedicineStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setMedicineStatus(DEFAULT_MEDICINE_STATUS);
      return;
    }
    try {
      const plans = await drugPlanService.getOverview();
      const filteredByDate = filterByDate(plans, selectedDate);
      const filteredByFloor = normalizedFloor === undefined
        ? filteredByDate
        : filteredByDate.filter((plan: DrugPlan) => {
            const residentId = plan.PersonalDrug?.resident_id;
            const resident = residentId ? residentById.get(String(residentId)) : undefined;
            return resident?.floor === normalizedFloor;
          });

      const counts = {
        morning: { total: 0, taken: 0 },
        noon: { total: 0, taken: 0 },
        evening: { total: 0, taken: 0 },
      };

      filteredByFloor.forEach((plan) => {
        const timeOfDay = plan.PersonalDrug?.time_of_day || plan.PersonalDrug?.timing || "";
        const key = resolveTimeOfDayKey(timeOfDay);
        if (!key) return;
        counts[key].total += 1;
        if (plan.is_taken) counts[key].taken += 1;
      });

      setMedicineStatus([
        { label: "มื้อเช้า", value: buildMedicineValue(counts.morning.total, counts.morning.taken) },
        { label: "มื้อกลางวัน", value: buildMedicineValue(counts.noon.total, counts.noon.taken) },
        { label: "มื้อเย็น", value: buildMedicineValue(counts.evening.total, counts.evening.taken) },
      ]);
    } catch (error) {
      logApiError("Failed to fetch medicine status:", error);
      setMedicineStatus(DEFAULT_MEDICINE_STATUS);
    }
  }, [selectedDate, normalizedFloor, residentById]);

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
    inventoryCards,
    refreshResidents,
  };
}
