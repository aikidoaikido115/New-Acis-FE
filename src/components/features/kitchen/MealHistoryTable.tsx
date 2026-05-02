"use client";
import { MoreVertical } from "lucide-react";
import type { MealHistoryRow } from "./MealHistory.types";

interface MealHistoryTableProps {
  rows: MealHistoryRow[];
  onOpenPopover: (id: string) => void;
}

export function MealHistoryTable({ rows, onOpenPopover }: MealHistoryTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed text-left text-sm border-collapse">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-[35%] sm:w-[20%] md:w-[35%] pl-4 md:pl-8 pr-2 py-3 text-xs font-semibold text-slate-600 text-left">
              <span className="sm:hidden">วันที่เตรียม</span>
              <span className="hidden sm:inline">วันที่จัดเตรียมมื้ออาหาร</span>
            </th>
            
            <th className="w-[25%] sm:w-[20%] md:w-[20%] px-2 md:px-4 py-3 text-xs font-semibold text-slate-600 text-left">
              <span className="sm:hidden">มื้อ</span>
              <span className="hidden sm:inline">มื้ออาหาร</span>
            </th>
            
            <th className="w-[25%] sm:w-[20%] md:w-[20%] px-2 md:px-4 py-3 text-xs font-semibold text-slate-600 text-left">
              เมนู
            </th>
            
            <th className="w-[12%] sm:w-[15%] md:w-[15%] px-2 md:px-1 py-3 text-xs font-semibold text-slate-600 text-left">
              <span className="sm:hidden">จำนวน</span>
              <span className="hidden sm:inline">จำนวน (เสิร์ฟ)</span>
            </th>
            
            <th className="hidden md:table-cell md:w-[20%] px-2 md:px-4 py-3 text-xs font-semibold text-slate-600 text-left">
              ผู้ทำรายการ
            </th>
            
            <th className="w-[10%] sm:hidden px-1 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                ยังไม่มีข้อมูลประวัติรายการอาหาร
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition relative">
                <td className="pl-4 md:pl-8 pr-2 py-2.5 text-xs text-slate-800 font-medium text-left overflow-hidden">
                  <div className="truncate" title={row.date}>{row.date}</div>
                </td>
                <td className="px-2 md:px-4 py-2.5 text-xs text-slate-700 text-left overflow-hidden">
                  <div className="truncate" title={row.time}>{row.time}</div>
                </td>
                <td className="px-2 md:px-4 py-2.5 text-xs text-slate-700 text-left overflow-hidden">
                  <div className="truncate" title={row.menu}>
                    {row.menu.includes('(เมนูรอง)') ? (
                      <>
                        {row.menu.replace(' (เมนูรอง)', '')}{' '}
                        <span className="text-red-500 font-medium">(เมนูรอง)</span>
                      </>
                    ) : (
                      row.menu
                    )}
                  </div>
                </td>
                <td className="px-2 md:px-1 py-2.5 text-left overflow-hidden">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {row.servings}
                  </span>
                </td>
                <td className="px-2 md:px-4 py-2.5 text-xs text-slate-700 hidden md:table-cell text-left overflow-hidden">
                  <div className="truncate" title={row.createdBy}>{row.createdBy}</div>
                </td>
                <td className="px-1 py-2.5 sm:hidden text-center">
                  <button
                    onClick={() => onOpenPopover(row.id)}
                    className="p-1.5 rounded-full hover:bg-slate-100 active:bg-slate-600 active:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600"
                  >
                    <MoreVertical className="w-4 h-4 text-black" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}