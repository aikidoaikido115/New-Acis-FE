"use client";

import { useEffect, useMemo, useState } from "react";
import { vitalSignService } from "@/services/vital-sign.service";
import type { VitalSign } from "@/types/vital-sign";

interface GraphViewProps {
  patientId: string;
}

export function GraphView({ patientId }: GraphViewProps) {
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
        const sorted = [...(data || [])]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(-10);
        setRecords(sorted);
      } catch {
        setError("ไม่สามารถโหลดข้อมูลกราฟได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [patientId]);

  const chartData = useMemo(() => {
    const dates = records.map((record) => {
      const date = new Date(record.created_at);
      return date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" });
    });
    const heartRate = records.map((record) => record.heart_rate ?? 0);
    const temperature = records.map((record) => record.temperature ?? 0);
    return { dates, heartRate, temperature };
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
    return <div className="p-6 text-sm text-gray-500">กำลังโหลดข้อมูลกราฟ...</div>;
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
    <div className="p-6">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        {/* Legend */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-blue-500"></div>
            <span className="text-body-small font-medium text-gray-700">Heart Rate (bpm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-red-500"></div>
            <span className="text-body-small font-medium text-gray-700">Temperature (°C)</span>
          </div>
        </div>

        {/* SVG Graph */}
        <svg width={width} height={height} className="mx-auto">
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
          <text x={padding - 35} y={padding - 10} className="text-overline fill-blue-600 font-medium">
            120
          </text>
          <text x={padding - 35} y={padding + chartHeight / 4} className="text-overline fill-gray-600">
            110
          </text>
          <text x={padding - 35} y={padding + chartHeight / 2} className="text-overline fill-gray-600">
            100
          </text>
          <text x={padding - 30} y={padding + (3 * chartHeight) / 4} className="text-overline fill-gray-600">
            80
          </text>
          <text x={padding - 30} y={height - padding + 5} className="text-overline fill-gray-600">
            60
          </text>

          {/* Y-axis labels - Temperature (right) */}
          <text x={width - padding + 15} y={padding - 10} className="text-overline fill-red-600 font-medium">
            39
          </text>
          <text x={width - padding + 15} y={padding + chartHeight / 3} className="text-overline fill-gray-600">
            38
          </text>
          <text x={width - padding + 15} y={padding + (2 * chartHeight) / 3} className="text-overline fill-red-600 font-medium">
            37 °C
          </text>
          <text x={width - padding + 15} y={height - padding + 5} className="text-overline fill-gray-600">
            36
          </text>

          {/* X-axis labels */}
          {chartData.dates.map((date, index) => {
            const x = padding + (index / (chartData.dates.length - 1)) * chartWidth;
            return (
              <text key={`x-label-${index}`} x={x} y={height - padding + 25} className="text-overline fill-gray-600 text-anchor-middle" textAnchor="middle">
                {date}
              </text>
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
  );
}
