"use client";
import { X } from "lucide-react";
import type { MealHistoryRow } from "./MealHistory.types";

interface MealHistoryMobileModalProps {
  row: MealHistoryRow | null;
  onClose: () => void;
}

export function MealHistoryMobileModal({ row, onClose }: MealHistoryMobileModalProps) {
  if (!row) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 sm:hidden backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 w-full max-w-[300px] text-left transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">รายละเอียด</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="block text-xs font-medium text-slate-400 mb-0.5">หมายเหตุ</span>
            <span className="text-slate-800">{row.notes || "-"}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-400 mb-0.5">ผู้ทำรายการ</span>
            <span className="text-slate-800">{row.createdBy}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
