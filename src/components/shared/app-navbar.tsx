"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, User } from "lucide-react";

type NavbarUser = {
	name: string;
	role?: string;
	avatarUrl?: string;
};

type AppNavbarProps = {
	user: NavbarUser;
	notificationsCount?: number;
	onToggleSidebar?: () => void;
	onEditProfile?: () => void;
	onLogout?: () => void;
};

export function AppNavbar({
	user,
	notificationsCount = 0,
	onToggleSidebar,
	onEditProfile,
	onLogout,
}: AppNavbarProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
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

	return (
		<header className="w-full bg-[#0B84EA] text-white shadow-sm">
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

					<div className="flex items-center gap-2">
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
					</div>
				</div>

				<div className="flex items-center gap-5">
					<button
						type="button"
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
