"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import { authService } from "@/services/auth.service";
import { adaptResidentPayload, calculateAge } from "@/utils/resident-adapter";
import { useToast } from "@/components/ui/toast";
import type { ResidentFormState, CreateResidentRequest, Resident as ApiResident } from "@/types/resident";
import type { Resident } from "@/types/elder";
import type { Room } from "@/types/room";
import { ResidentFormModal } from "@/components/features/nurse/elder-info/ResidentFormModal";
import { RelativeViewModal } from "@/components/features/nurse/elder-info/RelativeViewModal";
import { ElderTableFilter } from "@/components/features/nurse/elder-info/info-table-filter";
import { ElderTable } from "@/components/features/nurse/elder-info/elder-table";
import { ElderTablePagination } from "@/components/features/nurse/pagination";

const ITEMS_PER_PAGE = 10;

const determineCareLevel = (adlScore?: number) => {
  if (adlScore === undefined) return "general";
  if (adlScore <= 5) return "bedridden";
  if (adlScore <= 11) return "partial";
  return "general";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543; // Convert to Buddhist year
  return `${day}/${month}/${year}`;
};

const transformResidentData = (apiResident: ApiResident): Resident => {
  const fullName = `${apiResident.first_name} ${apiResident.last_name}`;
  const careLevel = determineCareLevel(apiResident.adl_score);
  const isActive =
    !apiResident.expected_discharge_date || new Date(apiResident.expected_discharge_date) > new Date();

  const backendId = apiResident.id || (apiResident as any).resident_id || "";

  return {
    // keep backend id as-is to support non-numeric ids and resident_id alias
    id: backendId,
    name: fullName,
    nickname: apiResident.nickname || "-",
    room: apiResident.room_id || "",
    floor: apiResident.floor || 0,
    care: careLevel,
    admitted: formatDate(apiResident.admit_date),
    discharged: formatDate(apiResident.expected_discharge_date),
    active: isActive,
  };
};

export default function Page() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [editingInitialValues, setEditingInitialValues] = useState<ResidentFormState | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isRelativeViewModalOpen, setIsRelativeViewModalOpen] = useState(false);
  const [relativeViewResidentName, setRelativeViewResidentName] = useState<string | null>(null);

  // Data state
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedCareType, setSelectedCareType] = useState("all");
  const [showActive, setShowActive] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const mapResidentToFormState = (resident: ApiResident): ResidentFormState => {
    const toDateString = (value?: string) => (value ? value.split("T")[0] || value : "");

    return {
      status: resident.status || "",
      firstName: resident.first_name || "",
      lastName: resident.last_name || "",
      nickname: resident.nickname || "",
      gender: resident.gender || "",
      dateOfBirth: toDateString(resident.date_of_birth),
      idCardNumber: resident.id_card_number || "",
      purpose: resident.purpose || "",
      admitDate: toDateString(resident.admit_date),
      expectedDischargeDate: toDateString(resident.expected_discharge_date),
      roomId: resident.room_id || "",
      floor: resident.floor ? String(resident.floor) : "",
      profileImage: null,
      profileImagePreview: resident.profile_image || "",
      chronicDiseases: resident.chronic_diseases || "",
      chronicDiseasesNote: resident.chronic_diseases_note || "",
      medications: resident.medications || [],
      surgicalHistory: resident.surgical_history || "",
      drugAllergies: resident.drug_allergies || "",
      foodAllergies: resident.food_allergies || "",
      adlScore: resident.adl_score !== undefined && resident.adl_score !== null ? String(resident.adl_score) : "",
      careLevel: resident.care_level || "general",
      cprStatus: resident.cpr_status || "",
      emergencyHospital: resident.emergency_hospital || "",
      emergencyHospitalPhone: resident.emergency_hospital_phone || "",
      emergencyContacts: resident.emergency_contacts || [],
    };
  };

  // Fetch residents from API
  const fetchResidents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await residentService.getAll();
      const transformedData = data.map(transformResidentData);
      setAllResidents(transformedData);
    } catch (err: any) {
      // Enhanced error logging
      console.error("Failed to fetch residents:", {
        message: err?.message,
        status_code: err?.status_code,
        response: err?.response,
        fullError: err,
      });

      const statusCode = err?.status_code || err?.response?.status || 0;
      let message = "ไม่สามารถโหลดข้อมูลผู้สูงอายุได้";

      // เพิ่ม logic auto-refresh token เมื่อเจอ 401
      if (statusCode === 401 && authService.refreshToken) {
        try {
          await authService.refreshToken();
          // retry fetch
          const data = await residentService.getAll();
          const transformedData = data.map(transformResidentData);
          setAllResidents(transformedData);
          setError(null);
          return;
        } catch (refreshErr) {
          message = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง";
          showToast({ type: "error", title: "เซสชันหมดอายุ", message });
          router.push("/login");
          return;
        }
      }

      if (statusCode === 401) {
        message = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง";
        showToast({ type: "error", title: "เซสชันหมดอายุ", message });
        router.push("/login");
        return;
      } else if (statusCode === 0) {
        message = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ";
      } else if (statusCode === 500) {
        message = "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์";
      } else {
        message = err?.message || err?.response?.data?.message || message;
      }

      setError(message);
      showToast({ type: "error", title: "โหลดข้อมูลไม่สำเร็จ", message });
    } finally {
      setIsLoading(false);
    }
  }, [router, showToast]);

  // Fetch data on component mount
  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Fetch rooms for dropdown (room must exist in BE)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomService.getAll();
        setRooms(data || []);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    fetchRooms();
  }, []);

  // Convert care type to display text
  const getCareTypeDisplay = (careType: string) => {
    switch (careType) {
      case "general":
        return "ผู้สูงอายุทั่วไป";
      case "partial":
        return "ช่วยเหลือตัวเองได้บางส่วน";
      case "bedridden":
        return "ผู้สูงอายุติดเตียง";
      default:
        return careType;
    }
  };

  const roomNumberMap = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((room) => {
      const roomId = room.id || (room as any).room_id;
      if (roomId) map.set(roomId, room.room_number);
    });
    return map;
  }, [rooms]);

  const filteredResidents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allResidents.filter((resident) => {
      const matchesSearch =
        !normalizedSearch ||
        resident.name.toLowerCase().includes(normalizedSearch) ||
        resident.nickname.toLowerCase().includes(normalizedSearch);

      const matchesFloor = selectedFloor === "all" || resident.floor.toString() === selectedFloor;
      const matchesCareType = selectedCareType === "all" || resident.care === selectedCareType;
      const matchesActive = resident.active === showActive;

      return matchesSearch && matchesFloor && matchesCareType && matchesActive;
    });
  }, [allResidents, searchTerm, selectedFloor, selectedCareType, showActive]);

  // Paginate filtered results
  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredResidents.slice(startIndex, endIndex).map(resident => ({
      ...resident,
      care: getCareTypeDisplay(resident.care),
      room: roomNumberMap.get(resident.room) || resident.room || "-",
    }));
  }, [filteredResidents, currentPage, ITEMS_PER_PAGE, roomNumberMap]);

  // Pagination info
  const totalPages = Math.ceil(filteredResidents.length / ITEMS_PER_PAGE);
  const totalItems = filteredResidents.length;
  const startItem = filteredResidents.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  // Reset to first page when filters change
  const handleFilterChange = (filterFn: () => void) => {
    filterFn();
    setCurrentPage(1);
  };

  const buildCreatePayload = (formData: ResidentFormState): CreateResidentRequest => ({
    first_name: formData.firstName,
    last_name: formData.lastName,
    nickname: formData.nickname || undefined,
    gender: formData.gender,
    date_of_birth: formData.dateOfBirth,
    age: formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : undefined,
    id_card_number: formData.idCardNumber || undefined,
    purpose: formData.purpose || undefined,
    admit_date: formData.admitDate,
    expected_discharge_date: formData.expectedDischargeDate || undefined,
    room_id: formData.roomId || undefined,
    floor: formData.floor ? parseInt(formData.floor) : undefined,
    chronic_diseases: formData.chronicDiseases || undefined,
    chronic_diseases_note: formData.chronicDiseasesNote || undefined,
    medications: formData.medications.filter((m) => m.name.trim() !== ""),
    surgical_history: formData.surgicalHistory || undefined,
    drug_allergies: formData.drugAllergies || undefined,
    food_allergies: formData.foodAllergies || undefined,
    adl_score: formData.adlScore ? parseInt(formData.adlScore) : undefined,
    cpr_status: formData.cprStatus || undefined,
    emergency_hospital: formData.emergencyHospital || undefined,
    emergency_hospital_phone: formData.emergencyHospitalPhone || undefined,
    emergency_contacts: formData.emergencyContacts.filter((c) => c.name.trim() !== ""),
    care_level: formData.careLevel as "general" | "partial_assist" | "bedridden",
  });

  const handleResidentSubmit = async (formData: ResidentFormState) => {
    try {
      setIsSubmitting(true);

      const payload = adaptResidentPayload(buildCreatePayload(formData));

      if (modalMode === "edit" && editingResidentId) {
        await residentService.update(editingResidentId, payload as any);
        showToast({ type: "success", title: "บันทึกข้อมูลสำเร็จ", message: "แก้ไขแฟ้มผู้สูงอายุเรียบร้อย" });
      } else {
        await residentService.create(payload as any);
        showToast({ type: "success", title: "บันทึกข้อมูลสำเร็จ", message: "เพิ่มแฟ้มผู้สูงอายุเรียบร้อย" });
      }

      setIsAddModalOpen(false);
      setEditingResidentId(null);
      setEditingInitialValues(undefined);
      setModalMode("create");

      await fetchResidents();
    } catch (error: any) {
      console.error("Failed to save resident:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      showToast({ type: "error", title: "บันทึกข้อมูลล้มเหลว", message: errorMessage });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = async (id: string) => {
    try {
      setIsLoading(true);
      const resident = await residentService.getById(id);
      setEditingResidentId(id);
      setEditingInitialValues(mapResidentToFormState(resident));
      setModalMode("edit");
      setIsAddModalOpen(true);
    } catch (error) {
      console.error("Failed to load resident for edit:", error);
      // ถ้าโหลดไม่ได้ เปิดเป็นฟอร์มว่างแต่ยังคงโหมดแก้ไขและ id
      setEditingResidentId(id);
      setEditingInitialValues(undefined);
      setModalMode("edit");
      setIsAddModalOpen(true);
      alert("ไม่สามารถโหลดข้อมูลผู้สูงอายุได้ ขึ้นฟอร์มว่างให้กรอกใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRelative = (id: string) => {
    const resident = allResidents.find(r => r.id === id);
    const residentName = resident ? resident.name : "ไม่พบข้อมูล";
    setRelativeViewResidentName(residentName);
    setIsRelativeViewModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800">แฟ้มข้อมูลผู้สูงอายุ</h1>
          <button
            type="button"
            onClick={() => {
              setModalMode("create");
              setEditingResidentId(null);
              setEditingInitialValues(undefined);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0093EF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0080D0] active:bg-[#0070C0] transition"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:inline md:hidden">เพิ่มประวัติ</span>
            <span className="hidden md:inline">เพิ่มประวัติแรกเข้า</span>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ElderTableFilter
            searchTerm={searchTerm}
            onSearchChange={(value) => handleFilterChange(() => setSearchTerm(value))}
            selectedFloor={selectedFloor}
            onFloorChange={(value) => handleFilterChange(() => setSelectedFloor(value))}
            selectedCareType={selectedCareType}
            onCareTypeChange={(value) => handleFilterChange(() => setSelectedCareType(value))}
            showActive={showActive}
            onShowActiveToggle={() => handleFilterChange(() => setShowActive(!showActive))}
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0093EF] mb-4"></div>
              <div className="text-sm">กำลังโหลดข้อมูล...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <div className="text-sm mb-4">{error}</div>
              <button
                onClick={fetchResidents}
                className="px-4 py-2 bg-[#0093EF] text-white rounded-lg text-sm hover:bg-[#0080D0] transition"
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : (
            <>
              <ElderTable residents={paginatedResidents} onEdit={handleEditClick} onViewRelative={handleViewRelative} />

              {totalItems > 0 && (
                <ElderTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  startItem={startItem}
                  endItem={endItem}
                  onPageChange={setCurrentPage}
                />
              )}

              {totalItems === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</div>
                  <div className="text-xs mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Record Modal */}
      <ResidentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleResidentSubmit}
        isLoading={isSubmitting}
        rooms={rooms}
        initialValues={editingInitialValues}
        mode={modalMode}
      />

      {/* Relative View Modal */}
      <RelativeViewModal
        isOpen={isRelativeViewModalOpen}
        onClose={() => setIsRelativeViewModalOpen(false)}
        residentName={relativeViewResidentName}
      />
    </>
  );
}
