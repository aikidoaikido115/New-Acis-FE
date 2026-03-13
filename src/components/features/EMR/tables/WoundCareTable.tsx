"use client";

import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { mockWoundCareTable as mockWoundCare } from "../emr.mock";
import { AddWoundCareModal, WoundCareFormData } from "../modals/AddWoundCareModal";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";

export function WoundCareTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const totalPages = 5;

  const handleSubmit = (data: WoundCareFormData) => {
    console.log("New wound care:", data);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Add Button Section */}
      <div>
        <div className="flex items-center justify-end">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">เพิ่มบันทึก</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-4 font-medium w-48" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>ชื่อ/ห้อง</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>บันทึก</th>
                <th className="text-left py-3 px-4 font-medium w-32" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>รูปภาพ</th>
                <th className="text-right py-3 px-4 font-medium w-48" style={{ color: 'rgba(126, 143, 164, 1)', fontSize: '16px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {mockWoundCare.map((record) => (
                <tr key={record.id} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                  {/* Col 1: Name/Room */}
                  <td className="py-4 px-4 text-sm text-gray-900 align-middle">
                    <span className="underline">{record.name}</span>
                  </td>

                  {/* Col 2: Note Content */}
                  <td className="py-4 px-4 align-middle">
                    {record.by ? (
                      <p className="text-sm text-gray-700">{record.note}</p>
                    ) : (
                      <p className="text-sm text-gray-400">ไม่มีบันทึก</p>
                    )}
                  </td>

                  {/* Col 3: Image */}
                  <td className="py-4 px-4 align-middle">
                    {record.by && record.image && (
                      <div className="w-16 h-16 rounded-lg bg-linear-to-br from-orange-200 to-pink-200 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-8 h-8 text-orange-400" />
                      </div>
                    )}
                  </td>

                  {/* Col 4: Actions & Metadata */}
                  <td className="py-4 px-4 align-middle">
                    {record.by && (
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-sm text-gray-400">
                          โดย{" "}
                          <button
                            type="button"
                            onClick={() => setActiveContactName(record.by)}
                            className="text-blue-600 underline hover:text-blue-700"
                          >
                            {record.by}
                          </button>
                        </span>
                        <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Section - Separate (no box, just aligned) */}
      <div className="flex justify-end">
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

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
