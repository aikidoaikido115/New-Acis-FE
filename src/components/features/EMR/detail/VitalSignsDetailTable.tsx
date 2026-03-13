"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { mockVitalSignsData, mockVitalSignsTotals as totals } from "../emr.mock";

interface VitalSignsDetailTableProps {
  patientId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VitalSignsDetailTable(_props: VitalSignsDetailTableProps) {
  const [records, setRecords] = useState(mockVitalSignsData);

  const handleChange = (id: number, field: string, value: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export functionality
    console.log("Exporting to PDF...");
  };

  return (
    <div className="p-6 space-y-4">
      {/* Table Section */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>วัน/เวลา</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>อุณหภูมิ</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ชีพจร</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ความดัน</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>O2 Sat</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>หายใจ</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>น้ำตาล</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>น้ำเข้า</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ปัสสาวะ</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>อุจจาระ</th>
                <th className="text-center py-3 px-3 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ผ้าอ้อม</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                  <td className="py-3 px-3 text-sm text-gray-700">
                    {record.date} {record.time}
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
                      className={`w-full min-w-[92px] h-11 px-2 py-2 rounded-lg border text-base text-center outline-none focus:ring-1 focus:ring-blue-300 ${record.sugarAbnormal ? 'text-red-500 font-medium' : 'text-gray-900'}`}
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
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="py-3 px-3 text-sm text-gray-700" colSpan={7}>
                  ผลรวมตั้งแต่เช้า / น้ำเข้า
                </td>
                <td className="py-3 px-3 text-sm text-center text-gray-700">{totals.intake}</td>
                <td className="py-3 px-3 text-sm text-center text-gray-700">{totals.urine}</td>
                <td className="py-3 px-3 text-sm text-center text-gray-700">{totals.feces}</td>
                <td className="py-3 px-3 text-sm text-center text-gray-700">{totals.diaper}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          <span className="text-sm font-medium">พิมพ์ / Export PDF</span>
        </button>
      </div>
    </div>
  );
}
