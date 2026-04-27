"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { AddNurseNoteModal, NurseNoteFormData } from "../modals/AddNurseNoteModal";
import { NoteTimelineControls } from "../NoteTimelineControls";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { nurseNoteService } from "@/services/nurse-note.service";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import type { NurseNote } from "@/types/emr-notes";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import { filterAndSortByTimeline, formatBangkokDateTime, type TimelineSortOrder } from "../note-timeline";

export function NurseNoteTable() {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NurseNote | null>(null);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [notes, setNotes] = useState<NurseNote[]>([]);
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
        nurseNoteService.getOverview(),
        residentService.getAll(),
        roomService.getAll(),
      ]);
      setNotes(noteData || []);
      setResidents(residentData || []);
      setRooms(roomData || []);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลบันทึกพยาบาลได้");
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

  const filteredNotes = useMemo(() => {
    return filterAndSortByTimeline(notes, selectedDate, sortOrder);
  }, [notes, selectedDate, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedNotes = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredNotes.slice(start, start + pageSize);
  }, [filteredNotes, safeCurrentPage]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (value: TimelineSortOrder) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const handleSubmit = async (data: NurseNoteFormData) => {
    if (!data.residentId) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "กรุณาเลือกผู้ป่วยก่อนบันทึก" });
      return;
    }

    try {
      const editingId = editingNote?.nurse_note_id || editingNote?.id;

      if (editingId) {
        await nurseNoteService.updateById(editingId, {
          category: data.category,
          content: data.content,
          priority: data.priority,
          send_note: data.sendNote,
        });
      } else {
        await nurseNoteService.create({
          resident_id: data.residentId,
          category: data.category,
          content: data.content,
          priority: data.priority,
          send_note: data.sendNote,
        });
      }

      await loadData();
      handleModalClose();
      showToast({
        type: "success",
        title: editingId ? "แก้ไขสำเร็จ" : "บันทึกสำเร็จ",
        message: editingId ? "อัปเดตบันทึกพยาบาลเรียบร้อยแล้ว" : "เพิ่มบันทึกพยาบาลเรียบร้อยแล้ว",
      });
    } catch {
      showToast({
        type: "error",
        title: editingNote ? "แก้ไขไม่สำเร็จ" : "บันทึกไม่สำเร็จ",
        message: editingNote ? "ไม่สามารถแก้ไขบันทึกพยาบาลได้" : "ไม่สามารถสร้างบันทึกพยาบาลได้",
      });
    }
  };

  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: NurseNote) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm({
      title: "ยืนยันการลบ",
      message: "ยืนยันการลบบันทึกพยาบาลนี้?",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      tone: "danger",
    });

    if (!shouldDelete) {
      return;
    }

    try {
      await nurseNoteService.deleteById(id);
      setNotes((prev) => prev.filter((item) => (item.nurse_note_id || item.id) !== id));
      showToast({ type: "success", title: "ลบสำเร็จ", message: "ลบบันทึกพยาบาลเรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "ลบไม่สำเร็จ", message: "ไม่สามารถลบบันทึกพยาบาลได้" });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NoteTimelineControls
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
        />

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onClick={handleOpenCreateModal}>
          <Plus className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">เพิ่มบันทึก</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-4 text-xs font-semibold w-48" style={{ color: 'rgba(126, 143, 164, 1)' }}>ชื่อ/ห้อง</th>
                <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: 'rgba(126, 143, 164, 1)' }}>บันทึก</th>
                <th className="text-right py-3 px-4 text-xs font-semibold w-48" style={{ color: 'rgba(126, 143, 164, 1)' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-6 px-4 text-center text-sm text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="py-6 px-4 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : pagedNotes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 px-4 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-sm">ไม่พบข้อมูลบันทึกพยาบาล</div>
                      <div className="text-xs mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</div>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedNotes.map((note) => {
                  const noteId = note.nurse_note_id || note.id || "-";
                  const resident = residentById.get(note.resident_id);
                  const room = resident?.room_id ? roomById.get(resident.room_id) : undefined;
                  const name = resident
                    ? `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || note.resident_id
                    : note.resident_id;
                  const roomText = room ? `ห้อง ${room.room_number}` : "";
                  const by = note.created_by_staff_name || note.created_by_staff_id || "-";
                  const createdAt = formatBangkokDateTime(note.created_at);

                  return (
                    <tr key={noteId} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                      <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 align-middle">
                        <span className="underline">{name}</span>
                        {roomText ? <p className="text-[11px] text-gray-500">{roomText}</p> : null}
                        <p className="text-[11px] text-gray-400 mt-1">บันทึกเมื่อ {createdAt}</p>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <p className="text-xs sm:text-sm text-gray-700">{note.content || "-"}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                          <span>{note.category || "-"}</span>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              note.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {note.priority === "urgent" ? "เร่งด่วน" : "เฝ้าระวัง"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                          <span className="text-xs sm:text-sm text-gray-400">
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
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(note)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            aria-label="แก้ไขบันทึกพยาบาล"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(noteId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            aria-label="ลบบันทึกพยาบาล"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
          currentPage={safeCurrentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

      <AddNurseNoteModal
        key={`${editingNote?.nurse_note_id || editingNote?.id || "create"}-${isModalOpen ? "open" : "closed"}`}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        residents={residents}
        rooms={rooms}
        showResidentPicker
        mode={editingNote ? "edit" : "create"}
        initialData={
          editingNote
            ? {
                residentId: editingNote.resident_id,
                category: editingNote.category || "",
                content: editingNote.content || "",
                priority: editingNote.priority === "urgent" ? "urgent" : "normal",
                sendNote: editingNote.send_note,
              }
            : undefined
        }
      />

      {activeContactName ? (
        <ContactInformationModal
          contact={resolveContactInfo(activeContactName)}
          onClose={() => setActiveContactName(null)}
        />
      ) : null}

      {confirmDialog}

    </div>
  );
}
