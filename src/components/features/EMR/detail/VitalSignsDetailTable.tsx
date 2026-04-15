"use client";

import { useEffect, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { vitalSignService } from "@/services/vital-sign.service";
import type { VitalSign } from "@/types/vital-sign";

interface VitalSignsDetailTableProps {
  patientId: string;
}

export function VitalSignsDetailTable(props: VitalSignsDetailTableProps) {
  const [records, setRecords] = useState<VitalSign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!props.patientId) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await vitalSignService.getHistory(props.patientId);
        const sorted = [...(data || [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecords(sorted);
      } catch {
        setError("ไม่สามารถโหลดประวัติสัญญาณชีพได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [props.patientId]);

  const totals = useMemo(() => {
    return {
      intake: "-",
      urine: "-",
      feces: "-",
      diaper: "-",
    };
  }, []);

  const asText = (value?: number | null) => (value === null || typeof value === "undefined" ? "-" : String(value));

  const asBloodPressure = (systolic?: number | null, diastolic?: number | null) => {
    if (typeof systolic !== "number" || typeof diastolic !== "number") {
      return "-";
    }
    return `${systolic}/${diastolic}`;
  };

  const isAbnormalTemperature = (temperature?: number | null) => typeof temperature === "number" && (temperature < 36 || temperature > 37.5);
  const isAbnormalPressure = (systolic?: number | null, diastolic?: number | null) => {
    if (typeof systolic !== "number" || typeof diastolic !== "number") {
      return false;
    }
    return systolic < 90 || systolic > 120 || diastolic < 60 || diastolic > 80;
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
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>วัน/เวลา</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>อุณหภูมิ</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ชีพจร</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ความดัน</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>O2 Sat</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>หายใจ</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>น้ำตาล</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>น้ำเข้า</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ปัสสาวะ</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>อุจจาระ</th>
                <th className="text-center py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ผ้าอ้อม</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-6 px-4 text-center text-sm text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} className="py-6 px-4 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 px-4 text-center">
                    <div className="text-sm text-gray-600">ไม่พบข้อมูลสัญญาณชีพ</div>
                    <div className="text-xs text-gray-400 mt-1">ยังไม่มีประวัติสัญญาณชีพของผู้พักรายนี้</div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const date = new Date(record.created_at);
                  const dateText = date.toLocaleDateString("th-TH");
                  const timeText = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <tr key={record.vital_sign_id} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                      <td className="py-3 px-3 text-xs sm:text-sm text-gray-700">
                        {dateText} {timeText}
                      </td>
                      <td className={`py-2 px-2 text-center text-xs ${isAbnormalTemperature(record.temperature) ? "text-red-500 font-medium" : "text-gray-900"}`}>
                        {asText(record.temperature)}
                      </td>
                      <td className="py-2 px-2 text-center text-xs text-gray-900">{asText(record.heart_rate)}</td>
                      <td className={`py-2 px-2 text-center text-xs ${isAbnormalPressure(record.blood_pressure_systolic, record.blood_pressure_diastolic) ? "text-red-500 font-medium" : "text-gray-900"}`}>
                        {asBloodPressure(record.blood_pressure_systolic, record.blood_pressure_diastolic)}
                      </td>
                      <td className="py-2 px-2 text-center text-xs text-gray-900">{asText(record.oxygen_saturation)}</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-900">{asText(record.breathing_rate)}</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-400">-</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-400">-</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-400">-</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-400">-</td>
                      <td className="py-2 px-2 text-center text-xs text-gray-400">-</td>
                    </tr>
                  );
                })
              )}
              
              {/* Totals Row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="py-3 px-3 text-xs sm:text-sm text-gray-700" colSpan={7}>
                  ผลรวมตั้งแต่เช้า / น้ำเข้า
                </td>
                <td className="py-3 px-3 text-xs sm:text-sm text-center text-gray-700">{totals.intake}</td>
                <td className="py-3 px-3 text-xs sm:text-sm text-center text-gray-700">{totals.urine}</td>
                <td className="py-3 px-3 text-xs sm:text-sm text-center text-gray-700">{totals.feces}</td>
                <td className="py-3 px-3 text-xs sm:text-sm text-center text-gray-700">{totals.diaper}</td>
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
          <span className="text-xs sm:text-sm font-medium">พิมพ์ / Export PDF</span>
        </button>
      </div>
    </div>
  );
}
