"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { RoutineMedication } from "../medical.types";
import { AddMedicationModal, DeleteMedicationModal, EditMedicationModal } from "../modals";
import type { EditMedicationFormData } from "../modals/EditMedicationModal";

interface RoutineMedsTableProps {
  medications: RoutineMedication[];
  onAddMed: () => void;
  onEditMed: (medication: RoutineMedication, data: EditMedicationFormData) => void;
  onDeleteMed: (medId: string) => void;
  patientName?: string;
  patientRoom?: string;
  emptyMessage?: string;
}

export function RoutineMedsTable({ 
  medications, 
  onAddMed, 
  onEditMed, 
  onDeleteMed,
  patientName = "สมชาย ศรีบุญญมเมือง",
  patientRoom = "ห้อง 112 ชั้น 2",
  emptyMessage = "ไม่พบรายการยา"
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
      <div className="overflow-x-auto rounded-2xl bg-[#E9EDF1] border border-[#D6DCE2]">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#CFD5DC]">
              <th className="text-left py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-500">ชื่อยา</th>
              <th className="text-left py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-500">ปริมาณ/ขนาด</th>
              <th className="text-left py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-500">ความถี่/วัน</th>
              <th className="text-left py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-500">หมายเหตุ</th>
              <th className="text-center py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {medications.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center">
                  <div className="text-sm text-gray-600">{emptyMessage}</div>
                  <div className="text-xs text-gray-400 mt-1">ยังไม่มีข้อมูลยาสำหรับเงื่อนไขที่เลือก</div>
                </td>
              </tr>
            )}

            {medications.map((med, index) => (
              <tr
                key={med.id}
                className={`align-middle ${index !== medications.length - 1 ? "border-b border-[#CFD5DC]" : ""} cursor-pointer hover:bg-[#E3E8ED] transition-colors`}
                onDoubleClick={() => handleEditClick(med)}
              >
                <td className="py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-900">{med.name}</td>
                <td className="py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-900">{med.dose}</td>
                <td className="py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-900">{med.frequency}</td>
                <td className="py-2.5 px-3 text-[11px] sm:text-xs font-medium text-gray-900">{med.note}</td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex items-center rounded-lg border border-[#C7D0D9] bg-white p-1 shadow-sm">
                    <button
                      onClick={() => handleDeleteClick(med)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[#FF3557] hover:bg-red-50 hover:text-[#D92644] transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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

      {showEditModal && selectedMedication && (
        <EditMedicationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMedication(null);
          }}
          onSubmit={(data) => {
            onEditMed(selectedMedication, data);
          }}
          medication={selectedMedication}
          patientName={patientName}
          patientRoom={patientRoom}
        />
      )}

      {/* Delete Medication Modal */}
      {showDeleteModal && selectedMedication && (
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
