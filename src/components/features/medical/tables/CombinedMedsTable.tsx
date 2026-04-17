"use client";

import { useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import type { RoutineMedication } from "../medical.types";

type MedTypeFilter = "all" | "routine" | "prn";

type CombinedMedication = RoutineMedication & {
  medType: "routine" | "prn";
  medTypeLabel: string;
};

interface CombinedMedsTableProps {
  routineMedications: RoutineMedication[];
  prnMedications: RoutineMedication[];
  onEditMed: (medId: string) => void;
  onDeleteMed: (medId: string) => void;
}

export function CombinedMedsTable({
  routineMedications,
  prnMedications,
  onEditMed,
  onDeleteMed
}: CombinedMedsTableProps) {
  const [medTypeFilter, setMedTypeFilter] = useState<MedTypeFilter>("all");

  const allRows = useMemo<CombinedMedication[]>(() => {
    const routineRows = routineMedications.map((med) => ({
      ...med,
      medType: "routine" as const,
      medTypeLabel: "ยาประจำ"
    }));

    const prnRows = prnMedications.map((med) => ({
      ...med,
      medType: "prn" as const,
      medTypeLabel: "ยาตามอาการ / ชั่วคราว"
    }));

    return [...routineRows, ...prnRows];
  }, [routineMedications, prnMedications]);

  const filteredRows = useMemo(() => {
    if (medTypeFilter === "all") {
      return allRows;
    }

    return allRows.filter((row) => row.medType === medTypeFilter);
  }, [allRows, medTypeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs sm:text-sm font-medium text-gray-600">ประเภท:</span>
        <button
          type="button"
          onClick={() => setMedTypeFilter("all")}
          className={`rounded-full px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
            medTypeFilter === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          ทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => setMedTypeFilter("routine")}
          className={`rounded-full px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
            medTypeFilter === "routine"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          ยาประจำ
        </button>
        <button
          type="button"
          onClick={() => setMedTypeFilter("prn")}
          className={`rounded-full px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
            medTypeFilter === "prn"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          ยาตามอาการ / ชั่วคราว
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-[#E9EDF1] border border-[#D6DCE2]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#CFD5DC]">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">ประเภท</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">ชื่อยา</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">โดส</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">ความถี่/วัน</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">หมายเหตุ</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center">
                  <div className="text-sm text-gray-600">ไม่พบรายการยาในประเภทที่เลือก</div>
                  <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนตัวกรองประเภท หรือเพิ่มข้อมูลยาใหม่</div>
                </td>
              </tr>
            ) : (
              filteredRows.map((med, index) => (
                <tr
                  key={`${med.medType}-${med.id}`}
                  className={`align-middle ${index !== filteredRows.length - 1 ? "border-b border-[#CFD5DC]" : ""}`}
                >
                  <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs sm:text-sm font-medium text-gray-700 border border-gray-300">
                      {med.medTypeLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm font-medium text-gray-900">{med.name}</td>
                  <td className="py-3 px-4 text-xs sm:text-sm font-medium text-gray-900">{med.dose}</td>
                  <td className="py-3 px-4 text-xs sm:text-sm font-medium text-gray-900">{med.frequency}</td>
                  <td className="py-3 px-4 text-xs sm:text-sm font-medium text-gray-900">{med.note}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditMed(med.id)}
                        className="p-1 text-[#1290EB] hover:text-[#0D75C0] transition-colors"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMed(med.id)}
                        className="p-1 text-[#FF3557] hover:text-[#D92644] transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
