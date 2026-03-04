import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ========== Stat Card ==========
interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  change?: string;
  unit?: string;
}

export function StatCard({ label, value, icon, change, unit = "คน" }: StatCardProps) {
  const hasUnit = Boolean(unit);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-black">
        <span>{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-2xl font-semibold text-slate-800">
          {value}
          {hasUnit && <span className="ml-1 text-base font-normal text-slate-500">{unit}</span>}
        </span>
        {change && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

// ========== Dashboard Card ==========
interface DashboardCardProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({ title, icon, action, children, className }: DashboardCardProps) {
  return (
    <div className={cn("rounded-2xl bg-white p-6 shadow-sm", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {icon && <span className="text-slate-400">{icon}</span>}
        {action}
      </div>
      {children}
    </div>
  );
}

// ========== Vital Sign Item ==========
interface VitalSignItemProps {
  label: string;
  value: number;
  variant: "normal" | "warning" | "danger";
}

const variantStyles = {
  normal: "bg-emerald-50 border-emerald-200 text-emerald-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  danger: "bg-rose-50 border-rose-200 text-rose-700",
};

export function VitalSignItem({ label, value, variant }: VitalSignItemProps) {
  return (
    <div className={cn("flex items-center justify-between rounded-lg border px-4 py-2 text-sm", variantStyles[variant])}>
      <span>{label}</span>
      <span>{value} คน</span>
    </div>
  );
}

// ========== Medicine Summary Item ==========
interface MedicineSummaryItemProps {
  label: string;
  value: string;
}

export function MedicineSummaryItem({ label, value }: MedicineSummaryItemProps) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

// ========== Inventory Item ==========
interface InventoryItemProps {
  label: string;
  total: number;
  alert: number;
}

export function InventoryItem({ label, total, alert }: InventoryItemProps) {
  return (
    <div className="space-y-1">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">รวมทั้งหมด {total} รายการ</span>
        <span className="font-medium text-orange-500">เหลือ {alert} รายการ</span>
      </div>
    </div>
  );
}

// ========== Schedule Item ==========
interface ScheduleItemProps {
  time: string;
  title: string;
  detail: string;
  location: string;
  badge?: string;
}

export function ScheduleItem({ time, title, detail, location, badge = "วันนี้" }: ScheduleItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>{time}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{badge}</span>
      </div>
      <div className="mt-2 text-sm text-slate-800">{title}</div>
      <div className="text-xs text-slate-500">{detail}</div>
      <div className="mt-2 text-xs text-slate-500">{location}</div>
    </div>
  );
}

// ========== Gender Chart ==========
interface GenderChartProps {
  male: number;
  female: number;
}

export function GenderChart({ male, female }: GenderChartProps) {
  const safeMale = Number.isFinite(male) ? male : 0;
  const safeFemale = Number.isFinite(female) ? female : 0;
  const total = safeMale + safeFemale;
  const malePercent = total > 0 ? Math.round((safeMale / total) * 100) : 0;
  const femalePercent = total > 0 ? 100 - malePercent : 0;
  const maleDisplay = total > 0 && safeMale > 0 ? `${safeMale} คน (${malePercent}%)` : "- คน (0%)";
  const femaleDisplay = total > 0 && safeFemale > 0 ? `${safeFemale} คน (${femalePercent}%)` : "- คน (0%)";

  return (
    <div className="flex items-center gap-6 md:flex-col md:items-center lg:flex-row lg:items-center">
      <div
        className="h-28 w-28 rounded-full aspect-square object-center"
        style={{
          background: total > 0 
            ? `conic-gradient(#3B82F6 0% ${malePercent}%, #F472B6 ${malePercent}% 100%)`
            : "#e2e8f0",
        }}
      />
      <div className="space-y-3 text-sm md:mt-4 lg:mt-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-slate-600">เพศชาย</span>
          <span className="font-medium text-slate-900">{maleDisplay}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-pink-400" />
          <span className="text-slate-600">เพศหญิง</span>
          <span className="font-medium text-slate-900">{femaleDisplay}</span>
        </div>
      </div>
    </div>
  );
}

// ========== Link Button ==========
interface LinkButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}

export function LinkButton({ children, onClick, href }: LinkButtonProps) {
  const className = "text-xs font-semibold text-[#0093EF]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
