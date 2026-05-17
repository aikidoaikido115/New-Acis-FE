"use client";

import { useEffect, useMemo, useState } from "react";
import { vitalSignService } from "@/services/vital-sign.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { VitalSign } from "@/types/vital-sign";

interface GraphViewProps {
  patientId: string;
  dateKey?: string;
}

const formatDateKey = (value: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function GraphView({ patientId, dateKey }: GraphViewProps) {
  const [records, setRecords] = useState<VitalSign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!patientId) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await vitalSignService.getHistory(patientId);
        const sorted = [...(data || [])].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        if (dateKey) {
          const filtered = sorted.filter((record) => {
            const key = formatDateKey(record.measurement_date || record.created_at);
            return key === dateKey;
          });
          setRecords(filtered);
        } else {
          setRecords(sorted.slice(-10));
        }
      } catch {
        setError("ไม่สามารถโหลดข้อมูลกราฟได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [patientId, dateKey]);

  const chartData = useMemo(() => {
    const dates = records.map((record) => {
      const date = new Date(record.created_at);
      return date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" });
    });
    const timeSlots = records.map((record) => {
      // Map time_of_day to time slot labels
      const timeOfDay = record.time_of_day?.toLowerCase() || "";
      if (timeOfDay.includes("morning") || timeOfDay === "เช้า") return "06:00";
      if (timeOfDay.includes("late_morning") || timeOfDay === "สาย" || timeOfDay === "สายๆ") return "10:00";
      if (timeOfDay.includes("afternoon") || timeOfDay === "บ่าย" || timeOfDay === "บ่ายแก่") return "14:00";
      if (timeOfDay.includes("evening") || timeOfDay === "เย็น") return "18:00";
      if (timeOfDay.includes("night") || timeOfDay === "กลางคืน") return "22:00";
      
      // Fallback to hour from created_at if time_of_day not specified
      const date = new Date(record.created_at);
      const hour = date.getHours();
      if (hour >= 4 && hour < 8) return "06:00";
      if (hour >= 8 && hour < 12) return "10:00";
      if (hour >= 12 && hour < 16) return "14:00";
      if (hour >= 16 && hour < 20) return "18:00";
      return "22:00";
    });
    const heartRate = records.map((record) => record.heart_rate ?? 0);
    const temperature = records.map((record) => record.temperature ?? 0);
    return { dates, timeSlots, heartRate, temperature };
  }, [records]);

  // Calculate scale and positions
  const width = 800;
  const height = 300;
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Heart rate scale (60-120 bpm)
  const hrMin = 60;
  const hrMax = 120;
  const hrRange = hrMax - hrMin;

  // Temperature scale (36-39°C)
  const tempMin = 36;
  const tempMax = 39;
  const tempRange = tempMax - tempMin;

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-red-500">{error}</div>;
  }

  if (chartData.dates.length < 2) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm font-medium text-gray-700">ยังไม่สามารถแสดงกราฟได้</p>
          <p className="mt-1 text-xs text-gray-500">
            ต้องมีข้อมูลสัญญาณชีพอย่างน้อย 2 ครั้ง (ปัจจุบัน {records.length} ครั้ง)
          </p>
          <p className="mt-2 text-xs text-gray-500">กรุณาเพิ่มข้อมูลสัญญาณชีพเพิ่มเติม แล้วกลับมาดูกราฟอีกครั้ง</p>
        </div>
      </div>
    );
  }

  // Generate path for heart rate line
  const hrPath = chartData.heartRate
    .map((hr, index) => {
      const x = padding + (index / (chartData.dates.length - 1)) * chartWidth;
      const y = height - padding - ((hr - hrMin) / hrRange) * chartHeight;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // Generate path for temperature line
  const tempPath = chartData.temperature
    .map((temp, index) => {
      const x = padding + (index / (chartData.dates.length - 1)) * chartWidth;
      const y = height - padding - ((temp - tempMin) / tempRange) * chartHeight;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="p-3 sm:p-6 w-full max-w-full min-w-0 overflow-hidden">
      <div className="bg-white rounded-lg p-4 sm:p-6 flex flex-col items-center w-full max-w-[calc(100vw-24px)] sm:max-w-full min-w-0 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-6 w-full min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-6 sm:w-8 h-1 bg-blue-500 shrink-0"></div>
            <span className="text-xs sm:text-body-small font-medium text-gray-700 whitespace-nowrap">Heart Rate (bpm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 sm:w-8 h-1 bg-red-500 shrink-0"></div>
            <span className="text-xs sm:text-body-small font-medium text-gray-700 whitespace-nowrap">Temperature (°C)</span>
          </div>
        </div>

        <div className="w-full min-w-0 overflow-x-auto pb-4 scrollbar-none">
          <div className="w-full min-w-[450px] md:min-w-full">
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-auto block"
            >
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => {
                const y = padding + (i / 4) * chartHeight;
                return (
                  <line
                    key={`grid-${i}`}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Y-axis labels - Heart Rate (left) */}
              <text x={padding - 35} y={padding - 10} className="text-[10px] sm:text-overline fill-blue-600 font-medium">
                120
              </text>
              <text x={padding - 35} y={padding + chartHeight / 4} className="text-[10px] sm:text-overline fill-gray-600">
                110
              </text>
              <text x={padding - 35} y={padding + chartHeight / 2} className="text-[10px] sm:text-overline fill-gray-600">
                100
              </text>
              <text x={padding - 30} y={padding + (3 * chartHeight) / 4} className="text-[10px] sm:text-overline fill-gray-600">
                80
              </text>
              <text x={padding - 30} y={height - padding + 5} className="text-[10px] sm:text-overline fill-gray-600">
                60
              </text>

              {/* Y-axis labels - Temperature (right) */}
              <text x={width - padding + 15} y={padding - 10} className="text-[10px] sm:text-overline fill-red-600 font-medium">
                39
              </text>
              <text x={width - padding + 15} y={padding + chartHeight / 3} className="text-[10px] sm:text-overline fill-gray-600">
                38
              </text>
              <text x={width - padding + 15} y={padding + (2 * chartHeight) / 3} className="text-[10px] sm:text-overline fill-red-600 font-medium">
                37 °C
              </text>
              <text x={width - padding + 15} y={height - padding + 5} className="text-[10px] sm:text-overline fill-gray-600">
                36
              </text>

              {/* X-axis labels */}
              {chartData.dates.map((date, index) => {
                const x = padding + (index / (chartData.dates.length - 1)) * chartWidth;
                const timeSlot = chartData.timeSlots[index];
                return (
                  <g key={`x-label-${index}`}>
                    <text x={x} y={height - padding + 20} className="text-[10px] sm:text-overline fill-gray-600 text-anchor-middle" textAnchor="middle">
                      {date}
                    </text>
                    <text x={x} y={height - padding + 33} className="text-[10px] sm:text-overline fill-blue-600 font-medium text-anchor-middle" textAnchor="middle">
                      {timeSlot}
                    </text>
                  </g>
                );
              })}

              {/* Heart rate line */}
              <path d={hrPath} fill="none" stroke="#3b82f6" strokeWidth="3" />

              {/* Heart rate points */}
              {chartData.heartRate.map((hr, index) => {
                const x = padding + (index / (chartData.dates.length - 1)) * chartWidth;
                const y = height - padding - ((hr - hrMin) / hrRange) * chartHeight;
                return (
                  <circle key={`hr-point-${index}`} cx={x} cy={y} r="5" fill="#3b82f6" />
                );
              })}

              {/* Temperature line */}
              <path d={tempPath} fill="none" stroke="#ef4444" strokeWidth="3" />

              {/* Temperature points */}
              {chartData.temperature.map((temp, index) => {
                const x = padding + (index / (chartData.dates.length - 1)) * chartWidth;
                const y = height - padding - ((temp - tempMin) / tempRange) * chartHeight;
                return (
                  <circle key={`temp-point-${index}`} cx={x} cy={y} r="5" fill="#ef4444" />
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}