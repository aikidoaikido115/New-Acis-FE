"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

type CareLevelFilter = "all" | "general" | "partial_assist" | "bedridden";
type StatusFilter = "all" | "active" | "inactive";

export function IndividualView() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [selectedHelpLevel, setSelectedHelpLevel] = useState<CareLevelFilter>("all");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [residentData, roomData] = await Promise.all([
          residentService.getAll(),
          roomService.getAll(),
        ]);
        setResidents(residentData || []);
        setRooms(roomData || []);
      } catch {
        setError("ไม่สามารถโหลดข้อมูลผู้พักได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const roomById = useMemo(() => {
    return new Map(
      rooms.map((room) => {
        const id = room.room_id ?? room.id;
        return [id, room] as const;
      })
    );
  }, [rooms]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(rooms.map((room) => room.floor))).sort((a, b) => a - b);
    return uniqueFloors;
  }, [rooms]);

  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      const fullName = `${resident.first_name || ""} ${resident.last_name || ""}`.trim().toLowerCase();
      const nickname = (resident.nickname || "").toLowerCase();
      const matchesSearch =
        !searchTerm ||
        fullName.includes(searchTerm.toLowerCase()) ||
        nickname.includes(searchTerm.toLowerCase());

      const roomId = resident.room_id;
      const room = roomId ? roomById.get(roomId) : undefined;
      const matchesFloor = selectedFloor === "all" || String(room?.floor ?? "") === selectedFloor;

      const residentStatus = String(resident.status || "").toLowerCase();
      const matchesStatus = selectedStatus === "all" || residentStatus === selectedStatus;

      const careLevel = resident.resident_labels
        ?.map((label) => label.intake_label?.label_name || "")
        .find((labelName) => labelName.includes("ช่วยเหลือตัวเอง") || labelName === "ติดเตียง") || "";
      const careLevelKey = careLevel.includes("บางส่วน")
        ? "partial_assist"
        : careLevel.includes("ติดเตียง")
        ? "bedridden"
        : careLevel.includes("ทั้งหมด")
        ? "general"
        : "";
      const matchesCareLevel = selectedHelpLevel === "all" || careLevelKey === selectedHelpLevel;

      return matchesSearch && matchesFloor && matchesStatus && matchesCareLevel;
    });
  }, [residents, roomById, searchTerm, selectedFloor, selectedStatus, selectedHelpLevel]);

  const getCareLevelText = (resident: Resident) => {
    const labelName = resident.resident_labels
      ?.map((label) => label.intake_label?.label_name || "")
      .find((name) => name.includes("ช่วยเหลือตัวเอง") || name === "ติดเตียง")
      ?.trim();
    if (labelName === "ช่วยเหลือตัวเองได้ทั้งหมด") return "ช่วยเหลือตัวเองได้";
    if (labelName === "ช่วยเหลือตัวเองได้บางส่วน") return "ต้องการความช่วยเหลือ";
    if (labelName === "ติดเตียง") return "ติดเตียง";
    return "-";
  };

  const handleRowClick = (residentId: string) => {
    router.push(`/emr/${residentId}`);
  };

  return (
    <div>
      {/* Filters Row */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black placeholder:text-[rgba(204,204,204,1)]"
          />
        </div>

        <span className="text-body-small text-gray-600">ชั้น</span>

        {/* Floor Dropdown */}
        <Dropdown
          options={[
            { value: "all", label: "ทุกชั้น" },
            ...floorOptions.map((floor) => ({
              value: String(floor),
              label: `ชั้น ${floor}`,
            })),
          ]}
          value={selectedFloor}
          onChange={(value) => setSelectedFloor(value)}
          placeholder="เลือกชั้น"
        />

        <span className="text-body-small text-gray-600">ประเภท</span>

        {/* Help Level Dropdown */}
        <Dropdown
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "general", label: "ช่วยเหลือตัวเองได้" },
            { value: "partial_assist", label: "ต้องการความช่วยเหลือ" },
            { value: "bedridden", label: "ติดเตียง" },
          ]}
          value={selectedHelpLevel}
          onChange={(value) => setSelectedHelpLevel(value as CareLevelFilter)}
          placeholder="เลือก"
        />

        <span className="text-body-small text-gray-600">สถานะ</span>

        {/* Status Dropdown */}
        <Dropdown
          options={[
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "ใช้งาน" },
            { value: "inactive", label: "ไม่ใช้งาน" },
          ]}
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value as StatusFilter)}
          placeholder="เลือก"
        />
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: '#000' }}>ชื่อ-นามสกุล</th>
                <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: '#000' }}>ชื่อเล่น</th>
                <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: '#000' }}>ห้อง</th>
                <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: '#000' }}>ประเภท</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center">
                    <div className="text-sm text-gray-600">ไม่พบข้อมูลผู้พัก</div>
                    <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองชั้นและสถานะ</div>
                  </td>
                </tr>
              ) : (
                filteredResidents.map((resident) => {
                  const residentId = resident.resident_id || resident.id;
                  const room = resident.room_id ? roomById.get(resident.room_id) : undefined;
                  const roomDisplay = room ? `${room.room_number} (ชั้น ${room.floor})` : "-";
                  const fullName = `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || "-";

                  return (
                  <tr
                    key={residentId}
                    onClick={() => handleRowClick(residentId)}
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}
                  >
                    <td className="py-3 px-4 text-xs sm:text-sm" style={{ color: '#000' }}>{fullName}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm" style={{ color: '#000' }}>{resident.nickname || "-"}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm" style={{ color: '#000' }}>{roomDisplay}</td>
                    <td className="py-3 px-4 text-xs sm:text-sm" style={{ color: '#000' }}>{getCareLevelText(resident)}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
