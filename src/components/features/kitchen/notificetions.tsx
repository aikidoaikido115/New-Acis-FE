"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/use-click-outside";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NOTIFICATION_ICON_MAP, type NotificationItemData } from "@/components/shared/notifications/notification-types";

// Static notification data for kitchen staff
export const KITCHEN_NOTIFICATIONS: NotificationItemData[] = [
  {
    id: "k1",
    title: "กรุณากำหนดเมนูอาหารเช้า ภายใน 06:00 น.",
    icon: "calendar",
    timeAgo: "อีก 60 นาที",
  },
  {
    id: "k2",
    title: "กรุณากำหนดเมนูอาหารกลางวัน ภายใน 12:00 น.",
    icon: "calendar",
    timeAgo: "อีก 120 นาที",
  },
  {
    id: "k3",
    title: "กรุณากำหนดเมนูอาหารเย็น ภายใน 17:00 น.",
    icon: "calendar",
    timeAgo: "อีก 60 นาที",
  },
];

// Single NotificationItem component
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
    <div className="absolute mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-86 sm:max-w-none max-h-96 overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl left-1/2 -translate-x-[71%] sm:left-auto sm:translate-x-0 sm:right-0">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">การแจ้งเตือน</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-500 hover:text-blue-800 transition"
        >
          ดูทั้งหมด
        </button>
      </div>

      <div ref={scrollContainerRef} className="max-h-72 overflow-y-auto space-y-2 p-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">ไม่มีการแจ้งเตือน</div>
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

interface KitchenNotificationBellProps {
  notificationsCount?: number;
  viewAllPath?: string;
}

export function KitchenNotificationBell({
  notificationsCount = 0,
  viewAllPath = "/notification",
}: KitchenNotificationBellProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItemData[]>(KITCHEN_NOTIFICATIONS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(() => setIsOpen(false), bellRef, dropdownRef);

  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    router.push(viewAllPath);
  }, [router, viewAllPath]);

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    // Simulate loading more notifications
    setTimeout(() => {
      const moreNotifications: NotificationItemData[] = [
        {
          id: `${notifications.length + 1}`,
          title: "กำหนดเมนูอาหารเพิ่มเติมสำหรับวันถัดไป",
          icon: "shopping",
          timeAgo: "เมื่อสักครู่",
        },
      ];
      setNotifications((prev) => [...prev, ...moreNotifications]);
      setIsLoadingMore(false);
    }, 500);
  }, [notifications.length]);

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
        {notificationsCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400 px-1 text-[10px] font-semibold text-white">
            {notificationsCount > 9 ? "9+" : notificationsCount}
          </span>
        )}
      </button>

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