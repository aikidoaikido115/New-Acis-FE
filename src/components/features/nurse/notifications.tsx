"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Activity, AlertCircle, Calendar, ShoppingCart, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/use-click-outside";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Types
export type NotificationIconType = "vital" | "user" | "calendar" | "shopping";

export interface Notification {
  id: string;
  title: string;
  icon: NotificationIconType;
  timeAgo: string;
}

// Constants
const NOTIFICATION_ICON_MAP: Record<NotificationIconType, LucideIcon> = {
  vital: Activity,
  user: AlertCircle,
  calendar: Calendar,
  shopping: ShoppingCart,
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", title: "รายการ vital signs ผิดปกติ", icon: "vital", timeAgo: "2 นาทีที่แล้ว" },
  { id: "2", title: "ผู้สูงอายุไม่ได้กินยา 2 คน", icon: "user", timeAgo: "34 นาทีที่แล้ว" },
  { id: "3", title: "กิจกรรมการกายภาพ 9:00 น", icon: "calendar", timeAgo: "1 ชั่วโมงแล้ว" },
  { id: "4", title: "ผ้าอ้อมคงเหลือ 2 รายการ", icon: "shopping", timeAgo: "2 ชั่วโมงแล้ว" },
];

// Sub-Components
function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = NOTIFICATION_ICON_MAP[notification.icon];

  return (
    <div className="flex gap-3 rounded-lg border border-gray-200 p-5 hover:bg-gray-50 transition cursor-pointer">
      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white">
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
  notifications: Notification[];
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
    <div className="absolute mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-86 sm:max-w-none max-h-96 overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl left-1/2 -translate-x-[71%] sm:left-auto sm:translate-x-0 sm:right-0">
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

// Main Component
interface NotificationBellProps {
  notificationsCount?: number;
  viewAllPath?: string;
}

export function NotificationBell({
  notificationsCount = 0,
  viewAllPath = "/notification-nurse",
}: NotificationBellProps) {
  const router = useRouter();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs
  const bellRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside([bellRef, dropdownRef], () => setIsOpen(false));

  // Handlers
  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    router.push(viewAllPath);
  }, [router, viewAllPath]);

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    // TODO: Replace with actual API call
    setTimeout(() => {
      const moreNotifications: Notification[] = [
        { id: `${notifications.length + 1}`, title: "แจ้งเตือนเก่าที่ 1", icon: "vital", timeAgo: "3 ชั่วโมงแล้ว" },
        { id: `${notifications.length + 2}`, title: "แจ้งเตือนเก่าที่ 2", icon: "user", timeAgo: "4 ชั่วโมงแล้ว" },
      ];
      setNotifications((prev) => [...prev, ...moreNotifications]);
      setIsLoadingMore(false);
    }, 500);
  }, [notifications.length]);

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
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
        {notificationsCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400 px-1 text-[10px] font-semibold text-white">
            {notificationsCount > 9 ? "9+" : notificationsCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div ref={dropdownRef}>
          <NotificationDropdown
            notifications={notifications}
            isLoading={isLoadingMore}
            onViewAll={handleViewAll}
            onLoadMore={handleLoadMore}
          />
        </div>
      )}
    </div>
  );
}
