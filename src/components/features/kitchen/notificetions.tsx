"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/use-click-outside";
import {
  NOTIFICATION_ICON_MAP,
  type NotificationIconType,
  type NotificationItemData,
} from "@/components/shared/notifications/notification-types";

const STORAGE_KEY = "kitchen-notifications.v1";

type KitchenNotificationSchedule = {
  id: string;
  title: string;
  icon: NotificationIconType;
  notifyHour: number;
  notifyMinute: number;
};

type KitchenNotification = {
  id: string;
  title: string;
  icon: NotificationIconType;
  scheduledAt: string;
  read: boolean;
  dateKey: string;
};

const KITCHEN_NOTIFICATION_SCHEDULES: KitchenNotificationSchedule[] = [
  {
    id: "breakfast",
    title: "เตรียมอาหารเช้า",
    icon: "calendar",
    notifyHour: 6,
    notifyMinute: 30,
  },
  {
    id: "lunch",
    title: "เตรียมอาหารกลางวัน",
    icon: "calendar",
    notifyHour: 11,
    notifyMinute: 30,
  },
  {
    id: "dinner",
    title: "เตรียมอาหารเย็น",
    icon: "calendar",
    notifyHour: 17,
    notifyMinute: 10,
  },
];

const pad2 = (value: number) => String(value).padStart(2, "0");

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const buildNotifyDate = (baseDate: Date, hour: number, minute: number) => {
  const notifyDate = new Date(baseDate);
  notifyDate.setHours(hour, minute, 0, 0);
  return notifyDate;
};

const formatRelativeTime = (target: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - target.getTime();

  if (diffMs < 0) {
    const diffMinutes = Math.ceil(Math.abs(diffMs) / (1000 * 60));
    if (diffMinutes < 60) return `อีก ${diffMinutes} นาที`;
    const diffHours = Math.ceil(diffMinutes / 60);
    return `อีก ${diffHours} ชั่วโมง`;
  }

  if (diffMs < 60 * 1000) return "เมื่อสักครู่";
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  return target.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};

const readStoredNotifications = () => {
  if (typeof window === "undefined") return [] as KitchenNotification[];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [] as KitchenNotification[];
    const parsed = JSON.parse(raw) as KitchenNotification[];
    return Array.isArray(parsed) ? parsed : ([] as KitchenNotification[]);
  } catch {
    return [] as KitchenNotification[];
  }
};

const writeStoredNotifications = (notifications: KitchenNotification[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

const buildKitchenNotifications = (now: Date, stored: KitchenNotification[]) => {
  const dateKey = getDateKey(now);
  const todaysNotifications = stored.filter((item) => item.dateKey === dateKey);
  const existingIds = new Set(todaysNotifications.map((item) => item.id));

  // Always recalculate all notifications for today, mark as read if already in storage
  const allToday: KitchenNotification[] = KITCHEN_NOTIFICATION_SCHEDULES.map((schedule) => {
    const notifyAt = buildNotifyDate(now, schedule.notifyHour, schedule.notifyMinute);
    const id = `${dateKey}-${schedule.id}`;
    const storedItem = todaysNotifications.find((item) => item.id === id);
    return {
      id,
      title: schedule.title,
      icon: schedule.icon,
      scheduledAt: notifyAt.toISOString(),
      read: storedItem?.read ?? false,
      dateKey,
    };
  }).filter((n) => now >= new Date(n.scheduledAt));

  return allToday.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
};

const getKitchenNotifications = () => {
  if (typeof window === "undefined") return [] as KitchenNotification[];
  const now = new Date();
  const stored = readStoredNotifications();
  const nextNotifications = buildKitchenNotifications(now, stored);
  writeStoredNotifications(nextNotifications);
  return nextNotifications;
};

export const getKitchenNotificationItems = (): NotificationItemData[] => {
  const nextNotifications = getKitchenNotifications();
  return nextNotifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    icon: notification.icon,
    timeAgo: formatRelativeTime(new Date(notification.scheduledAt)),
  }));
};

export const markAllKitchenNotificationsRead = () => {
  if (typeof window === "undefined") return;
  const now = new Date();
  const stored = readStoredNotifications();
  const nextNotifications = buildKitchenNotifications(now, stored).map((notification) => ({
    ...notification,
    read: true,
  }));
  writeStoredNotifications(nextNotifications);
};

// Single NotificationItem component
function NotificationItem({ notification }: { notification: KitchenNotification }) {
  const Icon = NOTIFICATION_ICON_MAP[notification.icon];
  const timeAgo = formatRelativeTime(new Date(notification.scheduledAt));

  return (
    <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-5 transition cursor-pointer hover:bg-gray-100">
      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {notification.title}
        </p>
        <p className="text-xs text-primary-600 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

function NotificationDropdown({
  notifications,
  onViewAll,
  showViewAllButton = false,
}: {
  notifications: KitchenNotification[];
  onViewAll?: () => void;
  showViewAllButton?: boolean;
}) {
  return (
    <div className="absolute mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-86 sm:max-w-none max-h-96 overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl left-1/2 -translate-x-[71%] sm:left-auto sm:translate-x-0 sm:right-0">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">การแจ้งเตือน</h3>
        {showViewAllButton && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-500 hover:text-blue-800 transition"
          >
            ดูทั้งหมด
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 p-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">ไม่มีการแจ้งเตือน</div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </div>
    </div>
  );
}



interface KitchenNotificationBellProps {
  viewAllPath?: string;
  showViewAllButton?: boolean;
}

export function KitchenNotificationBell({
  viewAllPath = "/notification",
  showViewAllButton = true,
}: KitchenNotificationBellProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<KitchenNotification[]>([]);

  const bellRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(() => setIsOpen(false), bellRef, dropdownRef);


  // Move syncNotifications out of useCallback to avoid dependency confusion
  function syncNotifications() {
    const nextNotifications = getKitchenNotifications();
    setNotifications(nextNotifications);
  }

  // Prevent infinite loop: only update if there are unread notifications
  function markAllRead() {
    if (notifications.length === 0) return;
    if (notifications.every((n) => n.read)) return;
    const updated = notifications.map((notification) =>
      notification.read ? notification : { ...notification, read: true }
    );
    writeStoredNotifications(updated);
    setNotifications(updated);
  }

  useEffect(() => {
    syncNotifications();
    const intervalId = window.setInterval(syncNotifications, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isOpen) {
      markAllRead();
    }
  }, [isOpen, markAllRead]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const badgeCount = unreadCount;

  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    router.push(viewAllPath);
  }, [router, viewAllPath]);

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/20",
          isOpen && "bg-white/10"
        )}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400 px-1 text-[10px] font-semibold text-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={dropdownRef}>
          <NotificationDropdown
            notifications={notifications}
            onViewAll={handleViewAll}
            showViewAllButton={showViewAllButton}
          />
        </div>
      )}
    </div>
  );
}