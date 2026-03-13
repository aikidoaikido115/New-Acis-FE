"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { AddWoundCareModal, WoundCareFormData } from "../modals/AddWoundCareModal";
import { mockWoundCareDetail } from "../emr.mock";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";

interface WoundCareDetailTableProps {
  patientId: string;
}

export function WoundCareDetailTable({ patientId }: WoundCareDetailTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [records, setRecords] = useState(mockWoundCareDetail);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);

  const handleSubmit = (data: WoundCareFormData) => {
    // TODO: Send data to backend API with image upload
    console.log("New wound care record:", data);
    
    // Add to local state (temporary until API integration)
    const newRecord = {
      id: records.length + 1,
      date: data.date,
      note: `${data.location} - ${data.treatment}`,
      image: data.image ? URL.createObjectURL(data.image) : "/placeholder-wound.jpg",
      by: "ผู้ใช้ปัจจุบัน" // TODO: Get from auth context
    };
    setRecords([...records, newRecord]);
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

      {/* Records List */}
      <div className="space-y-4">
        {records.map((record) => (
            <div key={record.id} className="border rounded-lg p-4 bg-white" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
              <div className="flex items-center gap-4">
                {/* Note Content */}
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">{record.note}</p>
                  <p className="text-xs text-gray-500">
                    โดย{" "}
                    <button
                      type="button"
                      onClick={() => setActiveContactName(record.by)}
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      {record.by}
                    </button>
                  </p>
                </div>
                {/* Image Thumbnail - center */}
                <div className="w-28 h-28 rounded-lg bg-linear-to-br from-orange-200 to-pink-200 flex items-center justify-center shrink-0 overflow-hidden mx-4">
                  <ImageIcon className="w-14 h-14 text-orange-400" />
                </div>
                {/* Actions - side by side */}
                {record.note && (
                <div className="flex items-center gap-2 shrink-0">
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
      <AddWoundCareModal
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
