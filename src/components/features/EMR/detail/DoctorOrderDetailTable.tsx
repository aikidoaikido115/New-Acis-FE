"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AddDoctorOrderModal, DoctorOrderFormData } from "../modals/AddDoctorOrderModal";
import { mockDoctorOrdersDetail } from "../emr.mock";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";

interface DoctorOrderDetailTableProps {
  patientId: string;
}

export function DoctorOrderDetailTable({ patientId }: DoctorOrderDetailTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState(mockDoctorOrdersDetail);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);

  const handleSubmit = (data: DoctorOrderFormData) => {
    // TODO: Send data to backend API
    console.log("New doctor order:", data);
    
    // Add to local state (temporary until API integration)
    const newOrder = {
      id: orders.length + 1,
      date: data.orderDate,
      note: data.medicationName,
      details: `${data.dosageDetails} เสร็จยา ${data.endDate} เริ่มยา ${data.startDate}`,
      by: data.pharmacist
    };
    setOrders([...orders, newOrder]);
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
          <span className="text-sm font-medium">เพิ่มคำสั่งแพทย์</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 bg-white" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{order.note}</h3>
                  <p className="text-sm text-gray-600 mb-2">{order.details}</p>
                  <p className="text-xs text-gray-500">
                    โดย{" "}
                    <button
                      type="button"
                      onClick={() => setActiveContactName(order.by)}
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      {order.by}
                    </button>
                  </p>
                </div>
                {(order.note || order.details) && (
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
      <AddDoctorOrderModal
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
