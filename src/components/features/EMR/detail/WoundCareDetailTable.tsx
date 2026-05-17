"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { AddWoundCareModal, WoundCareFormData } from "../modals/AddWoundCareModal";
import { NoteTimelineControls } from "../NoteTimelineControls";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { woundCareNoteService } from "@/services/wound-care-note.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { WoundCareNote } from "@/types/emr-notes";
import { filterAndSortByTimeline, formatBangkokDateKey, formatBangkokDateTime, type TimelineSortOrder } from "../note-timeline";

interface WoundCareDetailTableProps {
  patientId: string;
}

export function WoundCareDetailTable({ patientId }: WoundCareDetailTableProps) {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<WoundCareNote | null>(null);
  const [notes, setNotes] = useState<WoundCareNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>("newest");
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedDateKey = useMemo(() => formatBangkokDateKey(selectedDate || new Date()), [selectedDate]);

  useEffect(() => {
    const loadData = async () => {
      if (!patientId) {
        setNotes([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await woundCareNoteService.getByResidentAll(patientId, selectedDateKey);
        setNotes(data || []);
      } catch {
        setError("ไม่สามารถโหลดข้อมูลทำแผลได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [patientId, selectedDateKey]);

  const filteredNotes = useMemo(() => {
    return filterAndSortByTimeline(notes, selectedDate, sortOrder);
  }, [notes, selectedDate, sortOrder]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleSortOrderChange = (value: TimelineSortOrder) => {
    setSortOrder(value);
  };

  const handleSubmit = async (data: WoundCareFormData) => {
    try {
      const editingId = editingNote?.wound_care_note_id || editingNote?.id;
      if (editingId) {
        // If a new image file was provided, send multipart/form-data
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
          await woundCareNoteService.updateById(editingId, form);
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
          form.append('resident_id', patientId);
          form.append('location', data.location);
          form.append('wound_type', data.woundType);
          if (data.size) form.append('size', data.size);
          if (data.treatment) form.append('treatment', data.treatment);
          if (data.supplies) form.append('supplies', data.supplies);
          if (data.status) form.append('status', data.status);
          if (data.note) form.append('note', data.note);
          form.append('image', data.image);
          await woundCareNoteService.create(form);
        } else {
          await woundCareNoteService.create({
            resident_id: patientId,
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

      const refreshed = await woundCareNoteService.getByResidentAll(patientId, selectedDateKey);
      setNotes(refreshed || []);
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

        <button 
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">เพิ่มบันทึก</span>
        </button>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="border rounded-lg p-4 bg-white text-sm text-gray-500" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner />
            </div>
          </div>
        ) : error ? (
          <div className="border rounded-lg p-4 bg-white text-sm text-red-500" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
            {error}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="border rounded-lg p-4 bg-white text-slate-500" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-sm">ไม่พบข้อมูลทำแผล</div>
              <div className="text-xs mt-1">ลองเพิ่มข้อมูลใหม่อีกครั้ง</div>
            </div>
          </div>
        ) : (
          filteredNotes.map((item) => {
            const id = item.wound_care_note_id || item.id || "-";
            const createdAt = formatBangkokDateTime(item.created_at);
            const by = item.created_by_staff_name || item.created_by_staff_id || "-";
            return (
              <div key={id} className="border rounded-lg p-4 bg-white" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">{item.location} | {item.wound_type}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.note || item.treatment || "-"}</p>
                    <p className="text-[11px] text-gray-400 mb-2">บันทึกเมื่อ {createdAt}</p>
                    <p className="text-xs text-gray-500">
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
                        "-"
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1 sm:items-center sm:self-center">
                    <span className="text-[11px] font-medium text-gray-400">รูปภาพ</span>
                    {item.image_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImageUrl(item.image_url || null)}
                        className="rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="ดูรูปภาพทำแผลขนาดใหญ่"
                      >
                        <Image
                          src={item.image_url}
                          alt="wound"
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 rounded object-cover"
                        />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" onClick={() => handleOpenEditModal(item)}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" onClick={() => handleDelete(id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <AddWoundCareModal
        key={`${editingNote?.wound_care_note_id || editingNote?.id || "create"}-${isModalOpen ? "open" : "closed"}`}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
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
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
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
