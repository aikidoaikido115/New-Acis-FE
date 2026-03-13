"use client";

import { useState } from "react";
import { MedicationHistory } from "../medical.mock";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";

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
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">เวลา</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ชื่อ-นามสกุล</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ยา</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">สถานะ</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">หมายเหตุ</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ผู้ให้</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors align-middle">
              <td className="py-3 px-4 text-sm text-gray-700">{entry.time}</td>
              <td className="py-3 px-4 text-sm text-gray-700">{entry.patientName}</td>
              <td className="py-3 px-4 text-sm text-gray-700">{entry.medication}</td>
              <td className="py-3 px-4">
                {entry.status === "ให้แล้ว" ? (
                  <span className="inline-flex px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                    ให้แล้ว
                  </span>
                ) : (
                  <span className="inline-flex px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                    งด
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-sm text-gray-700">{entry.note}</td>
              <td className="py-3 px-4 text-sm text-blue-600 underline">
                <button
                  type="button"
                  onClick={() => setActiveContactName(entry.givenBy)}
                  className="hover:text-blue-700"
                >
                  {entry.givenBy}
                </button>
              </td>
            </tr>
          ))}
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
