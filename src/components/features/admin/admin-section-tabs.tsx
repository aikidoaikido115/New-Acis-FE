"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/components/features/admin/admin-data";
import { useAdminContext } from "@/components/features/admin/AdminContext";

function getShortLabel(href: string, fullLabel: string): string {
  if (href === "/admin/users") return "ผู้ใช้งาน";
  if (href === "/admin/relatives") return "บัญชีญาติ";
  if (href === "/admin/register-approvals") return "การสมัคร";
  return fullLabel;
}

export function AdminSectionTabs() {
  const pathname = usePathname();
  const { pendingCount, refetchPendingCount } = useAdminContext();

  useEffect(() => {
    void refetchPendingCount();
  }, [refetchPendingCount]);

  return (
    <div className="overflow-x-auto w-full min-w-0">
      <div className="inline-flex min-w-full gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isApprovalTab = item.href === "/admin/register-approvals";
          const shortLabel = getShortLabel(item.href, item.label);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition",
                isActive
                  ? "bg-[#0093EF] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <span className="flex items-center gap-2">
                <span className={item.label !== shortLabel ? "sm:hidden" : ""}>
                  {shortLabel}
                </span>
                {item.label !== shortLabel && (
                  <span className="hidden sm:inline">
                    {item.label}
                  </span>
                )}
                
                {isApprovalTab && pendingCount > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs font-bold bg-red-500 text-white rounded-full">
                    {pendingCount}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}