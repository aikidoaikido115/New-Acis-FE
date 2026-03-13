"use client";

import { useState } from "react";
import { Eye, Clock } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { mockVitalSigns, timeSlots } from "../emr.mock";

export function VitalSignsTable() {
  const [selectedTime, setSelectedTime] = useState("6:00");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;
  const [records, setRecords] = useState(mockVitalSigns);

  const handleChange = (id: number, field: string, value: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="p-6 space-y-4">
      {/* Time Slots Section */}
      <div>
        <div className="flex items-center gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedTime(slot.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedTime === slot.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ชื่อ/ห้อง</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>อุณหภูมิ</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ชีพจร</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ความดัน</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>O2 Sat</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>หายใจ</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>น้ำตาล</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>น้ำเข้า</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ปัสสาวะ</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>อุจจาระ</th>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ผ้าอ้อม</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    <span className="underline">{record.name}</span>
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.temp} onChange={(e) => handleChange(record.id, 'temp', e.target.value)}
                      className={`w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center outline-none focus:ring-1 focus:ring-blue-300 ${record.tempAbnormal ? 'text-red-500 font-medium' : 'text-gray-900'}`}
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.pulse} onChange={(e) => handleChange(record.id, 'pulse', e.target.value)}
                      className="w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center text-gray-900 outline-none focus:ring-1 focus:ring-blue-300"
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.bp} onChange={(e) => handleChange(record.id, 'bp', e.target.value)}
                      className={`w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center outline-none focus:ring-1 focus:ring-blue-300 ${record.bpAbnormal ? 'text-red-500 font-medium' : 'text-gray-900'}`}
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.o2} onChange={(e) => handleChange(record.id, 'o2', e.target.value)}
                      className="w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center text-gray-900 outline-none focus:ring-1 focus:ring-blue-300"
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.resp} onChange={(e) => handleChange(record.id, 'resp', e.target.value)}
                      className="w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center text-gray-900 outline-none focus:ring-1 focus:ring-blue-300"
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.sugar} onChange={(e) => handleChange(record.id, 'sugar', e.target.value)}
                      className={`w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center outline-none focus:ring-1 focus:ring-blue-300 ${record.sugar === "180" ? 'text-red-500 font-medium' : 'text-gray-900'}`}
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.intake} onChange={(e) => handleChange(record.id, 'intake', e.target.value)}
                      className="w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center text-gray-900 outline-none focus:ring-1 focus:ring-blue-300"
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.urine} onChange={(e) => handleChange(record.id, 'urine', e.target.value)}
                      className="w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center text-gray-900 outline-none focus:ring-1 focus:ring-blue-300"
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.feces} onChange={(e) => handleChange(record.id, 'feces', e.target.value)}
                      className="w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center text-gray-900 outline-none focus:ring-1 focus:ring-blue-300"
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={record.diaper} onChange={(e) => handleChange(record.id, 'diaper', e.target.value)}
                      className="w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center text-gray-900 outline-none focus:ring-1 focus:ring-blue-300"
                      style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button className="text-blue-500 hover:text-blue-700 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Section - Separate (no box, just aligned) */}
      <div className="flex justify-end">
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}
