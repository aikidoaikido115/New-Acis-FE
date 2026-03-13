"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AddNurseNoteModal, NurseNoteFormData } from "../modals/AddNurseNoteModal";
import { mockNurseNotesDetail } from "../emr.mock";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";

interface NurseNoteDetailTableProps {
  patientId: string;
}

export function NurseNoteDetailTable({ patientId }: NurseNoteDetailTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState(mockNurseNotesDetail);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);

  const handleSubmit = (data: NurseNoteFormData) => {
    // TODO: Send data to backend API
    console.log("New nurse note:", data);
    
    // Add to local state (temporary until API integration)
    const newNote = {
      id: notes.length + 1,
      date: data.date,
      note: data.content,
      by: "ผู้ใช้ปัจจุบัน" // TODO: Get from auth context
    };
    setNotes([...notes, newNote]);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">เพิ่มบันทึก</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4 bg-white" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">{note.note}</p>
                  <p className="text-xs text-gray-500">
                    โดย{" "}
                    <button
                      type="button"
                      onClick={() => setActiveContactName(note.by)}
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      {note.by}
                    </button>
                  </p>
                </div>
                {note.note && (
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Modal */}
      <AddNurseNoteModal
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
    </div>
  );
}
