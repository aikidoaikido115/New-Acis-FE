"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { AddRelativeNoteModal, RelativeNoteFormData } from "../modals/AddRelativeNoteModal";
import { NoteTimelineControls } from "../NoteTimelineControls";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { relativeNoteService } from "@/services/relative-note.service";
import type { RelativeNote } from "@/types/emr-notes";
import { filterAndSortByTimeline, formatBangkokDateKey, formatBangkokDateTime, type TimelineSortOrder } from "../note-timeline";

interface RelativeNoteDetailTableProps {
  patientId: string;
}

export function RelativeNoteDetailTable({ patientId }: RelativeNoteDetailTableProps) {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<RelativeNote | null>(null);
  const [notes, setNotes] = useState<RelativeNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>("newest");
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
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
        const data = await relativeNoteService.getByResidentAll(patientId, selectedDateKey);
        setNotes(data || []);
      } catch {
        setError("ไม่สามารถโหลดโน้ตญาติได้");
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

  const handleSubmit = async (data: RelativeNoteFormData) => {
    try {
      const editingId = editingNote?.relative_note_id || editingNote?.id;

      if (editingId) {
        await relativeNoteService.updateById(editingId, {
          content: data.content,
          send_note: data.sendNote,
        });
      } else {
        await relativeNoteService.create({
          resident_id: patientId,
          content: data.content,
          send_note: data.sendNote,
        });
      }

      const refreshed = await relativeNoteService.getByResidentAll(patientId, selectedDateKey);
      setNotes(refreshed || []);
      handleModalClose();
      showToast({
        type: "success",
        title: editingId ? "แก้ไขสำเร็จ" : "บันทึกสำเร็จ",
        message: editingId ? "อัปเดตโน้ตญาติเรียบร้อยแล้ว" : "เพิ่มโน้ตญาติเรียบร้อยแล้ว",
      });
    } catch {
      showToast({
        type: "error",
        title: editingNote ? "แก้ไขไม่สำเร็จ" : "บันทึกไม่สำเร็จ",
        message: editingNote ? "ไม่สามารถแก้ไขโน้ตญาติได้" : "ไม่สามารถสร้างโน้ตญาติได้",
      });
    }
  };

  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: RelativeNote) => {
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
      message: "ยืนยันการลบโน้ตญาตินี้?",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      tone: "danger",
    });
    if (!shouldDelete) {
      return;
    }
    try {
      await relativeNoteService.deleteById(id);
      setNotes((prev) => prev.filter((item) => (item.relative_note_id || item.id) !== id));
      showToast({ type: "success", title: "ลบสำเร็จ", message: "ลบโน้ตญาติเรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "ลบไม่สำเร็จ", message: "ไม่สามารถลบโน้ตญาติได้" });
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={handleOpenCreateModal}
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">เพิ่มบันทึก</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="border rounded-lg p-4 bg-white text-sm text-gray-500" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
            กำลังโหลดข้อมูล...
          </div>
        ) : error ? (
          <div className="border rounded-lg p-4 bg-white text-sm text-red-500" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
            {error}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="border rounded-lg p-4 bg-white text-slate-500" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-sm">ไม่พบบันทึกสำหรับญาติ</div>
              <div className="text-xs mt-1">ลองเพิ่มข้อมูลใหม่อีกครั้ง</div>
            </div>
          </div>
        ) : null}

        {filteredNotes.map((item) => {
          const id = item.relative_note_id || item.id || "-";
          const createdAt = formatBangkokDateTime(item.created_at);
          const by = item.created_by_staff_name || item.created_by_staff_id || "-";
          return (
            <div key={id} className="border rounded-lg p-4 bg-white" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">{item.relation}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.content}</p>
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
        })}
      </div>

      <AddRelativeNoteModal
        key={`${editingNote?.relative_note_id || editingNote?.id || "create"}-${isModalOpen ? "open" : "closed"}`}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        mode={editingNote ? "edit" : "create"}
        initialData={
          editingNote
            ? {
                residentId: editingNote.resident_id,
                content: editingNote.content || "",
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
