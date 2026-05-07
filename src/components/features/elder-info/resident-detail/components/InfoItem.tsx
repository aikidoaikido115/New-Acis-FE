import type { ComponentType } from "react";

interface InfoItemProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}

export function InfoItem({ icon: Icon, label, value, className }: InfoItemProps) {
  return (
    <div className={`flex gap-3 ${className || ""}`.trim()}>
      <div className="mt-1 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-800">{value}</div>
      </div>
    </div>
  );
}
