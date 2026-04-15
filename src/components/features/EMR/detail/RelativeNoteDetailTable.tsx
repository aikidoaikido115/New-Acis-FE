"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { AddRelativeNoteModal, RelativeNoteFormData } from "../modals/AddRelativeNoteModal";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { relativeNoteService } from "@/services/relative-note.service";
import type { RelativeNote } from "@/types/emr-notes";

interface RelativeNoteDetailTableProps {
  patientId: string;
}

export function RelativeNoteDetailTable({ patientId }: RelativeNoteDetailTableProps) {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState<RelativeNote[]>([]);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = await relativeNoteService.getByResidentAll(patientId);
        setNotes(data || []);
      } catch {
        setError("ไม่สามารถโหลดโน้ตญาติได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [patientId]);

  const handleSubmit = async (data: RelativeNoteFormData) => {
    try {
      await relativeNoteService.create({
        resident_id: patientId,
        relation: data.relation,
        content: data.content,
        send_note: data.sendNote,
      });
      const refreshed = await relativeNoteService.getByResidentAll(patientId);
      setNotes(refreshed || []);
      setIsModalOpen(false);
      showToast({ type: "success", title: "บันทึกสำเร็จ", message: "เพิ่มโน้ตญาติเรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "บันทึกไม่สำเร็จ", message: "ไม่สามารถสร้างโน้ตญาติได้" });
    }
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

  const handleEdit = async (item: RelativeNote) => {
    const id = item.relative_note_id || item.id;
    if (!id) {
      return;
    }

    const nextContent = window.prompt("แก้ไขเนื้อหาโน้ตญาติ", item.content || "");
    if (nextContent === null || !nextContent.trim()) {
      return;
    }

    try {
      const updated = await relativeNoteService.updateById(id, {
        relation: item.relation,
        content: nextContent.trim(),
        send_note: item.send_note,
      });
      setNotes((prev) => prev.map((row) => ((row.relative_note_id || row.id) === id ? updated : row)));
      showToast({ type: "success", title: "บันทึกสำเร็จ", message: "แก้ไขโน้ตญาติเรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "แก้ไขไม่สำเร็จ", message: "ไม่สามารถแก้ไขโน้ตญาติได้" });
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => setIsModalOpen(true)}
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
        ) : notes.length === 0 ? (
          <div className="border rounded-lg p-4 bg-white text-slate-500" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-sm">ไม่พบโน้ตญาติ</div>
              <div className="text-xs mt-1">ลองเพิ่มข้อมูลใหม่อีกครั้ง</div>
            </div>
          </div>
        ) : null}

        {notes.map((item) => {
          const id = item.relative_note_id || item.id || "-";
          return (
            <div key={id} className="border rounded-lg p-4 bg-white" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">{item.relation}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.content}</p>
                  <p className="text-xs text-gray-500">
                    โดย{" "}
                    {item.created_by_staff_id ? (
                      <button
                        type="button"
                        onClick={() => setActiveContactName(item.created_by_staff_id || null)}
                        className="text-blue-600 underline hover:text-blue-700"
                      >
                        {item.created_by_staff_id}
                      </button>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" onClick={() => handleEdit(item)}>
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
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
