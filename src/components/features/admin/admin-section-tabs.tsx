"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "@/components/features/admin/admin-data";

export function AdminSectionTabs() {
  const pathname = usePathname();

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-[#0093EF] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
