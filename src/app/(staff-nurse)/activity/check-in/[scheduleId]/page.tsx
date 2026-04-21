"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Camera, Search } from "lucide-react";
import { BackButton } from "@/components/features/relative/back-button";
import { useToast } from "@/components/ui/toast";
import { residentService } from "@/services/resident.service";
import { activityAttendanceService } from "@/services/activity-attendance.service";
import type { ActivityAttendance } from "@/types/activity-attendance";
import type { ResidentOverviewItem } from "@/types/resident";
import {
  saveCheckInRecord,
  saveCheckInSession,
  type CheckInResident,
  type CheckInSession,
} from "@/components/features/activity/check-in/checkin-storage";
import { Dropdown } from "@/components/ui/dropdown";

const formatThaiDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const resolveCareType = (labels: string[] = []) => {
  const normalized = labels.map((label) => label.trim());
  const match = normalized.find((label) => label.includes("ช่วยเหลือตัวเอง") || label.includes("ติดเตียง"));
  if (match === "ช่วยเหลือตัวเองได้บางส่วน") return "ผู้สูงอายุช่วยเหลือตัวเองได้บางส่วน";
  if (match === "ติดเตียง") return "ผู้สูงอายุติดเตียง";
  return "ผู้สูงอายุทั่วไป";
};

export default function ActivityCheckInPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const scheduleId = String(params?.scheduleId || "");
  const activityTitle = searchParams.get("title") || "กิจกรรม";
  const activityDate = formatThaiDate(searchParams.get("date"));
  const activityTime = `${formatTime(searchParams.get("start"))}-${formatTime(searchParams.get("end"))}`;

  const [residents, setResidents] = useState<ResidentOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendance, setAttendance] = useState<ActivityAttendance | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [careFilter, setCareFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cameraSupported, setCameraSupported] = useState(false);
  const [showDeviceWarning, setShowDeviceWarning] = useState(false);

  useEffect(() => {
    setCameraSupported(Boolean(navigator?.mediaDevices?.getUserMedia));
  }, []);

  const loadResidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const pageSize = 100;
      let page = 1;
      let totalPages = 1;
      const items: ResidentOverviewItem[] = [];

      do {
        const response = await residentService.getOverview({
          status: "active",
          page,
          page_size: pageSize,
        });
        items.push(...(response.items || []));
        totalPages = response.pagination?.total_pages || 1;
        page += 1;
      } while (page <= totalPages);

      setResidents(items);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "โหลดรายชื่อไม่สำเร็จ",
        message: error?.message || "ไม่สามารถโหลดรายชื่อผู้สูงอายุได้",
      });
      setResidents([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadResidents();
  }, [loadResidents]);

  useEffect(() => {
    if (!scheduleId) return;
    let mounted = true;
    const loadAttendance = async () => {
      try {
        const att = await activityAttendanceService.getByScheduleId(scheduleId);
        if (!mounted) return;
        setAttendance(att || null);
        if (att) {
          setSelectedIds(new Set(att.selected_resident_ids || []));
          setIsReadOnly(!att.can_edit);
        }
      } catch (err) {
        // ignore; no attendance yet
      }
    };
    void loadAttendance();
    return () => { mounted = false; };
  }, [scheduleId]);

  const residentOptions = useMemo<CheckInResident[]>(() => {
    return residents
      .filter((item) => item.resident_id)
      .map((item) => ({
        id: item.resident_id,
        name: `${item.first_name} ${item.last_name}`.trim(),
        nickname: item.nickname || "-",
        roomNumber: item.room_number || "-",
        careType: resolveCareType(item.intake_labels || []),
      }));
  }, [residents]);

  const floors = useMemo(() => {
    const values = new Set(
      residents
        .map((item) => item.floor)
        .filter((value): value is number => typeof value === "number")
    );
    return Array.from(values).sort((a, b) => a - b);
  }, [residents]);

  // Options สำหรับ Dropdown ชั้น
  const floorOptions = useMemo(() => {
    const opts = [{ value: "all", label: "ทุกชั้น" }];
    floors.forEach((floor) => {
      opts.push({ value: String(floor), label: String(floor) });
    });
    return opts;
  }, [floors]);

  // Options สำหรับ Dropdown ประเภท
  const careTypeOptions = [
    { value: "all", label: "ทุกประเภท" },
    { value: "ผู้สูงอายุทั่วไป", label: "ผู้สูงอายุทั่วไป" },
    { value: "ผู้สูงอายุช่วยเหลือตัวเองได้บางส่วน", label: "ผู้สูงอายุช่วยเหลือตัวเองได้บางส่วน" },
    { value: "ผู้สูงอายุติดเตียง", label: "ผู้สูงอายุติดเตียง" },
  ];

  const filteredResidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return residentOptions.filter((resident) => {
      const matchesSearch = !query
        || resident.name.toLowerCase().includes(query)
        || (resident.nickname || "").toLowerCase().includes(query)
        || (resident.roomNumber || "").toLowerCase().includes(query);
      const matchesFloor = floorFilter === "all"
        || residents.find((item) => item.resident_id === resident.id)?.floor === Number(floorFilter);
      const matchesCare = careFilter === "all" || resident.careType === careFilter;
      return matchesSearch && matchesFloor && matchesCare;
    });
  }, [residentOptions, search, floorFilter, careFilter, residents]);

  const selectedCount = selectedIds.size;

  const toggleResident = (residentId: string) => {
    if (isReadOnly) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(residentId)) {
        next.delete(residentId);
      } else {
        next.add(residentId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (isReadOnly) return;
    if (selectedCount === filteredResidents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResidents.map((resident) => resident.id)));
    }
  };

  const buildSession = (): CheckInSession => {
    const selectedResidents = residentOptions.filter((resident) => selectedIds.has(resident.id));
    return {
      scheduleId,
      activityTitle,
      date: searchParams.get("date") || undefined,
      startTime: searchParams.get("start") || undefined,
      endTime: searchParams.get("end") || undefined,
      residents: selectedResidents,
      selectedIds: selectedResidents.map((resident) => resident.id),
      photos: {},
      rejectedIds: [],
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveOnly = () => {
    if (isReadOnly) {
      router.push(`/activity/check-in/${scheduleId}/review?view=history`);
      return;
    }
    if (selectedCount === 0) {
      showToast({ type: "error", title: "กรุณาเลือกรายชื่ออย่างน้อย 1 คน",message: ""  });
      return;
    }
    const session = buildSession();
    saveCheckInRecord(session);
    showToast({ type: "success", title: "บันทึกรายชื่อสำเร็จ",message: ""  });
    router.push("/activity");
  };

  const handleSaveAndCapture = () => {
    if (isReadOnly) {
      router.push(`/activity/check-in/${scheduleId}/review?view=history`);
      return;
    }
    if (selectedCount === 0) {
      showToast({ type: "error", title: "กรุณาเลือกรายชื่ออย่างน้อย 1 คน" ,message: "" });
      return;
    }
    if (!cameraSupported) {
      setShowDeviceWarning(true);
      showToast({
        type: "error",
        title: "อุปกรณ์ไม่รองรับการถ่ายภาพ",
        message: "กรุณาใช้โทรศัพท์มือถือหรือแท็บเล็ต เพื่อถ่ายภาพ ณ จุดจัดกิจกรรม",
      });
      return;
    }
    const session = buildSession();
    saveCheckInSession(session);
    router.push(`/activity/check-in/${scheduleId}/camera`);
  };

  return (
    <div className=" bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <BackButton text="ย้อนกลับ" href="/activity" />

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">
          {activityTitle} | {activityDate} | {activityTime}
        </h1>
      </div>

      {showDeviceWarning && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          กรุณาใช้โทรศัพท์มือถือหรือแท็บเล็ต เพื่อถ่ายภาพ ณ จุดจัดกิจกรรม
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filter bar - ปรับใช้ Dropdown และ responsive */}
        <div className="border-b border-slate-200 px-3 py-3">
          {/* Mobile layout */}
          <div className="flex flex-col gap-2 md:hidden">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 pl-8 pr-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="whitespace-nowrap">ชั้น</span>
                <Dropdown
                  options={floorOptions}
                  value={floorFilter}
                  onChange={setFloorFilter}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 flex-1 min-w-0">
                <span className="whitespace-nowrap">ประเภท</span>
                <Dropdown
                  options={careTypeOptions}
                  value={careFilter}
                  onChange={setCareFilter}
                  className="flex-1 min-w-0 max-w-40"
                />
              </div>
            </div>
          </div>

          {/* Tablet layout */}
          <div className="hidden md:flex lg:hidden md:flex-col md:gap-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหารายชื่อ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="whitespace-nowrap">ชั้น</span>
                <Dropdown
                  options={floorOptions}
                  value={floorFilter}
                  onChange={setFloorFilter}
                  className="w-24"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="whitespace-nowrap">ประเภท</span>
                <Dropdown
                  options={careTypeOptions}
                  value={careFilter}
                  onChange={setCareFilter}
                  className="w-42"
                />
              </div>
              <div className="ml-auto text-xs text-slate-500">
                เลือกแล้ว {selectedCount}/{residentOptions.length} คน
              </div>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center w-80">
                <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหารายชื่อ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="whitespace-nowrap">ชั้น</span>
                <Dropdown
                  options={floorOptions}
                  value={floorFilter}
                  onChange={setFloorFilter}
                  className="w-24"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="whitespace-nowrap">ประเภท</span>
                <Dropdown
                  options={careTypeOptions}
                  value={careFilter}
                  onChange={setCareFilter}
                  className="w-56"
                />
              </div>
            </div>
            <div className="text-xs text-slate-500">
              เลือกแล้ว {selectedCount}/{residentOptions.length} คน
            </div>
          </div>
        </div>

        {/* ตารางข้อมูล (ไม่เปลี่ยนแปลง) */}
        <div className="max-h-[53vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filteredResidents.length > 0 && selectedCount === filteredResidents.length}
                    onChange={toggleAll}
                    disabled={isReadOnly}
                  />
                </th>
                <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3">ชื่อเล่น</th>
                <th className="px-4 py-3">ห้อง</th>
                <th className="px-4 py-3">การช่วยเหลือตนเอง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    กำลังโหลดรายชื่อ...
                  </td>
                </tr>
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    ไม่พบรายชื่อที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredResidents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(resident.id)}
                        onChange={() => toggleResident(resident.id)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-800">{resident.name}</td>
                    <td className="px-4 py-3 text-slate-600">{resident.nickname || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{resident.roomNumber || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{resident.careType || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 ">
        {isReadOnly ? (
          <button
            type="button"
            onClick={() => router.push(`/activity/check-in/${scheduleId}/review?view=history`)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            ตรวจสอบรูป
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSaveOnly}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              บันทึกรายชื่อเท่านั้น (ไม่ถ่ายรูป)
            </button>
            <button
              type="button"
              onClick={handleSaveAndCapture}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
                cameraSupported ? "bg-[#0093EF] hover:bg-blue-500" : "bg-slate-300"
              }`}
              aria-disabled={!cameraSupported}
            >
              <Camera className="h-4 w-4" />
              บันทึกและเริ่มการถ่ายภาพ
            </button>
          </>
        )}
      </div>
    </div>
  );
}