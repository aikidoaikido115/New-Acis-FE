"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/use-click-outside";
import { NotificationBell } from "@/components/features/nurse/notifications";
import { authService } from "@/services/auth.service";

interface NavbarUser {
  firstName: string;
  role?: string;
}

interface AppNavbarProps {
  user: NavbarUser;
  notificationsCount?: number;
  onToggleSidebar?: () => void;
}

// Sub-Components
function NavbarLogo() {

  const router = useRouter();

  return (
    <Link
      href="/dashboard"
      onClick={(e) => {
        e.preventDefault();
        router.push("/dashboard");
      }}
      className="flex items-center gap-2"
      aria-label="Go to dashboard"
    >
      <div className="relative h-9 w-9 shrink-0">
        <Image src="/logo.png" alt="Elder Nursing Logo" fill className="object-contain" priority />
      </div>
      <span className="hidden text-sm font-semibold sm:inline">Elder Nursing</span>
    </Link>
  );
}

function ProfileDropdown() {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  return (
    <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl bg-white text-gray-700 shadow-lg">
      <Link href="/profile-nurse" className="flex w-full items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50">
        <User size={16} />
        แก้ไขโปรไฟล์
      </Link>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
      >
        <LogOut size={16} />
        ออกจากระบบ
      </button>
    </div>
  );
}

// Role-based avatar mapping
const ROLE_AVATAR_MAP: Record<string, string> = {
  nurse: "/images/nurse.png",
  kitchen: "/images/kitchen.png",
};

// Role display name mapping
const ROLE_DISPLAY_MAP: Record<string, string> = {
  nurse: "เจ้าหน้าที่ดูแล",
  kitchen: "เจ้าหน้าที่ครัว",
};

function getRoleAvatar(role?: string): string {
  if (!role) return ROLE_AVATAR_MAP.nurse;
  const lowerRole = role.toLowerCase();

  if (lowerRole.includes("kitchen") || lowerRole.includes("โภชนา") || lowerRole.includes("ครัว")) {
    return ROLE_AVATAR_MAP.kitchen;
  }

  return ROLE_AVATAR_MAP.nurse;
}

function getRoleDisplayName(role?: string): string {
  if (!role) return ROLE_DISPLAY_MAP.nurse;
  const lowerRole = role.toLowerCase();

  if (lowerRole.includes("kitchen") || lowerRole.includes("โภชนา") || lowerRole.includes("ครัว")) {
    return ROLE_DISPLAY_MAP.kitchen;
  }

  return ROLE_DISPLAY_MAP.nurse;
}

function UserAvatar({ user }: { user: NavbarUser }) {
  const avatarSrc = getRoleAvatar(user.role);

  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/40">
      <Image 
        src={avatarSrc} 
        alt={user.firstName} 
        fill 
        className="object-cover" 
        unoptimized
        priority
      />
    </div>
  );
}

// Main Component
export function AppNavbar({
  user,
  notificationsCount = 0,
  onToggleSidebar,
}: AppNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside([menuRef], () => setIsMenuOpen(false));

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // Check if user is kitchen staff
  const isKitchenStaff = user.role?.toLowerCase().includes("kitchen") || 
                         user.role?.toLowerCase().includes("โภชนา") || 
                         user.role?.toLowerCase().includes("ครัว");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#0093EF] text-white shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/20 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <NavbarLogo />
        </div>

        <div className="flex items-center gap-5">
          {!isKitchenStaff && <NotificationBell notificationsCount={notificationsCount} />}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={toggleMenu}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/20",
                isMenuOpen && "bg-white/10"
              )}
            >
              <UserAvatar user={user} />
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-semibold leading-tight">{user.firstName}</span>
                <span className="text-xs text-white/80">{getRoleDisplayName(user.role)}</span>
              </div>
              <ChevronDown size={16} className="text-white/80" />
            </button>

            {isMenuOpen && <ProfileDropdown />}
          </div>
        </div>
      </div>
    </header>
  );
}
