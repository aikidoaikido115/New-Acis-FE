"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { mockRelativeNotesDetail as mockRelativeNotes } from "../emr.mock";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";

interface RelativeNoteDetailTableProps {
  patientId: string;
}

export function RelativeNoteDetailTable({ patientId }: RelativeNoteDetailTableProps) {
  const [activeContactName, setActiveContactName] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">เพิ่มบันทึก</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {mockRelativeNotes.map((note) => (
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

      {activeContactName ? (
        <ContactInformationModal
          contact={resolveContactInfo(activeContactName)}
          onClose={() => setActiveContactName(null)}
        />
      ) : null}
    </div>
  );
}