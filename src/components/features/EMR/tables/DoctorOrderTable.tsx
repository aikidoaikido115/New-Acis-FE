"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { AddDoctorOrderModal, DoctorOrderFormData } from "../modals/AddDoctorOrderModal";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { drugPlanService } from "@/services/drug-plan.service";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import type { DrugPlan } from "@/types/drug-plan";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

export function DoctorOrderTable() {
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [plans, setPlans] = useState<DrugPlan[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [planData, residentData, roomData] = await Promise.all([
          drugPlanService.getOverview(),
          residentService.getAll(),
          roomService.getAll(),
        ]);
        setPlans(planData || []);
        setResidents(residentData || []);
        setRooms(roomData || []);
      } catch {
        setError("ไม่สามารถโหลดข้อมูลคำสั่งแพทย์ได้");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const residentById = useMemo(() => {
    return new Map(
      residents.map((resident) => {
        const id = resident.resident_id || resident.id;
        return [id, resident] as const;
      })
    );
  }, [residents]);

  const roomById = useMemo(() => {
    return new Map(
      rooms.map((room) => {
        const id = room.room_id || room.id;
        return [id, room] as const;
      })
    );
  }, [rooms]);

  const totalPages = Math.max(1, Math.ceil(plans.length / pageSize));
  const pagedPlans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return plans.slice(start, start + pageSize);
  }, [plans, currentPage]);

  const handleSubmit: (data: DoctorOrderFormData) => void = () => {
    showToast({
      type: "info",
      title: "ยังไม่รองรับ",
      message: "หน้าจอนี้ยังไม่รองรับการสร้างคำสั่งแพทย์ ต้องทำจากหน้ารายละเอียดผู้พัก",
    });
  };

  return (
    <div className="p-6 space-y-4">
      {/* Add Button Section */}
      <div>
        <div className="flex items-center justify-end">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">เพิ่มคำสั่งแพทย์</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-4 text-xs font-semibold w-48" style={{ color: 'rgba(126, 143, 164, 1)' }}>ชื่อ/ห้อง</th>
                <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: 'rgba(126, 143, 164, 1)' }}>บันทึก</th>
                <th className="text-left py-3 px-4 text-xs font-semibold w-32" style={{ color: 'rgba(126, 143, 164, 1)' }}>รูปภาพ</th>
                <th className="text-right py-3 px-4 text-xs font-semibold w-48" style={{ color: 'rgba(126, 143, 164, 1)' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-sm text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : pagedPlans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center">
                    <div className="text-sm text-gray-600">ไม่พบข้อมูลคำสั่งแพทย์</div>
                    <div className="text-xs text-gray-400 mt-1">ยังไม่มีคำสั่งแพทย์ที่บันทึกไว้ในระบบ</div>
                  </td>
                </tr>
              ) : (
                pagedPlans.map((plan) => {
                  const planId = plan.dpln_id || plan.id || "-";
                  const residentId = plan.PersonalDrug?.resident_id || "";
                  const resident = residentId ? residentById.get(residentId) : undefined;
                  const room = resident?.room_id ? roomById.get(resident.room_id) : undefined;
                  const name = resident
                    ? `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || residentId
                    : residentId || "-";
                  const roomText = room ? `ห้อง ${room.room_number}` : "";
                  const orderText = [
                    plan.PersonalDrug?.DrugMaster?.name,
                    plan.PersonalDrug?.amount && plan.PersonalDrug?.amount_unit
                      ? `${plan.PersonalDrug?.amount} ${plan.PersonalDrug?.amount_unit}`
                      : undefined,
                    plan.PersonalDrug?.timing,
                  ]
                    .filter(Boolean)
                    .join(" | ");
                  const by = plan.given_by_staff_id || "ผู้ใช้ปัจจุบัน";

                  return (
                    <tr key={planId} className="bg-white hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                      <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 align-middle">
                        <span className="underline">{name}</span>
                        {roomText ? <p className="text-[11px] text-gray-500">{roomText}</p> : null}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        {orderText ? (
                          <p className="text-xs sm:text-sm text-gray-700">{orderText}</p>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-400">ไม่มีบันทึก</p>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle"></td>

                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs sm:text-sm text-gray-400">
                            โดย{" "}
                            <button
                              type="button"
                              onClick={() => setActiveContactName(by)}
                              className="text-blue-600 underline hover:text-blue-700"
                            >
                              {by}
                            </button>
                          </span>
                          <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" disabled>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" disabled>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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
