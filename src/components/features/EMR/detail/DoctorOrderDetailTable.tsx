"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { AddDoctorOrderModal, DoctorOrderFormData } from "../modals/AddDoctorOrderModal";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { doctorOrderService } from "@/services/doctor-order.service";
import type { DoctorOrder } from "@/types/emr-notes";

interface DoctorOrderDetailTableProps {
  patientId: string;
}

export function DoctorOrderDetailTable({ patientId }: DoctorOrderDetailTableProps) {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState<DoctorOrder[]>([]);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!patientId) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await doctorOrderService.getByResidentAll(patientId);
        setOrders(data || []);
      } catch {
        setError("ไม่สามารถโหลดคำสั่งแพทย์ได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [patientId]);

  const handleSubmit = async (data: DoctorOrderFormData): Promise<boolean> => {
    try {
      await doctorOrderService.create({
        resident_id: patientId,
        order_date: data.orderDate || undefined,
        order_type: data.orderType || undefined,
        title: data.title,
        details: data.details || undefined,
        start_date: data.startDate || undefined,
        end_date: data.endDate || undefined,
        frequency: data.frequency || undefined,
        ordered_by: data.orderedBy || undefined,
      });

      const refreshed = await doctorOrderService.getByResidentAll(patientId);
      setOrders(refreshed || []);
      setIsModalOpen(false);
      showToast({ type: "success", title: "บันทึกสำเร็จ", message: "เพิ่มคำสั่งแพทย์เรียบร้อยแล้ว" });
      return true;
    } catch {
      showToast({ type: "error", title: "บันทึกไม่สำเร็จ", message: "ไม่สามารถสร้างคำสั่งแพทย์ได้" });
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm({
      title: "ยืนยันการลบ",
      message: "ยืนยันการลบคำสั่งแพทย์นี้?",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      tone: "danger",
    });
    if (!shouldDelete) {
      return;
    }

    try {
      await doctorOrderService.deleteById(id);
      setOrders((prev) => prev.filter((item) => (item.doctor_order_id || item.id) !== id));
      showToast({ type: "success", title: "ลบสำเร็จ", message: "ลบคำสั่งแพทย์เรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "ลบไม่สำเร็จ", message: "ไม่สามารถลบคำสั่งแพทย์ได้" });
    }
  };

  const handleEdit = async (order: DoctorOrder) => {
    const id = order.doctor_order_id || order.id;
    if (!id) {
      return;
    }

    const nextTitle = window.prompt("แก้ไขหัวข้อคำสั่งแพทย์", order.title || "");
    if (nextTitle === null || !nextTitle.trim()) {
      return;
    }

    const nextDetails = window.prompt("แก้ไขรายละเอียดคำสั่งแพทย์", order.details || "");
    if (nextDetails === null) {
      return;
    }

    try {
      const updated = await doctorOrderService.updateById(id, {
        title: nextTitle.trim(),
        details: nextDetails.trim() || undefined,
      });
      setOrders((prev) => prev.map((row) => ((row.doctor_order_id || row.id) === id ? updated : row)));
      showToast({ type: "success", title: "แก้ไขสำเร็จ", message: "อัปเดตคำสั่งแพทย์เรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "แก้ไขไม่สำเร็จ", message: "ไม่สามารถแก้ไขคำสั่งแพทย์ได้" });
    }
  };

  const rows = useMemo(() => {
    return orders.map((order) => {
      const orderId = order.doctor_order_id || order.id || "-";
      const details = [order.order_type, order.details, order.frequency].filter(Boolean).join(" | ");
      const by = order.created_by_staff_id || "-";
      return { orderId, title: order.title, details, by, source: order };
    });
  }, [orders]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">เพิ่มคำสั่งแพทย์</span>
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="border rounded-lg p-4 bg-white text-sm text-gray-500" style={{ borderColor: "rgba(103, 103, 103, 0.48)" }}>
            กำลังโหลดข้อมูล...
          </div>
        ) : error ? (
          <div className="border rounded-lg p-4 bg-white text-sm text-red-500" style={{ borderColor: "rgba(103, 103, 103, 0.48)" }}>
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="border rounded-lg p-4 bg-white text-slate-500" style={{ borderColor: "rgba(103, 103, 103, 0.48)" }}>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-sm">ไม่พบคำสั่งแพทย์</div>
              <div className="text-xs mt-1">ลองเพิ่มข้อมูลใหม่อีกครั้ง</div>
            </div>
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.orderId} className="border rounded-lg p-4 bg-white" style={{ borderColor: "rgba(103, 103, 103, 0.48)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">{row.title || "-"}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">{row.details || "-"}</p>
                  <p className="text-xs text-gray-500">
                    โดย{" "}
                    {row.by !== "-" ? (
                      <button
                        type="button"
                        onClick={() => setActiveContactName(row.by)}
                        className="text-xs sm:text-sm text-blue-600 underline hover:text-blue-700"
                      >
                        {row.by}
                      </button>
                    ) : (
                      row.by
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    onClick={() => void handleEdit(row.source)}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    onClick={() => void handleDelete(row.orderId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AddDoctorOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        showResidentPicker={false}
        defaultResidentId={patientId}
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
