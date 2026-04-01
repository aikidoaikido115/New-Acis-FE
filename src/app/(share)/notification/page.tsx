"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { NURSE_NOTIFICATIONS } from "@/components/features/nurse/notifications";
import { KITCHEN_NOTIFICATIONS } from "@/components/features/kitchen/notificetions";
import { NOTIFICATION_ICON_MAP, type NotificationItemData } from "@/components/shared/notifications/notification-types";

function isKitchenRole(role?: string): boolean {
  if (!role) return false;
  const lowerRole = role.toLowerCase();
  return lowerRole.includes("kitchen") || lowerRole.includes("ครัว") || lowerRole.includes("โภชนา");
}

function NotificationCard({ notification }: { notification: NotificationItemData }) {
  const Icon = NOTIFICATION_ICON_MAP[notification.icon];

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white transition hover:bg-gray-100">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-800">{notification.title}</div>
        {notification.detail && (
          <div className="text-sm text-gray-500">{notification.detail}</div>
        )}
        <div className="text-xs text-blue-500 mt-1">{notification.timeAgo}</div>
      </div>
    </div>
  );
}

export default function NotificationPage() {
  const { user } = useAuth();
  const roleName = user?.role_name;
  const kitchenRole = isKitchenRole(roleName);
  const notifications = kitchenRole ? KITCHEN_NOTIFICATIONS : NURSE_NOTIFICATIONS;

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center pt-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">การแจ้งเตือนทั้งหมด</h1>
        <div className="space-y-5">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      </div>
    </div>
  );
}