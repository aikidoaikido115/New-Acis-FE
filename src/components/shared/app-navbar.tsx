"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, User, Activity, AlertCircle, Calendar, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

type NavbarUser = {
	name: string;
	role?: string;
	avatarUrl?: string;
};

type Notification = {
	id: string;
	title: string;
	icon: "vital" | "user" | "calendar" | "shopping";
	timeAgo: string;
};

type AppNavbarProps = {
	user: NavbarUser;
	notificationsCount?: number;
	onToggleSidebar?: () => void;
	onEditProfile?: () => void;
	onLogout?: () => void;
};

// Mock notification data
const MOCK_NOTIFICATIONS: Notification[] = [
	{
		id: "1",
		title: "รายการ vital signs ผิดปกติ",
		icon: "vital",
		timeAgo: "2 นาทีที่แล้ว",
	},
	{
		id: "2",
		title: "ผู้สูงอายุไม่ได้กินยา 2 คน",
		icon: "user",
		timeAgo: "34 นาทีที่แล้ว",
	},
	{
		id: "3",
		title: "กิจกรรมการกายภาพ 9:00 น",
		icon: "calendar",
		timeAgo: "1 ชั่วโมงแล้ว",
	},
	{
		id: "4",
		title: "ผ้าอ้อมคงเหลือ 2 รายการ",
		icon: "shopping",
		timeAgo: "2 ชั่วโมงแล้ว",
	},
];

const NOTIFICATION_ICON_MAP = {
	vital: Activity,
	user: AlertCircle,
	calendar: Calendar,
	shopping: ShoppingCart,
};

export function AppNavbar({
	user,
	notificationsCount = 0,
	onToggleSidebar,
	onEditProfile,
	onLogout,
}: AppNavbarProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isNotificationOpen, setIsNotificationOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const notificationRef = useRef<HTMLDivElement | null>(null);
	const notificationDropdownRef = useRef<HTMLDivElement | null>(null);
	const router = useRouter();

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
			if (
				notificationRef.current &&
				!notificationRef.current.contains(event.target as Node) &&
				notificationDropdownRef.current &&
				!notificationDropdownRef.current.contains(event.target as Node)
			) {
				setIsNotificationOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const initials = user.name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

	const handleLoadPrevious = async () => {
		setIsLoadingMore(true);
		// Simulate loading more notifications
		setTimeout(() => {
			const moreNotifications: Notification[] = [
				{
					id: `${notifications.length + 1}`,
					title: "แจ้งเตือนเก่าที่ 1",
					icon: "vital",
					timeAgo: "3 ชั่วโมงแล้ว",
				},
				{
					id: `${notifications.length + 2}`,
					title: "แจ้งเตือนเก่าที่ 2",
					icon: "user",
					timeAgo: "4 ชั่วโมงแล้ว",
				},
			];
			setNotifications((prev) => [...prev, ...moreNotifications]);
			setIsLoadingMore(false);
		}, 500);
	};

	const handleViewAll = () => {
		setIsNotificationOpen(false);
		router.push("/notification-nurse");
	};

	const getNotificationIcon = (type: Notification["icon"]) => {
		const Icon = NOTIFICATION_ICON_MAP[type];
		return <Icon className="w-6 h-6" />;
	};

	return (
		<header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#0B84EA] text-white shadow-sm">
			<div className="mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onToggleSidebar}
						className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
						aria-label="Toggle sidebar"
					>
						<Menu size={20} />
					</button>

					<Link
						href="/dashboard-nurse"
						onClick={(event) => {
							event.preventDefault();
							router.push("/dashboard-nurse");
						}}
						className="flex items-center gap-2"
						aria-label="Go to dashboard"
					>
						<div className="relative h-9 w-9 shrink-0">
							<Image
								src="/logo.png"
								alt="Elder Nursing Logo"
								fill
								className="object-contain"
								priority
							/>
						</div>
						<span className="hidden text-sm font-semibold sm:inline">Elder Nursing</span>
					</Link>
				</div>

				<div className="flex items-center gap-5">
					<div className="relative" ref={notificationRef}>
						<button
							type="button"
							onClick={() => setIsNotificationOpen((prev) => !prev)}
							className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
							aria-label="Notifications"
						>
							<Bell size={18} />
							{notificationsCount > 0 && (
								<span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-400 px-1 text-[10px] font-semibold text-white">
									{notificationsCount > 9 ? "9+" : notificationsCount}
								</span>
							)}
						</button>

						{isNotificationOpen && (
							<div
								ref={notificationDropdownRef}
								className="absolute mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-86 sm:max-w-none max-h-96 overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl left-1/2 -translate-x-[71%] sm:left-auto sm:-translate-x-0 sm:right-0"
							>
								<div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
									<h3 className="text-sm font-bold text-gray-900">การแจ้งเตือน</h3>
									<button
										onClick={handleViewAll}
										className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
									>
										ดูทั้งหมด
									</button>
								</div>

								<div className="max-h-64 overflow-y-auto space-y-2 p-3">
									{notifications.map((notification) => (
										<div
											key={notification.id}
											className="flex gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition cursor-pointer"
										>
											<div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white">
												{getNotificationIcon(notification.icon)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-gray-900 truncate">
													{notification.title}
												</p>
												<p className="text-xs text-blue-600 mt-1">
													{notification.timeAgo}
												</p>
											</div>
										</div>
									))}

									{isLoadingMore && (
										<div className="flex justify-center py-2">
											<div className="animate-spin">
												<div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
											</div>
										</div>
									)}
								</div>

								<div className="border-t border-gray-200 px-3 py-2">
									<button
										onClick={handleLoadPrevious}
										disabled={isLoadingMore}
										className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium disabled:opacity-50"
									>
										{isLoadingMore ? "กำลังโหลด..." : "ดูการแจ้งเตือนก่อนหน้านี้"}
									</button>
								</div>
							</div>
						)}
					</div>

					<div className="relative" ref={menuRef}>
						<button
							type="button"
							onClick={() => setIsMenuOpen((prev) => !prev)}
							className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1.5 text-left transition hover:bg-white/20"
						>
							{user.avatarUrl ? (
								<div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/40">
									<Image
										src={user.avatarUrl}
										alt={user.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
									{initials || <User size={14} />}
								</div>
							)}
							<div className="hidden flex-col sm:flex">
								<span className="text-sm font-semibold leading-tight">{user.name}</span>
								{user.role && (
									<span className="text-xs text-white/80">{user.role}</span>
								)}
							</div>
							<ChevronDown size={16} className="text-white/80" />
						</button>

						{isMenuOpen && (
							<div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl bg-white text-gray-700 shadow-lg">
								<Link
									href="/profile-nurse"
									className="flex w-full items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50"
								>
									<User size={16} />
									แก้ไขโปรไฟล์
								</Link>
								<Link
									href="/login"
									className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
								>
									<LogOut size={16} />
									ออกจากระบบ
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
