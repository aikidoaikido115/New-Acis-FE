"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { AddWoundCareModal, WoundCareFormData } from "../modals/AddWoundCareModal";
import { NoteTimelineControls } from "../NoteTimelineControls";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { woundCareNoteService } from "@/services/wound-care-note.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import type { WoundCareNote } from "@/types/emr-notes";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";
import { filterAndSortByTimeline, formatBangkokDateKey, formatBangkokDateTime, type TimelineSortOrder } from "../note-timeline";

export function WoundCareTable() {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<WoundCareNote | null>(null);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<WoundCareNote[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;
  const selectedDateKey = useMemo(() => formatBangkokDateKey(selectedDate || new Date()), [selectedDate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [noteData, residentData, roomData] = await Promise.all([
        woundCareNoteService.getOverview(selectedDateKey),
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
  }, [selectedDateKey]);

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

  const handleSubmit = async (data: WoundCareFormData) => {
    if (!data.residentId) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "กรุณาเลือกผู้ป่วยก่อนบันทึก" });
      return;
    }

    try {
      const editingId = editingNote?.wound_care_note_id || editingNote?.id;
      if (editingId) {
        if (data.image) {
          const form = new FormData();
          form.append('location', data.location);
          form.append('wound_type', data.woundType);
          if (data.size) form.append('size', data.size);
          if (data.treatment) form.append('treatment', data.treatment);
          if (data.supplies) form.append('supplies', data.supplies);
          if (data.status) form.append('status', data.status);
          if (data.note) form.append('note', data.note);
          form.append('image', data.image);
          await woundCareNoteService.updateById(editingId, form as any);
        } else {
          await woundCareNoteService.updateById(editingId, {
            location: data.location,
            wound_type: data.woundType,
            size: data.size || undefined,
            treatment: data.treatment || undefined,
            supplies: data.supplies || undefined,
            status: data.status || undefined,
            note: data.note || undefined,
            image_url: editingNote?.image_url || undefined,
          });
        }
      } else {
        if (data.image) {
          const form = new FormData();
          form.append('resident_id', data.residentId);
          form.append('location', data.location);
          form.append('wound_type', data.woundType);
          if (data.size) form.append('size', data.size);
          if (data.treatment) form.append('treatment', data.treatment);
          if (data.supplies) form.append('supplies', data.supplies);
          if (data.status) form.append('status', data.status);
          if (data.note) form.append('note', data.note);
          form.append('file', data.image);
          await woundCareNoteService.create(form as any);
        } else {
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
        }
      }

      await loadData();
      handleModalClose();
      showToast({
        type: "success",
        title: editingId ? "แก้ไขสำเร็จ" : "บันทึกสำเร็จ",
        message: editingId ? "อัปเดตบันทึกทำแผลเรียบร้อยแล้ว" : "เพิ่มบันทึกทำแผลเรียบร้อยแล้ว",
      });
    } catch {
      showToast({
        type: "error",
        title: editingNote ? "แก้ไขไม่สำเร็จ" : "บันทึกไม่สำเร็จ",
        message: editingNote ? "ไม่สามารถแก้ไขบันทึกทำแผลได้" : "ไม่สามารถสร้างบันทึกทำแผลได้",
      });

      return;
    }
  };

  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: WoundCareNote) => {
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
      message: "ยืนยันการลบบันทึกทำแผลนี้?",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      tone: "danger",
    });

    if (!shouldDelete) {
      return;
    }

    try {
      await woundCareNoteService.deleteById(id);
      setNotes((prev) => prev.filter((item) => (item.wound_care_note_id || item.id) !== id));
      showToast({ type: "success", title: "ลบสำเร็จ", message: "ลบบันทึกทำแผลเรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "ลบไม่สำเร็จ", message: "ไม่สามารถลบบันทึกทำแผลได้" });
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
          showClearButton={false}
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
                <th className="text-left py-3 px-4 text-xs font-semibold w-28" style={{ color: 'rgba(126, 143, 164, 1)' }}>รูปภาพ</th>
                <th className="text-right py-3 px-4 text-xs font-semibold w-48" style={{ color: 'rgba(126, 143, 164, 1)' }}>จัดการ</th>
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
                  const by = note.created_by_staff_name || note.created_by_staff_id || "-";
                  const summary = [note.location, note.wound_type, note.status].filter(Boolean).join(" | ");
                  const createdAt = formatBangkokDateTime(note.created_at);

                  return (
                    <tr key={noteId} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                      <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 align-middle">
                        <span className="underline">{name}</span>
                        {roomText ? <p className="text-[11px] text-gray-500">{roomText}</p> : null}
                        <p className="text-[11px] text-gray-400 mt-1">บันทึกเมื่อ {createdAt}</p>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <p className="text-xs sm:text-sm text-gray-700">{summary || "-"}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{note.note || ""}</p>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        {note.image_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(note.image_url || null)}
                            className="rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="ดูรูปภาพทำแผลขนาดใหญ่"
                          >
                            <Image
                              src={note.image_url}
                              alt="wound"
                              width={40}
                              height={40}
                              unoptimized
                              className="h-10 w-10 rounded object-cover"
                            />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
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
                            aria-label="แก้ไขบันทึกทำแผล"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(noteId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            aria-label="ลบบันทึกทำแผล"
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

      <AddWoundCareModal
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
                location: editingNote.location || "",
                woundType: editingNote.wound_type || "",
                size: editingNote.size || "",
                treatment: editingNote.treatment || "",
                supplies: editingNote.supplies || "",
                status: editingNote.status || "",
                note: editingNote.note || "",
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

      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-100 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-200"
              aria-label="ปิดรูปภาพ"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <Image
                src={previewImageUrl}
                alt="wound preview"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      {confirmDialog}

    </div>
  );
}
