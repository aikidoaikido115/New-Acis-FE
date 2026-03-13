"use client";

import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { RoutineMedication } from "../medical.mock";
import { AddMedicationModal, EditMedicationModal, DeleteMedicationModal } from "../modals";

interface RoutineMedsTableProps {
  medications: RoutineMedication[];
  onAddMed: () => void;
  onEditMed: (medId: number) => void;
  onDeleteMed: (medId: number) => void;
  patientName?: string;
  patientRoom?: string;
}

export function RoutineMedsTable({ 
  medications, 
  onAddMed, 
  onEditMed, 
  onDeleteMed,
  patientName = "สมชาย ศรีบุญญมเมือง",
  patientRoom = "ห้อง 112 ชั้น 2"
}: RoutineMedsTableProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<RoutineMedication | null>(null);

  const handleEditClick = (med: RoutineMedication) => {
    setSelectedMedication(med);
    setShowEditModal(true);
  };

  const handleDeleteClick = (med: RoutineMedication) => {
    setSelectedMedication(med);
    setShowDeleteModal(true);
  };

  return (
    <>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ชื่อยา</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">โดส</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ความถี่/วัน</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">หมายเหตุ</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med) => (
              <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors align-middle">
                <td className="py-3 px-4 text-sm text-gray-700">{med.name}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{med.dose}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{med.frequency}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{med.note}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(med)}
                      className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                      title="แก้ไข"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(med)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Medication Modal */}
      <AddMedicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => {
          console.log("Add medication:", data);
          onAddMed();
        }}
      />

      {/* Edit Medication Modal */}
      {selectedMedication && (
        <EditMedicationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMedication(null);
          }}
          onSubmit={(data) => {
            console.log("Edit medication:", data);
            onEditMed(selectedMedication.id);
          }}
          medication={selectedMedication}
          patientName={patientName}
          patientRoom={patientRoom}
        />
      )}

      {/* Delete Medication Modal */}
      {selectedMedication && (
        <DeleteMedicationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedMedication(null);
          }}
          onSubmit={() => {
            console.log("Delete medication:", selectedMedication.id);
            onDeleteMed(selectedMedication.id);
          }}
          medication={selectedMedication}
          patientName={patientName}
          patientRoom={patientRoom}
        />
      )}
    </>
  );
}
