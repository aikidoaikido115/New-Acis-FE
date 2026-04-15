"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Clock } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { vitalSignService } from "@/services/vital-sign.service";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import type { VitalSign } from "@/types/vital-sign";

const timeSlots = [
  { id: "all", label: "ทั้งหมด" },
  { id: "morning", label: "6:00-11:59" },
  { id: "afternoon", label: "12:00-17:59" },
  { id: "evening", label: "18:00-23:59" },
  { id: "night", label: "00:00-05:59" },
];

interface VitalSignsTableProps {
  selectedFloor?: string;
  selectedStatus?: "all" | "normal" | "abnormal";
}

export function VitalSignsTable({ selectedFloor = "all", selectedStatus = "all" }: VitalSignsTableProps) {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState<VitalSign[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const floorNumber = selectedFloor !== "all" ? Number(selectedFloor) : undefined;
        const [vitalSigns, residentData, roomData] = await Promise.all([
          vitalSignService.getOverview({
            floor: Number.isFinite(floorNumber) ? floorNumber : undefined,
            vitalsign_status: selectedStatus,
          }),
          residentService.getAll(),
          roomService.getAll(),
        ]);

        setRecords(vitalSigns || []);
        setResidents(residentData || []);
        setRooms(roomData || []);
      } catch {
        setError("ไม่สามารถโหลดข้อมูลสัญญาณชีพได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [selectedFloor, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFloor, selectedStatus, selectedTime]);

  const residentById = useMemo(() => {
    return new Map(
      residents.map((resident) => {
        const id = resident.resident_id || resident.id;
        return [id, resident] as const;
      })
    );
  }, [residents]);

  const roomById = useMemo(() => {
    return new Map(
      rooms.map((room) => {
        const id = room.room_id || room.id;
        return [id, room] as const;
      })
    );
  }, [rooms]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (selectedTime === "all") {
        return true;
      }

      const hour = new Date(record.created_at).getHours();
      if (selectedTime === "morning") return hour >= 6 && hour <= 11;
      if (selectedTime === "afternoon") return hour >= 12 && hour <= 17;
      if (selectedTime === "evening") return hour >= 18 && hour <= 23;
      if (selectedTime === "night") return hour >= 0 && hour <= 5;
      return true;
    });
  }, [records, selectedTime]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

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

  return (
    <div className="p-6 space-y-4">
      {/* Time Slots Section */}
      <div>
        <div className="flex items-center gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedTime(slot.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
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
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ชื่อ/ห้อง</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>อุณหภูมิ</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ชีพจร</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ความดัน</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>O2 Sat</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>หายใจ</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>น้ำตาล</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>น้ำเข้า</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ปัสสาวะ</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>อุจจาระ</th>
                <th className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'rgba(126, 143, 164, 1)' }}>ผ้าอ้อม</th>
                <th className="text-center py-3 px-3 text-xs font-semibold" style={{ color: 'rgba(126, 143, 164, 1)' }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-6 px-4 text-center text-sm text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={12} className="py-6 px-4 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 px-4 text-center">
                    <div className="text-sm text-gray-600">ไม่พบข้อมูลสัญญาณชีพ</div>
                    <div className="text-xs text-gray-400 mt-1">ยังไม่มีรายการในช่วงเวลาหรือเงื่อนไขที่เลือก</div>
                  </td>
                </tr>
              ) : (
                pagedRecords.map((record) => {
                  const resident = residentById.get(record.resident_id);
                  const room = resident?.room_id ? roomById.get(resident.room_id) : undefined;
                  const residentName = resident
                    ? `${resident.first_name || ""} ${resident.last_name || ""}`.trim()
                    : record.resident_id;
                  const roomLabel = room ? `ห้อง ${room.room_number}` : "";

                  return (
                    <tr key={record.vital_sign_id} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                      <td className="py-3 px-3 text-xs sm:text-sm text-gray-900">
                        <span className="underline">{residentName}</span>
                        {roomLabel ? <p className="text-[11px] text-gray-500">{roomLabel}</p> : null}
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
                      <td className="py-3 px-3 text-center">
                        <button
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          onClick={() => router.push(`/emr/${record.resident_id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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
