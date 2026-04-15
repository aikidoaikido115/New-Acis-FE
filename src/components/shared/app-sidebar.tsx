"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
	BookOpen,
	Calendar,
	ClipboardList,
  FileText,
	HelpCircle,
	LayoutGrid,
	PanelLeftClose,
	PanelLeftOpen,
	Pill,
	ShoppingBag,
	Users,
	UtensilsCrossed,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type UserRole = "nurse" | "kitchen";

interface SidebarItem {
	label: string;
	href: string;
	icon: LucideIcon;
}

interface AppSidebarProps {
	role?: UserRole;
	isOpen?: boolean;
	isCollapsed?: boolean;
	isReady?: boolean;
	onClose?: () => void;
	onCollapsedChange?: (collapsed: boolean) => void;
}

// Sidebar width constants (exported for use in pages)
export const SIDEBAR_WIDTH = 288; // 72 * 4 = 288px (w-72)
export const SIDEBAR_COLLAPSED_WIDTH = 64; // 16 * 4 = 64px (w-16)

// Menu items per role
const MENU_ITEMS: Record<UserRole, { main: SidebarItem[]; support: SidebarItem[] }> = {
  nurse: {
    main: [
      { label: "แดชบอร์ด", href: "/dashboard", icon: LayoutGrid },
      { label: "แฟ้มข้อมูลผู้สูงอายุ", href: "/elder-info", icon: Users },
      { label: "เวชระเบียน", href: "/emr", icon: ClipboardList },
      { label: "จัดการยา", href: "/medicine", icon: Pill },
      { label: "ตารางกิจกรรม", href: "/activity", icon: Calendar },
      { label: "สินค้าคงคลัง", href: "/warehouse", icon: ShoppingBag },
    ],
    support: [
      { label: "คู่มือการใช้งาน", href: "/user-manual", icon: BookOpen },
      { label: "แจ้งปัญหาการใช้งาน", href: "/support-service", icon: HelpCircle },
      { label: "จัดการ Ticket", href: "/support-tickets", icon: FileText },
    ],
  },
  kitchen: {
    main: [{ label: "จัดการมื้ออาหาร", href: "/manage-meal", icon: UtensilsCrossed }],
    support: [
      { label: "คู่มือการใช้งาน", href: "/user-manual-kitchen", icon: BookOpen },
      { label: "แจ้งปัญหาการใช้งาน", href: "/support-service-kitchen", icon: HelpCircle },
    ],
  },
};

// Sub-components
function SidebarHeader({ isCollapsed, onCollapsedChange }: { isCollapsed: boolean; onCollapsedChange?: (collapsed: boolean) => void }) {
  if (!onCollapsedChange) return null;

  return (
    <div className={cn("flex pb-4", isCollapsed ? "justify-center" : "justify-end")}> 
      <button
        type="button"
        onClick={() => onCollapsedChange(!isCollapsed)}
        className="hidden lg:flex items-center justify-center text-[#E6E6E6] transition hover:text-white"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>
    </div>
  );
}

function SidebarNavItem({

  item,
  isActive,
  isCollapsed,
}: {
	item: SidebarItem;
	isActive: boolean;
	isCollapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors",
        isActive ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/10",
        isCollapsed ? "justify-center px-2" : "gap-3 px-3"
      )}
    >
      <Icon size={20} className="shrink-0" />
      {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
    </Link>
  );
}

function SidebarNav({
	items,
	pathname,
	isCollapsed,
}: {
	items: SidebarItem[];
	pathname: string;
	isCollapsed: boolean;
}) {
	return (
		<nav className="space-y-1">
			{items.map((item) => (
				<SidebarNavItem
					key={item.href}
					item={item}
					isActive={pathname === item.href}
					isCollapsed={isCollapsed}
				/>
			))}
		</nav>
	);
}

// Main component
export function AppSidebar({ 
  role = "nurse", 
  isOpen = true, 
  isCollapsed = false,
  isReady = true,
  onClose,
  onCollapsedChange,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  const { main: mainItems, support: supportItems } = MENU_ITEMS[role];
  const sidebarWidth = isCollapsed ? "w-16" : "w-72";

  return (
    <>
      {isOpen && onClose && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100%-4rem)] overflow-hidden bg-linear-to-b from-[#0093EF] to-[#85C7F0] px-3 py-6 text-white",
          isReady && "transition-all duration-300",
          sidebarWidth,
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <SidebarHeader isCollapsed={isCollapsed} onCollapsedChange={onCollapsedChange} />

        <SidebarNav items={mainItems} pathname={currentPath} isCollapsed={isCollapsed} />

        <div className={cn("my-6 h-px bg-white/30", isCollapsed && "mx-2")} />

        <SidebarNav items={supportItems} pathname={currentPath} isCollapsed={isCollapsed} />
      </aside>
    </>
  );
}
