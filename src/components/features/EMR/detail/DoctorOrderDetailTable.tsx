"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { AddDoctorOrderModal, DoctorOrderFormData } from "../modals/AddDoctorOrderModal";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { drugPlanService } from "@/services/drug-plan.service";
import type { DrugPlan } from "@/types/drug-plan";
import { authService } from "@/services/auth.service";
import { personalDrugService } from "@/services/personal-drug.service";

interface DoctorOrderDetailTableProps {
  patientId: string;
}

export function DoctorOrderDetailTable({ patientId }: DoctorOrderDetailTableProps) {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState<DrugPlan[]>([]);
  const [personalDrugOptions, setPersonalDrugOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useMemo(() => authService.getCurrentUser()?.user_id || "", []);

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
        const [planData, personalDrugs] = await Promise.all([
          drugPlanService.getByResidentAll(patientId),
          personalDrugService.getByResidentAll(patientId),
        ]);
        setOrders(planData || []);
        setPersonalDrugOptions(
          (personalDrugs || [])
            .map((drug) => {
              const id = drug.pd_id || drug.id;
              if (!id) return null;
              const label = [
                drug.DrugMaster?.name,
                drug.amount && drug.amount_unit ? `${drug.amount} ${drug.amount_unit}` : undefined,
                drug.time_of_day,
                drug.timing,
              ]
                .filter(Boolean)
                .join(" | ");
              return { value: id, label: label || id };
            })
            .filter((item): item is { value: string; label: string } => Boolean(item))
        );
      } catch {
        setError("ไม่สามารถโหลดคำสั่งแพทย์ได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [patientId]);

  const handleSubmit = async (data: DoctorOrderFormData) => {
    if (!data.personalDrugId) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "กรุณาเลือกรายการยาต้นทาง" });
      return;
    }

    if (!currentUserId) {
      showToast({ type: "error", title: "ไม่พบผู้ใช้งาน", message: "กรุณาเข้าสู่ระบบใหม่" });
      return;
    }

    try {
      await drugPlanService.create({
        pd_id: data.personalDrugId,
        given_by_staff_id: currentUserId,
        is_taken: false,
        notes: data.dosageDetails || data.medicationName || undefined,
      });

      const refreshed = await drugPlanService.getByResidentAll(patientId);
      setOrders(refreshed || []);
      setIsModalOpen(false);
      showToast({ type: "success", title: "บันทึกสำเร็จ", message: "เพิ่มคำสั่งแพทย์เรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "บันทึกไม่สำเร็จ", message: "ไม่สามารถสร้างคำสั่งแพทย์ได้" });
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
      await drugPlanService.deleteById(id);
      setOrders((prev) => prev.filter((item) => (item.dpln_id || item.id) !== id));
      showToast({ type: "success", title: "ลบสำเร็จ", message: "ลบคำสั่งแพทย์เรียบร้อยแล้ว" });
    } catch {
      showToast({ type: "error", title: "ลบไม่สำเร็จ", message: "ไม่สามารถลบคำสั่งแพทย์ได้" });
    }
  };

  const handleToggleTaken = async (order: DrugPlan) => {
    const id = order.dpln_id || order.id;
    if (!id) {
      return;
    }

    try {
      const nextTaken = !order.is_taken;
      await drugPlanService.updateById(id, {
        is_taken: nextTaken,
        taken_at: nextTaken ? new Date().toISOString() : undefined,
        given_by_staff_id: currentUserId || order.given_by_staff_id,
      });

      setOrders((prev) =>
        prev.map((item) =>
          (item.dpln_id || item.id) === id
            ? {
                ...item,
                is_taken: nextTaken,
                taken_at: nextTaken ? new Date().toISOString() : null,
              }
            : item
        )
      );
      showToast({
        type: "success",
        title: "บันทึกสำเร็จ",
        message: nextTaken ? "อัปเดตสถานะเป็นให้ยาแล้ว" : "อัปเดตสถานะเป็นรอให้ยาแล้ว",
      });
    } catch {
      showToast({ type: "error", title: "อัปเดตไม่สำเร็จ", message: "ไม่สามารถอัปเดตสถานะคำสั่งแพทย์ได้" });
    }
  };

  const rows = useMemo(() => {
    return orders.map((order) => {
      const orderId = order.dpln_id || order.id || "-";
      const note = order.PersonalDrug?.DrugMaster?.name || "-";
      const details = [
        order.PersonalDrug?.amount && order.PersonalDrug?.amount_unit
          ? `${order.PersonalDrug?.amount} ${order.PersonalDrug?.amount_unit}`
          : undefined,
        order.PersonalDrug?.time_of_day,
        order.PersonalDrug?.timing,
        order.notes || undefined,
      ]
        .filter(Boolean)
        .join(" | ");
      const by = order.given_by_staff_id || "ผู้ใช้ปัจจุบัน";
      const isTaken = Boolean(order.is_taken);
      return { orderId, note, details, by, isTaken, source: order };
    });
  }, [orders]);

  return (
    <div className="p-6 space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">เพิ่มคำสั่งแพทย์</span>
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
        ) : rows.length === 0 ? (
          <div className="border rounded-lg p-10 bg-white text-center" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
            <div className="text-sm text-gray-600">ไม่พบคำสั่งแพทย์</div>
            <div className="text-xs text-gray-400 mt-1">ยังไม่มีคำสั่งแพทย์สำหรับผู้พักรายนี้</div>
          </div>
        ) : (
          rows.map((row) => (
              <div key={row.orderId} className="border rounded-lg p-4 bg-white" style={{ borderColor: 'rgba(103, 103, 103, 0.48)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">{row.note}</h3>
                    <div className="mb-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${row.isTaken ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {row.isTaken ? "ให้ยาแล้ว" : "รอให้ยา"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{row.details || "-"}</p>
                    <p className="text-xs text-gray-500">
                      โดย{" "}
                      <button
                        type="button"
                        onClick={() => setActiveContactName(row.by)}
                        className="text-xs sm:text-sm text-blue-600 underline hover:text-blue-700"
                      >
                        {row.by}
                      </button>
                    </p>
                  </div>
                  {(row.note || row.details) && (
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      onClick={() => handleToggleTaken(row.source)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      onClick={() => handleDelete(row.orderId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Modal */}
      <AddDoctorOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        personalDrugOptions={personalDrugOptions}
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
