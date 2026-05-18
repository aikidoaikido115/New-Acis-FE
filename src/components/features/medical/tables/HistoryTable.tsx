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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">เวลา</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">ชื่อ-นามสกุล</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">ยา</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">มื้อ</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">สถานะ</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">หมายเหตุ</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">ผู้ให้</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
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
                  <td className="py-3 px-4 text-xs sm:text-sm text-gray-700">{entry.meal}</td>
                  <td className="py-3 px-4">
                    {entry.status === "ให้แล้ว" ? (
                      <span className="status-pill inline-flex px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs sm:text-sm font-medium">
                        ให้แล้ว
                      </span>
                    ) : entry.status === "รอให้" ? (
                      <span className="status-pill inline-flex px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-medium">
                        รอให้
                      </span>
                    ) : (
                      <span className="status-pill inline-flex px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs sm:text-sm font-medium">
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
      <div className="space-y-3 md:hidden">
        {history.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center">
            <div className="text-sm text-gray-600">ไม่พบประวัติการให้ยา</div>
            <div className="mt-1 text-xs text-gray-400">ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองสถานะ</div>
          </div>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-gray-500">{formatHistoryDateTime(entry.actionAt) || entry.time}</div>
                <div>
                  {entry.status === "ให้แล้ว" ? (
                    <span className="status-pill inline-flex px-2.5 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                      ให้แล้ว
                    </span>
                  ) : entry.status === "รอให้" ? (
                    <span className="status-pill inline-flex px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      รอให้
                    </span>
                  ) : (
                    <span className="status-pill inline-flex px-2.5 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                      งด
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                <div><span className="text-gray-500">ชื่อ:</span> {entry.patientName}</div>
                <div><span className="text-gray-500">ยา:</span> {entry.medication}</div>
                <div><span className="text-gray-500">มื้อ:</span> {entry.meal}</div>
                <div><span className="text-gray-500">หมายเหตุ:</span> {entry.note}</div>
                <div>
                  <span className="text-gray-500">ผู้ให้:</span>{" "}
                  <button
                    type="button"
                    onClick={() => setActiveContactName(entry.givenBy)}
                    className="text-blue-600 underline hover:text-blue-700"
                  >
                    {entry.givenBy}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
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
