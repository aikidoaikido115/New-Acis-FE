"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NOTIFICATION_ICON_MAP, type NotificationItemData } from "@/components/shared/notifications/notification-types";
import { vitalSignService } from "@/services/vital-sign.service";
import { drugPlanService } from "@/services/drug-plan.service";
import { activityScheduleService } from "@/services/activity-schedule.service";
import { warehouseService } from "@/services/warehouse.service";

// Types
export const NURSE_NOTIFICATIONS: NotificationItemData[] = [];

type MedicationSchedule = {
  key: "morning" | "noon" | "evening" | "bedtime";
  label: string;
  hour: number;
  minute: number;
};

const MEDICATION_SCHEDULES: MedicationSchedule[] = [
  { key: "morning", label: "เช้า", hour: 7, minute: 0 },
  { key: "noon", label: "กลางวัน", hour: 12, minute: 0 },
  { key: "evening", label: "เย็น", hour: 18, minute: 0 },
  { key: "bedtime", label: "ก่อนนอน", hour: 22, minute: 0 },
];

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildScheduleDate = (date: Date, hour: number, minute: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);

const formatTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatMinutesAgo = (minutes: number) => {
  if (minutes <= 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} อาทิตย์ที่แล้ว`;
  const months = Math.floor(days / 30);
  return `${Math.max(months, 1)} เดือนที่แล้ว`;
};

const formatMinutesUntil = (minutes: number) => {
  if (minutes <= 1) return "ใกล้เริ่มแล้ว";
  if (minutes < 60) return `อีก ${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  return `อีก ${hours} ชั่วโมง`;
};

const formatOverdue = (now: Date, scheduledAt: Date) => {
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - scheduledAt.getTime()) / 60000));
  return formatMinutesAgo(diffMinutes);
};

const logNotificationError = (_label: string, _error: unknown) => {};

// Sub-Components
function NotificationItem({ notification }: { notification: NotificationItemData }) {
  const Icon = NOTIFICATION_ICON_MAP[notification.icon];

  return (
    <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-5 transition cursor-pointer hover:bg-gray-100">
      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {notification.title}
        </p>
        <p className="text-xs text-primary-600 mt-1">{notification.timeAgo}</p>
      </div>
    </div>
  );
}

function NotificationDropdown({
  notifications,
  isLoading,
  onViewAll,
  onLoadMore,
}: {
  notifications: NotificationItemData[];
  isLoading: boolean;
  onViewAll: () => void;
  onLoadMore: () => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 20 && !isLoading) {
        onLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isLoading, onLoadMore]);

  return (
    <div className="absolute mt-2 left-1/2 -translate-x-1/2 w-[95vw] max-w-xs sm:left-auto sm:translate-x-0 sm:right-0 sm:w-86 sm:max-w-none max-h-96 overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">การแจ้งเตือน</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-500 hover:text-blue-800 transition"
        >
          ดูทั้งหมด
        </button>
      </div>

      {/* Notification List */}
      <div
        ref={scrollContainerRef}
        className="max-h-72 overflow-y-auto space-y-2 p-3"
      >
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            ไม่มีการแจ้งเตือน
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
}

type BuiltNotification = NotificationItemData & { sortAt: number };

const buildNurseNotifications = async (now: Date): Promise<NotificationItemData[]> => {
  const dateKey = toDateKey(now);
  const notifications: BuiltNotification[] = [];

  try {
    const vitalOverview = await vitalSignService.getOverview({ vitalsign_status: "abnormal" });
    const uniqueResidents = new Set(
      (vitalOverview.items || [])
        .map((item) => item.resident_id)
        .filter((residentId): residentId is string => Boolean(residentId))
    );
    const vitalCount = uniqueResidents.size || vitalOverview.items.length;
    if (vitalCount > 0) {
      notifications.push({
        id: `vital-${dateKey}`,
        title: `รายการ vital signs ต้องติดตาม ${vitalCount} คน`,
        icon: "vital",
        timeAgo: "เมื่อสักครู่",
        sortAt: now.getTime(),
      });
    }
  } catch (error) {
    logNotificationError("Failed to load vital sign notifications", error);
  }

  const dueSchedules = MEDICATION_SCHEDULES.filter((schedule) => now >= buildScheduleDate(now, schedule.hour, schedule.minute));
  await Promise.all(
    dueSchedules.map(async (schedule) => {
      try {
        const history = await drugPlanService.getAdministrationHistory({
          date: dateKey,
          time_of_day: schedule.key,
          status: "pending",
        });
        const count = history.items.length;
        if (count > 0) {
          const scheduledAt = buildScheduleDate(now, schedule.hour, schedule.minute);
          notifications.push({
            id: `medicine-${dateKey}-${schedule.key}`,
            title: `ให้ยามื้อ${schedule.label} ${count} คน`,
            icon: "user",
            timeAgo: formatOverdue(now, scheduledAt),
            sortAt: scheduledAt.getTime(),
          });
        }
      } catch (error) {
        logNotificationError(`Failed to load medicine notifications (${schedule.key})`, error);
      }
    })
  );

  try {
    const schedules = await activityScheduleService.getByDate(dateKey);
    schedules.forEach((schedule) => {
      if (!schedule.start_time) return;
      const startAt = new Date(schedule.start_time);
      if (Number.isNaN(startAt.getTime())) return;
      const diffMinutes = Math.floor((startAt.getTime() - now.getTime()) / 60000);
      if (diffMinutes < 0 || diffMinutes > 15) return;
      const activityName = schedule.activity?.activity_name || "กิจกรรม";
      const timeLabel = formatTime(startAt);
      notifications.push({
        id: `activity-${schedule.as_id}`,
        title: `${activityName} ${timeLabel} น`,
        icon: "calendar",
        timeAgo: formatMinutesUntil(diffMinutes),
        sortAt: startAt.getTime(),
      });
    });
  } catch (error) {
    logNotificationError("Failed to load activity notifications", error);
  }

  try {
    const items = await warehouseService.getItems();
    const lowStockCount = items.filter((item) => {
      const minimum = item.minimumQuantity ?? 0;
      return minimum > 0 && item.quantity <= minimum;
    }).length;
    if (lowStockCount > 0) {
      notifications.push({
        id: `stock-${dateKey}`,
        title: `ของใกล้หมดในคลัง ${lowStockCount} รายการ`,
        icon: "shopping",
        timeAgo: "เมื่อสักครู่",
        sortAt: now.getTime() - 1,
      });
    }
  } catch (error) {
    logNotificationError("Failed to load warehouse notifications", error);
  }

  return notifications
    .sort((a, b) => b.sortAt - a.sortAt)
    .map(({ sortAt, ...notification }) => notification);
};

export function useNurseNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      const items = await buildNurseNotifications(new Date());
      setNotifications(items);
    } catch (error) {
      logNotificationError("Failed to build nurse notifications", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      return;
    }
    let isActive = true;
    const runRefresh = async () => {
      if (!isActive) return;
      await refresh();
    };
    runRefresh();
    const intervalId = window.setInterval(runRefresh, 60 * 1000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, refresh]);

  return { notifications, isLoading, refresh };
}

// Main Component
interface NotificationBellProps {
  notificationsCount?: number;
  viewAllPath?: string;
}

export function NotificationBell({
  notificationsCount,
  viewAllPath = "/notification",
}: NotificationBellProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { notifications, isLoading, refresh } = useNurseNotifications(isAuthenticated);

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs
  const bellRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(() => setIsOpen(false), bellRef, dropdownRef);

  // Handlers
  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    router.push(viewAllPath);
  }, [router, viewAllPath]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await refresh();
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, refresh]);

  const badgeCount = typeof notificationsCount === "number" ? notificationsCount : notifications.length;

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/20 sm:h-9 sm:w-9",
          isOpen && "bg-white/10"
        )}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} className="sm:size-[18px]" />
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400 px-1 text-[10px] font-semibold text-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div ref={dropdownRef}>
          <NotificationDropdown
            notifications={notifications}
            isLoading={isLoading || isLoadingMore}
            onViewAll={handleViewAll}
            onLoadMore={handleLoadMore}
          />
        </div>
      )}
    </div>
  );
}
