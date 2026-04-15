"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { AddWoundCareModal, WoundCareFormData } from "../modals/AddWoundCareModal";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { woundCareNoteService } from "@/services/wound-care-note.service";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import type { WoundCareNote } from "@/types/emr-notes";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

export function WoundCareTable() {
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [notes, setNotes] = useState<WoundCareNote[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [noteData, residentData, roomData] = await Promise.all([
        woundCareNoteService.getOverview(),
        residentService.getAll(),
        roomService.getAll(),
      ]);
      setNotes(noteData || []);
      setResidents(residentData || []);
      setRooms(roomData || []);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลทำแผลได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  const totalPages = Math.max(1, Math.ceil(notes.length / pageSize));
  const pagedNotes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return notes.slice(start, start + pageSize);
  }, [notes, currentPage]);

  const handleSubmit = async (data: WoundCareFormData) => {
    if (!data.residentId) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "กรุณาเลือกผู้ป่วยก่อนบันทึก" });
      return;
    }

    try {
      await woundCareNoteService.create({
        resident_id: data.residentId,
        location: data.location,
        wound_type: data.woundType,
        size: data.size || undefined,
        treatment: data.treatment || undefined,
        supplies: data.supplies || undefined,
        status: data.status || undefined,
        note: data.note || undefined,
      });
      await loadData();
      setIsModalOpen(false);
      showToast({ type: "success", title: "บันทึกสำเร็จ", message: "เพิ่มบันทึกทำแผลเรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "บันทึกไม่สำเร็จ", message: "ไม่สามารถสร้างบันทึกทำแผลได้" });
      
      return; 
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Add Button Section */}
      <div>
        <div className="flex items-center justify-end">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">เพิ่มบันทึก</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-4 text-xs font-semibold w-48" style={{ color: 'rgba(126, 143, 164, 1)' }}>ชื่อ/ห้อง</th>
                <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: 'rgba(126, 143, 164, 1)' }}>บันทึก</th>
                <th className="text-left py-3 px-4 text-xs font-semibold w-32" style={{ color: 'rgba(126, 143, 164, 1)' }}>รูปภาพ</th>
                <th className="text-right py-3 px-4 text-xs font-semibold w-48" style={{ color: 'rgba(126, 143, 164, 1)' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-sm text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : pagedNotes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-sm">ไม่พบข้อมูลทำแผล</div>
                      <div className="text-xs mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</div>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedNotes.map((note) => {
                  const noteId = note.wound_care_note_id || note.id || "-";
                  const resident = residentById.get(note.resident_id);
                  const room = resident?.room_id ? roomById.get(resident.room_id) : undefined;
                  const name = resident
                    ? `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || note.resident_id
                    : note.resident_id;
                  const roomText = room ? `ห้อง ${room.room_number}` : "";
                  const by = note.created_by_staff_id || "-";
                  const summary = [note.location, note.wound_type, note.status].filter(Boolean).join(" | ");

                  return (
                    <tr key={noteId} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                      <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 align-middle">
                        <span className="underline">{name}</span>
                        {roomText ? <p className="text-[11px] text-gray-500">{roomText}</p> : null}
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <p className="text-xs sm:text-sm text-gray-700">{summary || "-"}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{note.note || ""}</p>
                      </td>
                      <td className="py-4 px-4 align-middle text-xs text-gray-400">{note.image_url ? "มี" : "-"}</td>
                      <td className="py-4 px-4 align-middle text-right text-xs sm:text-sm text-gray-500">
                        โดย{" "}
                        {by !== "-" ? (
                          <button
                            type="button"
                            onClick={() => setActiveContactName(by)}
                            className="text-blue-600 underline hover:text-blue-700"
                          >
                            {by}
                          </button>
                        ) : (
                          by
                        )}
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

      <AddWoundCareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        residents={residents}
        rooms={rooms}
        showResidentPicker
      />

      {activeContactName ? (
        <ContactInformationModal
          contact={resolveContactInfo(activeContactName)}
          onClose={() => setActiveContactName(null)}
        />
      ) : null}

    </div>
  );
}
