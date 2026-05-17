"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown";
import { SkeletonTable } from "@/components/ui/skeleton";
import { isResidentActive, residentService } from "@/services/resident.service";
import { intakeService } from "@/services/intake.service";
import { roomService } from "@/services/room.service";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import type { IntakeLabel, ResidentLabel } from "@/types/intake";



export function IndividualView() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  
  const [selectedLabelId, setSelectedLabelId] = useState("all");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [intakeLabels, setIntakeLabels] = useState<IntakeLabel[]>([]);
  const [residentLabelsById, setResidentLabelsById] = useState<Record<string, ResidentLabel[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [residentData, roomData, labelData] = await Promise.all([
          residentService.getAll(),
          roomService.getAll(),
          intakeService.getAllLabels(),
        ]);
        const activeResidents = (residentData || []).filter(isResidentActive);
        setResidents(activeResidents);
        setRooms(roomData || []);
        setIntakeLabels(labelData || []);

        const residentLabelEntries = await Promise.all(
          activeResidents.map(async (resident) => {
            const residentId = resident.resident_id || resident.id;
            if (!residentId) return [residentId, []] as const;
            try {
              const labels = await intakeService.getLabelsByResident(residentId);
              return [residentId, labels || []] as const;
            } catch {
              return [residentId, resident.resident_labels || []] as const;
            }
          })
        );
        setResidentLabelsById(Object.fromEntries(residentLabelEntries.filter(([id]) => Boolean(id))));
      } catch {
        setError("ไม่สามารถโหลดข้อมูลผู้พักได้");
        setIntakeLabels([]);
        setResidentLabelsById({});
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

  const careOptions = useMemo(
    () => [
      { value: "all", label: "ทั้งหมด" },
      ...intakeLabels.map((label) => ({
        value: String(label.label_id),
        label: label.label_name,
      })),
    ],
    [intakeLabels]
  );

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

      const residentId = resident.resident_id || resident.id;
      const residentLabels = residentId ? residentLabelsById[residentId] : resident.resident_labels;

      const matchesCareLevel =
        selectedLabelId === "all" ||
        (residentLabels || []).some((label) => {
          const labelId = label.label_id || label.intake_label?.label_id;
          return String(labelId) === selectedLabelId;
        });

      return matchesSearch && matchesFloor && matchesCareLevel;
    });
  }, [residents, roomById, searchTerm, selectedFloor, selectedLabelId, residentLabelsById]);

  const getCareLevelText = (resident: Resident) => {
    const intakeById = new Map(intakeLabels.map((l) => [String(l.label_id), l.label_name] as const));
    const residentId = resident.resident_id || resident.id;
    const residentLabels = residentId ? residentLabelsById[residentId] : resident.resident_labels;

    const labelNames = (residentLabels || [])
        .map((label) => {
          const id = label.label_id || label.intake_label?.label_id;
          return id ? intakeById.get(String(id)) || label.intake_label?.label_name : undefined;
        })
        .filter(Boolean) as string[];

      if (labelNames.some((n) => n.includes("ติดเตียง"))) return "ติดเตียง";

    const selfLabels = labelNames.filter((n) => n.includes("ช่วยเหลือตัวเอง"));
    if (selfLabels.some((n) => n.includes("ทั้งหมด"))) return "ช่วยเหลือตัวเองได้";
    if (selfLabels.some((n) => n.includes("บางส่วน"))) return "ต้องการความช่วยเหลือ";
    if (selfLabels.length > 0) return "ช่วยเหลือตัวเองได้";

    return labelNames[0] || "-";
  };

  const handleRowClick = (residentId: string) => {
    router.push(`/emr/${residentId}`);
  };

  return (
    // 1. ใส่สูตรขังกรอบหน้าจอขั้นสุด
    <div className="grid grid-cols-1 w-full max-w-full overflow-x-hidden min-w-0">
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 w-full min-w-0">
        
        {/* แถวแรกบนจอมือถือ: Search Input */}
        <div className="relative w-full md:flex-1 md:max-w-md min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs sm:text-body-small text-black placeholder:text-gray-400 min-w-0 transition-colors shadow-sm"
            />
        </div>

        {/* แถวสองบนจอมือถือ: ชั้น และ ประเภท (ใช้ grid แบ่ง 50/50 ไม่ให้ดันจอ) */}
        <div className="grid grid-cols-2 md:flex md:flex-row md:items-center gap-3 w-full md:w-auto shrink-0 min-w-0">
          <div className="flex flex-row items-center gap-2 min-w-0">
            <span className="text-xs sm:text-body-small text-gray-600 shrink-0">ชั้น</span>
            <div className="flex-1 md:w-32 min-w-0">
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
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 min-w-0">
            <span className="text-xs sm:text-body-small text-gray-600 shrink-0">ประเภท</span>
            <div className="flex-1 md:w-40 min-w-0">
              <Dropdown
                options={careOptions}
                value={selectedLabelId}
                onChange={(value) => setSelectedLabelId(value)}
                placeholder="เลือก"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Data Table */}
      {isLoading ? (
        <SkeletonTable columns={4} rows={6} />
      ) : (
        // 2. ล็อคตารางด้วย max-w-[calc(100vw-24px)] รักษาระยะขอบจอมือถือ
        <div className="w-full max-w-[calc(100vw-24px)] md:max-w-full min-w-0 overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
          <div className="w-full overflow-x-auto">
            {/* บังคับ min-w-[500px] เพื่อให้ตารางเลื่อนได้เฉพาะในกรอบ */}
            <table className="w-full min-w-[500px]">
              <thead>
                <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                  <th className="text-left py-3 px-4 text-xs font-semibold whitespace-nowrap" style={{ color: '#000' }}>ชื่อ-นามสกุล</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold whitespace-nowrap" style={{ color: '#000' }}>ชื่อเล่น</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold whitespace-nowrap" style={{ color: '#000' }}>ห้อง</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold whitespace-nowrap" style={{ color: '#000' }}>ประเภท</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center text-sm text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredResidents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-4 text-center">
                      <div className="text-sm text-gray-600">ไม่พบข้อมูลผู้พักที่อยู่ในศูนย์</div>
                      <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองชั้น</div>
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
                        <td className="py-3 px-4 text-xs sm:text-sm whitespace-nowrap" style={{ color: '#000' }}>{fullName}</td>
                        <td className="py-3 px-4 text-xs sm:text-sm whitespace-nowrap" style={{ color: '#000' }}>{resident.nickname || "-"}</td>
                        <td className="py-3 px-4 text-xs sm:text-sm whitespace-nowrap" style={{ color: '#000' }}>{roomDisplay}</td>
                        <td className="py-3 px-4 text-xs sm:text-sm whitespace-nowrap" style={{ color: '#000' }}>{getCareLevelText(resident)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}