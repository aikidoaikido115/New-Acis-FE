"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	BookOpen,
	Calendar,
	ClipboardList,
	HelpCircle,
	LayoutGrid,
	Pill,
	ShoppingBag,
	Users,
} from "lucide-react";

type SidebarItem = {
	label: string;
	href: string;
	icon: React.ReactNode;
};

type AppSidebarProps = {
	isOpen?: boolean;
	onClose?: () => void;
};

const mainItems: SidebarItem[] = [
	{
		label: "แดชบอร์ด",
		href: "/dashboard-nurse",
		icon: <LayoutGrid size={20} />,
	},
	{
		label: "แฟ้มข้อมูลผู้สูงอายุ",
		href: "/elder-info-nurse",
		icon: <Users size={20} />,
	},
	{
		label: "เวชระเบียน",
		href: "/emr",
		icon: <ClipboardList size={20} />,
	},
	{
		label: "จัดการยา",
		href: "/medicine",
		icon: <Pill size={20} />,
	},
	{
		label: "ตารางกิจกรรม",
		href: "/activity",
		icon: <Calendar size={20} />,
	},
	{
		label: "สินค้าคงคลัง",
		href: "/warehouse",
		icon: <ShoppingBag size={20} />,
	},
];

const supportItems: SidebarItem[] = [
	{
		label: "คู่มือการใช้งาน",
		href: "/user-manual",
		icon: <BookOpen size={20} />,
	},
	{
		label: "แจ้งปัญหาการใช้งาน",
		href: "/support-service",
		icon: <HelpCircle size={20} />,
	},
];

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
	const pathname = usePathname();

	return (
		<>
			{isOpen && onClose && (
				<button
					type="button"
					className="fixed inset-0 bg-black/30 z-40 lg:hidden"
					onClick={onClose}
					aria-label="Close sidebar"
				/>
			)}

			<aside
				className={`fixed left-0 top-0 z-40 h-full w-72 bg-linear-to-b from-[#0B84EA] to-[#4AA3F5] px-4 py-6 text-white transition-transform duration-300 lg:translate-x-0 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center gap-3 px-2 pb-6">
					<div className="relative h-10 w-10 shrink-0">
						<Image
							src="/images/logo.png"
							alt="Elder Nursing Logo"
							fill
							className="object-contain"
							priority
						/>
					</div>
					<div>
						<p className="text-base font-semibold">Elder Nursing</p>
						<p className="text-xs text-white/80">ระบบสำหรับเจ้าหน้าที่</p>
					</div>
				</div>

				<nav className="space-y-2">
					{mainItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
									isActive
										? "bg-white/20 text-white"
										: "text-white/90 hover:bg-white/10"
								}`}
							>
								{item.icon}
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className="my-6 h-px bg-white/30" />

				<nav className="space-y-2">
					{supportItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
									isActive
										? "bg-white/20 text-white"
										: "text-white/90 hover:bg-white/10"
								}`}
							>
								{item.icon}
								{item.label}
							</Link>
						);
					})}
				</nav>
			</aside>
		</>
	);
}
