"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Activity, AlertCircle, Calendar, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { AppNavbar } from "@/components/shared/app-navbar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppFooter } from "@/components/shared/app-footer";

type Notification = {
	id: string;
	title: string;
	description?: string;
	icon: "vital" | "user" | "calendar" | "shopping";
	timeAgo: string;
	isRead: boolean;
};

const NOTIFICATION_ICON_MAP = {
	vital: Activity,
	user: AlertCircle,
	calendar: Calendar,
	shopping: ShoppingCart,
};

// Mock notification data for full page
const INITIAL_NOTIFICATIONS: Notification[] = [
	{
		id: "1",
		title: "รายการ vital signs ผิดปกติ",
		description: "ผู้ป่วย โยคี่ มีอุณหภูมิ 38.5°C",
		icon: "vital",
		timeAgo: "2 นาทีที่แล้ว",
		isRead: false,
	},
	{
		id: "2",
		title: "ผู้ใช้ไม่ได้ทำข่ายแม่ 2 คน",
		description: "กิจกรรมเช้านี้ยังไม่ได้บันทึก",
		icon: "user",
		timeAgo: "34 นาทีที่แล้ว",
		isRead: false,
	},
	{
		id: "3",
		title: "กิจกรรมการปล่อยปรับระบบ 9:00 น",
		description: "เตรียมการด้านข้าง 30 นาที",
		icon: "calendar",
		timeAgo: "1 ชั่วโมงแล้ว",
		isRead: true,
	},
	{
		id: "4",
		title: "อ้ายป่งสนิทมส เหตุ 2 รายการ",
		description: "ต้องการความสนใจด้านการแพทย์",
		icon: "shopping",
		timeAgo: "2 ชั่วโมงแล้ว",
		isRead: true,
	},
	{
		id: "5",
		title: "ตารางยาอัพเดต",
		description: "เปลี่ยนแปลงเวลาการให้ยา 2 ผู้ป่วย",
		icon: "vital",
		timeAgo: "3 ชั่วโมงแล้ว",
		isRead: true,
	},
	{
		id: "6",
		title: "รายงานการบันทึกประจำวัน",
		description: "กรุณาตรวจสอบรายงานสำหรับวันนี้",
		icon: "calendar",
		timeAgo: "4 ชั่วโมงแล้ว",
		isRead: true,
	},
];

export default function NotificationNursePage() {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isAutoLoadEnabled, setIsAutoLoadEnabled] = useState(false);
	const mainRef = useRef<HTMLElement | null>(null);

	const mockUser = {
		name: "สมชาย ใจดี",
		role: "พยาบาล",
		avatarUrl: undefined,
	};

	const handleLoadMore = async () => {
		setIsLoadingMore(true);
		// Simulate loading more notifications
		setTimeout(() => {
			const newNotifications: Notification[] = [
				{
					id: `${notifications.length + 1}`,
					title: "แจ้งเตือนเก่าที่ 1",
					description: "นี่คือการแจ้งเตือนจากเมื่อก่อน",
					icon: "user",
					timeAgo: "5 ชั่วโมงแล้ว",
					isRead: true,
				},
				{
					id: `${notifications.length + 2}`,
					title: "แจ้งเตือนเก่าที่ 2",
					description: "นี่คือการแจ้งเตือนจากเมื่อก่อน",
					icon: "vital",
					timeAgo: "6 ชั่วโมงแล้ว",
					isRead: true,
				},
			];
			setNotifications((prev) => [...prev, ...newNotifications]);
			setIsLoadingMore(false);
		}, 500);
	};

	const handleEnableAutoLoad = () => {
		if (isAutoLoadEnabled) {
			return;
		}
		setIsAutoLoadEnabled(true);
		handleLoadMore();
	};

	const handleScroll = (event: React.UIEvent<HTMLElement>) => {
		if (!isAutoLoadEnabled || isLoadingMore) {
			return;
		}
		const target = event.currentTarget;
		const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
		if (remaining < 120) {
			handleLoadMore();
		}
	};

	const handleMarkAsRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
		);
	};

	const getNotificationIcon = (type: Notification["icon"]) => {
		const Icon = NOTIFICATION_ICON_MAP[type];
		return <Icon className="w-5 h-5" />;
	};

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	return (
		<div className="flex min-h-screen flex-col bg-gray-50">
			{/* Navbar */}
			<AppNavbar
				user={mockUser}
				notificationsCount={unreadCount}
				onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
			/>

			<div className="flex flex-1 pt-16">
				{/* Sidebar */}
				<AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

				{/* Main Content */}
				<main
					ref={mainRef}
					onScroll={handleScroll}
					className="flex-1 overflow-y-auto lg:ml-72"
				>
					{/* Header */}
					<div className="border-b border-gray-200 bg-white px-4 py-4 lg:px-6">
						<div className="flex items-center gap-3">
							<Link
								href="/dashboard-nurse"
								className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
								aria-label="Back"
							>
								<ArrowLeft size={20} />
							</Link>
							<div>
								<h1 className="text-xl font-bold text-gray-900">การแจ้งเตือน</h1>
								{unreadCount > 0 && (
									<p className="text-sm text-gray-600">
										มีการแจ้งเตือนที่ยังไม่ได้อ่าน {unreadCount} รายการ
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Notification List */}
					<div className="space-y-2 px-4 py-4 lg:px-6">
						{notifications.map((notification) => (
							<div
								key={notification.id}
								onClick={() => handleMarkAsRead(notification.id)}
								className={`flex gap-4 rounded-xl border p-4 transition cursor-pointer ${
									!notification.isRead
										? "border-blue-200 bg-blue-50 hover:bg-blue-100"
										: "border-gray-200 bg-white hover:bg-gray-50"
								}`}
							>
								<div
									className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${
										!notification.isRead ? "bg-blue-500" : "bg-gray-300"
									} text-white`}
								>
									{getNotificationIcon(notification.icon)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2">
										<h3
											className={`text-sm font-semibold truncate ${
												!notification.isRead ? "text-blue-900" : "text-gray-900"
											}`}
										>
											{notification.title}
										</h3>
										{!notification.isRead && (
											<span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
										)}
									</div>
									{notification.description && (
										<p className="text-sm text-gray-600 mt-1 line-clamp-2">
											{notification.description}
										</p>
									)}
									<p className="text-xs text-gray-500 mt-2">{notification.timeAgo}</p>
								</div>
							</div>
						))}

						{/* Load More Button */}
						{!isAutoLoadEnabled && (
							<div className="flex justify-center py-6">
								<button
									onClick={handleEnableAutoLoad}
									disabled={isLoadingMore}
									className="px-6 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
								>
									{isLoadingMore ? "กำลังโหลด..." : "ดูการแจ้งเตือนก่อนหน้านี้"}
								</button>
							</div>
						)}
					</div>
				</main>
			</div>

			{/* Footer */}
			<div className="lg:ml-72 mt-auto">
				<AppFooter />
			</div>
		</div>
	);
}
