"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { AddDoctorOrderModal, DoctorOrderFormData, type ResidentOption } from "../modals/AddDoctorOrderModal";
import { ContactInformationModal } from "@/components/shared/contact/ContactInformationModal";
import { resolveContactInfo } from "@/components/shared/contact/contactDirectory";
import { doctorOrderService } from "@/services/doctor-order.service";
import { residentService } from "@/services/resident.service";
import { roomService } from "@/services/room.service";
import type { DoctorOrder } from "@/types/emr-notes";
import type { Resident } from "@/types/resident";
import type { Room } from "@/types/room";

export function DoctorOrderTable() {
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeContactName, setActiveContactName] = useState<string | null>(null);
  const [orders, setOrders] = useState<DoctorOrder[]>([]);
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
        const [orderData, residentData, roomData] = await Promise.all([
          doctorOrderService.getOverview(),
          residentService.getAll(),
          roomService.getAll(),
        ]);
        setOrders(orderData || []);
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

  const residentOptions = useMemo<ResidentOption[]>(() => {
    return residents.reduce<ResidentOption[]>((acc, resident) => {
      const id = resident.resident_id || resident.id;
      if (!id) {
        return acc;
      }

      const name = `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || id;
      const room = resident.room_id ? roomById.get(resident.room_id) : undefined;
      const subLabel = room
        ? `${resident.nickname ? `${resident.nickname} | ` : ""}ห้อง ${room.room_number} ชั้น ${room.floor}`
        : resident.nickname || "";

      acc.push({
        id,
        name,
        subLabel: subLabel || id,
        floor: room?.floor,
      });
      return acc;
    }, []);
  }, [residents, roomById]);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, currentPage]);

  const handleSubmit = async (data: DoctorOrderFormData): Promise<boolean> => {
    if (!data.residentId) {
      showToast({ type: "error", title: "ข้อมูลไม่ครบ", message: "กรุณาเลือกผู้พักก่อนบันทึก" });
      return false;
    }

    try {
      await doctorOrderService.create({
        resident_id: data.residentId,
        order_date: data.orderDate || undefined,
        order_type: data.orderType || undefined,
        title: data.title,
        details: data.details || undefined,
        start_date: data.startDate || undefined,
        end_date: data.endDate || undefined,
        frequency: data.frequency || undefined,
        ordered_by: data.orderedBy || undefined,
      });

      const refreshed = await doctorOrderService.getOverview();
      setOrders(refreshed || []);
      setCurrentPage(1);
      showToast({ type: "success", title: "บันทึกสำเร็จ", message: "เพิ่มคำสั่งแพทย์เรียบร้อยแล้ว" });
      return true;
    } catch {
      showToast({ type: "error", title: "บันทึกไม่สำเร็จ", message: "ไม่สามารถสร้างคำสั่งแพทย์ได้" });
      return false;
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">เพิ่มคำสั่งแพทย์</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg" style={{ border: "1px solid rgba(103, 103, 103, 0.48)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(239, 242, 247, 1)",
                  borderBottom: "1px solid rgba(103, 103, 103, 0.48)",
                }}
              >
                <th className="text-left py-3 px-4 text-xs font-semibold w-48" style={{ color: "rgba(126, 143, 164, 1)" }}>
                  ชื่อ/ห้อง
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: "rgba(126, 143, 164, 1)" }}>
                  คำสั่งแพทย์
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold w-32" style={{ color: "rgba(126, 143, 164, 1)" }}>
                  รูปภาพ
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold w-48" style={{ color: "rgba(126, 143, 164, 1)" }}>
                  จัดการ
                </th>
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
              ) : pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-sm">ไม่พบข้อมูลคำสั่งแพทย์</div>
                      <div className="text-xs mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</div>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => {
                  const orderId = order.doctor_order_id || order.id || "-";
                  const resident = residentById.get(order.resident_id);
                  const room = resident?.room_id ? roomById.get(resident.room_id) : undefined;
                  const name = resident
                    ? `${resident.first_name || ""} ${resident.last_name || ""}`.trim() || order.resident_id
                    : order.resident_id;
                  const roomText = room ? `ห้อง ${room.room_number}` : "";
                  const orderText = [order.order_type, order.title, order.details, order.frequency]
                    .filter(Boolean)
                    .join(" | ");
                  const by = order.created_by_staff_id || "-";

                  return (
                    <tr
                      key={orderId}
                      className="bg-white hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: "1px solid rgba(103, 103, 103, 0.48)" }}
                    >
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

                      <td className="py-4 px-4 align-middle text-xs text-gray-400">-</td>

                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs sm:text-sm text-gray-400">
                            โดย{" "}
                            {by !== "-" ? (
                              <button
                                type="button"
                                onClick={() => setActiveContactName(by)}
                                className="text-blue-600 underline hover:text-blue-700"
                              >
                                {by}
                              </button>
                            ) : (
                              by
                            )}
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

      <div className="flex justify-end">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <AddDoctorOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        residentOptions={residentOptions}
        showResidentPicker
        requireResidentSelection
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
