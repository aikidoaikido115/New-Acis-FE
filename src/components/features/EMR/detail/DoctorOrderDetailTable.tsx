"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { AddDoctorOrderModal, DoctorOrderFormData } from "../modals/AddDoctorOrderModal";
import { NoteTimelineControls } from "../NoteTimelineControls";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { doctorOrderService } from "@/services/doctor-order.service";
import type { DoctorOrder } from "@/types/emr-notes";
import { filterAndSortByTimeline, formatBangkokDateKey, formatBangkokDateTime, type TimelineSortOrder } from "../note-timeline";

interface DoctorOrderDetailTableProps {
  patientId: string;
}

export function DoctorOrderDetailTable({ patientId }: DoctorOrderDetailTableProps) {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DoctorOrder | null>(null);
  const [orders, setOrders] = useState<DoctorOrder[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>("newest");
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedDateKey = useMemo(() => formatBangkokDateKey(selectedDate || new Date()), [selectedDate]);

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
        const data = await doctorOrderService.getByResidentAll(patientId, selectedDateKey);
        setOrders(data || []);
      } catch {
        setError("ไม่สามารถโหลดคำสั่งแพทย์ได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [patientId, selectedDateKey]);

  const filteredOrders = useMemo(() => {
    return filterAndSortByTimeline(orders, selectedDate, sortOrder);
  }, [orders, selectedDate, sortOrder]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleSortOrderChange = (value: TimelineSortOrder) => {
    setSortOrder(value);
  };

  const handleSubmit = async (data: DoctorOrderFormData): Promise<boolean> => {
    try {
      const editingId = editingOrder?.doctor_order_id || editingOrder?.id;

      if (editingId) {
        await doctorOrderService.updateById(editingId, {
          order_date: data.orderDate || undefined,
          order_type: data.orderType || undefined,
          title: data.title,
          details: data.details || undefined,
          start_date: data.startDate || undefined,
          end_date: data.endDate || undefined,
          frequency: data.frequency || undefined,
          ordered_by: data.orderedBy || undefined,
        });
      } else {
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
      }

      const refreshed = await doctorOrderService.getByResidentAll(patientId, selectedDateKey);
      setOrders(refreshed || []);
      handleModalClose();
      showToast({
        type: "success",
        title: editingId ? "แก้ไขสำเร็จ" : "บันทึกสำเร็จ",
        message: editingId ? "อัปเดตคำสั่งแพทย์เรียบร้อยแล้ว" : "เพิ่มคำสั่งแพทย์เรียบร้อยแล้ว",
      });
      return true;
    } catch {
      showToast({
        type: "error",
        title: editingOrder ? "แก้ไขไม่สำเร็จ" : "บันทึกไม่สำเร็จ",
        message: editingOrder ? "ไม่สามารถแก้ไขคำสั่งแพทย์ได้" : "ไม่สามารถสร้างคำสั่งแพทย์ได้",
      });
      return false;
    }
  };

  const handleOpenCreateModal = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order: DoctorOrder) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
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
          onClick={handleOpenCreateModal}
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
        ) : filteredOrders.length === 0 ? (
          <div className="border rounded-lg p-4 bg-white text-slate-500" style={{ borderColor: "rgba(103, 103, 103, 0.48)" }}>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-sm">ไม่พบคำสั่งแพทย์</div>
              <div className="text-xs mt-1">ลองเพิ่มข้อมูลใหม่อีกครั้ง</div>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const orderId = order.doctor_order_id || order.id || "-";
            const details = [order.order_type, order.details, order.frequency].filter(Boolean).join(" | ");
            const additionalText = order.ordered_by?.trim() || "";
            const by = order.created_by_staff_name || order.created_by_staff_id || "-";
            const createdAt = formatBangkokDateTime(order.created_at);

            return (
            <div key={orderId} className="border rounded-lg p-4 bg-white" style={{ borderColor: "rgba(103, 103, 103, 0.48)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">{order.title || "-"}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">{details || "-"}</p>
                  {additionalText ? <p className="text-xs text-gray-500 mb-2">เพิ่มเติม: {additionalText}</p> : null}
                  <p className="text-[11px] text-gray-400 mb-2">บันทึกเมื่อ {createdAt}</p>
                  <p className="text-xs text-gray-500">
                    โดย{" "}
                    {by !== "-" ? (
                      <button
                        type="button"
                        onClick={() => setActiveContactName(by)}
                        className="text-xs sm:text-sm text-blue-600 underline hover:text-blue-700"
                      >
                        {by}
                      </button>
                    ) : (
                      by
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    onClick={() => handleOpenEditModal(order)}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    onClick={() => void handleDelete(orderId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>

      <AddDoctorOrderModal
        key={`${editingOrder?.doctor_order_id || editingOrder?.id || "create"}-${isModalOpen ? "open" : "closed"}`}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        showResidentPicker={false}
        defaultResidentId={patientId}
        mode={editingOrder ? "edit" : "create"}
        initialData={
          editingOrder
            ? {
                residentId: editingOrder.resident_id,
                orderDate: editingOrder.order_date || "",
                orderType: editingOrder.order_type || "",
                title: editingOrder.title || "",
                details: editingOrder.details || "",
                startDate: editingOrder.start_date || "",
                endDate: editingOrder.end_date || "",
                frequency: editingOrder.frequency || "",
                orderedBy: editingOrder.ordered_by || "",
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
