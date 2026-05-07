import { Activity, AlertCircle, Calendar, ShoppingCart, type LucideIcon } from "lucide-react";

export type NotificationIconType = "vital" | "user" | "calendar" | "shopping";

export interface NotificationItemData {
  id: string;
  title: string;
  icon: NotificationIconType;
  timeAgo: string;
  detail?: string;
}

export const NOTIFICATION_ICON_MAP: Record<NotificationIconType, LucideIcon> = {
  vital: Activity,
  user: AlertCircle,
  calendar: Calendar,
  shopping: ShoppingCart,
};
