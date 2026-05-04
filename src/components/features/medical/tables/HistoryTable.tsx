"use client";

import { useState } from "react";
import type { MedicationHistory } from "../medical.types";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";

const formatHistoryDateTime = (dateText?: string | null): string => {
  if (!dateText) {
    return "-";
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
};

interface HistoryTableProps {
  history: MedicationHistory[];
}

export function HistoryTable({ history }: HistoryTableProps) {
  const [activeContactName, setActiveContactName] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">เวลา</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">ชื่อ-นามสกุล</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">ยา</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">สถานะ</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">หมายเหตุ</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">ผู้ให้</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 px-4 text-center">
                <div className="text-sm text-gray-600">ไม่พบประวัติการให้ยา</div>
                <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองสถานะ</div>
              </td>
            </tr>
          ) : (
            history.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors align-middle">
                <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">
                  {formatHistoryDateTime(entry.actionAt) || entry.time}
                </td>
                <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">{entry.patientName}</td>
                <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">{entry.medication}</td>
                <td className="py-3 px-4">
                  {entry.status === "ให้แล้ว" ? (
                    <span className="inline-flex px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs sm:text-sm font-medium">
                      ให้แล้ว
                    </span>
                  ) : entry.status === "รอให้" ? (
                    <span className="inline-flex px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-medium">
                      รอให้
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs sm:text-sm font-medium">
                      งด
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">{entry.note}</td>
                <td className="py-3 px-4 text-xs sm:text-sm text-blue-600 underline">
                  <button
                    type="button"
                    onClick={() => setActiveContactName(entry.givenBy)}
                    className="hover:text-blue-700"
                  >
                    {entry.givenBy}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>

      {activeContactName ? (
        <ContactInformationModal
          contact={resolveContactInfo(activeContactName)}
          onClose={() => setActiveContactName(null)}
        />
      ) : null}
    </>
  );
}
