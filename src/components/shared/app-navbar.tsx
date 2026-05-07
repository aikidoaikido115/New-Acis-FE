"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { DEFAULT_PROFILE_IMAGE, resolveProfileImage } from "@/lib/profile-image";
import { useClickOutside } from "@/hooks/use-click-outside";
import { NotificationBell } from "@/components/shared/notifications/notifications";
import { KitchenNotificationBell } from "@/components/features/kitchen/notificetions";
import { authService } from "@/services/auth.service";

interface NavbarUser {
  firstName: string;
  role?: string;
  profile_image?: string;
}

interface AppNavbarProps {
  user: NavbarUser;
  notificationsCount?: number;
  onToggleSidebar?: () => void;
}

function isKitchenRole(role?: string): boolean {
  if (!role) return false;
  const lowerRole = role.toLowerCase();
  return lowerRole.includes("kitchen") || lowerRole.includes("โภชนา") || lowerRole.includes("ครัว");
}

function isSuperuserRole(role?: string): boolean {
  if (!role) return false;
  const lowerRole = role.toLowerCase();
  return lowerRole.includes("superuser") || lowerRole.includes("super user") || lowerRole.includes("super_user");
}

function isAdminRole(role?: string): boolean {
  if (!role) return false;
  const lowerRole = role.toLowerCase();
  return lowerRole.includes("admin");
}

function getHomePathByRole(role?: string): string {
  if (role?.toLowerCase().includes("relative")) return "/relative/dashboard";
  if (isKitchenRole(role)) return "/manage-meal";
  if (isAdminRole(role)) return "/admin/users";
  if (isSuperuserRole(role)) return "/dashboard";
  return "/dashboard";
}

// Sub-Components
function NavbarLogo({ role }: { role?: string }) {

  const router = useRouter();
  const homePath = getHomePathByRole(role);

  return (
    <Link
      href={homePath}
      onClick={(e) => {
        e.preventDefault();
        router.push(homePath);
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
    try {
      await authService.logout();
      router.push('/login');
    } catch {
      // Force navigate even if API fails
      router.push('/login');
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl bg-white text-gray-700 shadow-lg">
      <Link href="/profile" className="flex w-full items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50">
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
  nurse: DEFAULT_PROFILE_IMAGE,
  kitchen: DEFAULT_PROFILE_IMAGE,
  admin: DEFAULT_PROFILE_IMAGE,
};

// Role display name mapping
const ROLE_DISPLAY_MAP: Record<string, string> = {
  nurse: "เจ้าหน้าที่ดูแล",
  kitchen: "เจ้าหน้าที่ครัว",
  admin: "ผู้ดูแลระบบ",
};


function getRoleAvatar(role?: string): string {
  if (!role) return ROLE_AVATAR_MAP.nurse;
  if (isKitchenRole(role)) {
    return ROLE_AVATAR_MAP.kitchen;
  }
  if (isAdminRole(role)) {
    return ROLE_AVATAR_MAP.admin;
  }
  return ROLE_AVATAR_MAP.nurse;
}

function getRoleDisplayName(role?: string): string {
  if (!role) return ROLE_DISPLAY_MAP.nurse;
  if (isSuperuserRole(role)) {
    return "หัวหน้าเจ้าหน้าที่ดูแล";
  }
  if (isKitchenRole(role)) {
    return ROLE_DISPLAY_MAP.kitchen;
  }
  if (isAdminRole(role)) {
    return ROLE_DISPLAY_MAP.admin;
  }
  return ROLE_DISPLAY_MAP.nurse;
}

function UserAvatar({ user }: { user: NavbarUser }) {
  const avatarSrc = resolveProfileImage(user.profile_image) || getRoleAvatar(user.role);
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

  useClickOutside(() => setIsMenuOpen(false), menuRef);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // Check if user is kitchen staff
  const isKitchenStaff = isKitchenRole(user.role);

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
          <NavbarLogo role={user.role} />
        </div>

        <div className="flex items-center gap-5">
          {/* {isKitchenStaff ? (
            <KitchenNotificationBell />
          ) : (
            <NotificationBell notificationsCount={notificationsCount} />
          )} */}

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
