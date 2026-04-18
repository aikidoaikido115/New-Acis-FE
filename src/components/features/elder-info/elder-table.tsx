"use client";
import { useState, useRef, useEffect } from "react";
import { Eye, Pencil, MoreVertical } from "lucide-react";
import type { ResidentDisplayData } from "@/types/elder";

interface ElderTableProps {
  residents: ResidentDisplayData[];
  onEdit?: (id: string) => void;
  onViewRelative?: (id: string) => void;
}

export function ElderTable({ residents, onEdit, onViewRelative }: ElderTableProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside dropdown
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);
  
  const careBadgeClass = (care: string) => {
    const variant = care.trim();
    if (variant === "ผู้สูงอายุทั่วไป") return "bg-green-100 text-green-800";
    if (variant === "ช่วยเหลือตัวเองได้บางส่วน") return "bg-orange-100 text-orange-800";
    if (variant === "ผู้สูงอายุติดเตียง") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="w-full">
      <div className="w-full">
        <table className="w-full table-fixed text-left text-sm border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="pl-8 pr-1 py-2 text-xs font-semibold text-slate-600 w-[35%] sm:w-[30%] md:w-[24%] lg:w-[22%]">
                ชื่อ-นามสกุล
              </th>
              <th className="px-1 py-2 text-xs font-semibold text-slate-600 w-[20%] md:w-[12%] hidden sm:table-cell">
                ชื่อเล่น
              </th>
              <th className="pl-1 pr-1 py-2 text-xs font-semibold text-slate-600 text-left w-[14%] sm:w-[11%] md:w-[10%]">
                ห้อง
              </th>
              <th className="px-1 py-2 text-xs font-semibold text-slate-600 w-[25%] sm:w-[18%] md:w-[22%]">
                ประเภท
              </th>
              <th className="px-1 py-2 text-xs font-semibold text-slate-600 w-[14%] hidden md:table-cell">
                เริ่มเข้าพัก
              </th>
              <th className="px-1 py-2 text-xs font-semibold text-slate-600 w-[14%] hidden lg:table-cell">
                คาดว่าจะออก
              </th>
              <th className="pl-2 pr-2 py-2 text-xs font-semibold text-slate-600 text-left w-[18%] sm:w-[16%] md:w-[12%] lg:w-[10%]">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {residents.map((resident) => (
              <tr key={resident.id} className="hover:bg-slate-50 transition">
                <td className="pl-8 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 font-medium">
                  <div className="truncate" title={resident.name}>{resident.name}</div>
                </td>
                <td className="px-1 py-2.5 text-xs sm:text-sm text-slate-700 hidden sm:table-cell">
                  <div className="truncate" title={resident.nickname}>{resident.nickname}</div>
                </td>
                <td className="pl-1 pr-1 py-2.5">
                  <span className="inline-flex items-center justify-start rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
                    {resident.room}
                  </span>
                </td>
                <td className="px-1 py-2.5">
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${careBadgeClass(resident.care)}`}>
                    <span className="truncate max-w-full">{resident.care.trim()}</span>
                  </span>
                </td>
                <td className="px-1 py-2.5 text-xs sm:text-sm text-slate-700 hidden md:table-cell">
                  <div className="truncate">{resident.admitted}</div>
                </td>
                <td className="px-1 py-2.5 text-xs sm:text-sm text-slate-700 hidden lg:table-cell">
                  <div className="truncate">{resident.discharged}</div>
                </td>
                <td className="pl-1 pr-3 py-2">
                  <div className="flex items-center justify-start">
                    <button
                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                      aria-label="ดูรายละเอียด"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition"
                      aria-label="แก้ไข"
                      title="แก้ไข"
                      onClick={() => onEdit?.(String(resident.id))}
                    >
                      <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <div className="relative dropdown-container">
                      <button
                        className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded transition"
                        aria-label="ตัวเลือกเพิ่มเติม"
                        title="ตัวเลือกเพิ่มเติม"
                        onClick={() => setOpenDropdown(openDropdown === resident.id ? null : resident.id)}
                      >
                        <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      {openDropdown === resident.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-yellow-100 rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                          <button
                            onClick={() => {
                              onViewRelative?.(String(resident.id));
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 text-left text-sm text-yellow-900 transition flex items-center gap-2"
                          >
                            ดูข้อมูลบนเว็บญาติ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}