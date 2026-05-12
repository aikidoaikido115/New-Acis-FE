"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Eye, Trash2 } from "lucide-react";

import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import supportTicketService, {
  SupportTicket,
  SupportTicketStatus,
} from "@/services/support-ticket.service";

type TicketStatusFilter = "all" | SupportTicketStatus;

const STATUS_OPTIONS: Array<{
  value: TicketStatusFilter;
  label: string;
}> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "open", label: "เปิดใหม่" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "resolved", label: "แก้ไขแล้ว" },
];

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "เปิดใหม่",
  in_progress: "กำลังดำเนินการ",
  resolved: "แก้ไขแล้ว",
};

const STATUS_BADGE_CLASS: Record<SupportTicketStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

function StatusBadge({
  status,
}: {
  status: SupportTicketStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatThaiDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSuperuserOrHigher(role?: string): boolean {
  if (!role) return false;

  const normalizedRole = role.toLowerCase();

  return (
    normalizedRole.includes("superuser") ||
    normalizedRole.includes("super user") ||
    normalizedRole.includes("super_user") ||
    normalizedRole.includes("admin")
  );
}

function getReporterRoleThai(role?: string): string {
  if (!role) return "พยาบาล";

  const normalizedRole = role.toLowerCase().trim();

  if (
    normalizedRole.includes("kitchen") ||
    normalizedRole.includes("ครัว") ||
    normalizedRole.includes("โภชนา")
  ) {
    return "ห้องครัว";
  }

  return "พยาบาล";
}

export default function SupportTicketsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const canManageSupportTickets = isSuperuserOrHigher(
    user?.role_name
  );

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<TicketStatusFilter>("all");

  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicket | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [isStatusUpdating, setIsStatusUpdating] =
    useState(false);

  const [deletingTicketId, setDeletingTicketId] = useState<
    string | null
  >(null);

  const [statusDraft, setStatusDraft] =
    useState<SupportTicketStatus>("open");

  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const loadTickets = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await supportTicketService.list({
        search: debouncedSearch.trim() || undefined,
        status:
          statusFilter === "all"
            ? undefined
            : statusFilter,
      });

      const visibleTickets = canManageSupportTickets
        ? result
        : result.filter(
            (ticket) =>
              ticket.created_by_user_id === user?.user_id
          );

      setTickets(visibleTickets);
    } catch {
      setError("ไม่สามารถโหลดรายการแจ้งปัญหาได้");
    } finally {
      setIsLoading(false);
    }
  }, [
    canManageSupportTickets,
    debouncedSearch,
    isAuthLoading,
    statusFilter,
    user?.user_id,
  ]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const openTicketDetail = async (ticketId: string) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const detail =
        await supportTicketService.getById(ticketId);

      setSelectedTicket(detail);
      setStatusDraft(detail.status);
    } catch {
      showToast({
        type: "error",
        title: "โหลดรายละเอียดไม่สำเร็จ",
        message: "กรุณาลองอีกครั้ง",
      });

      setIsDetailOpen(false);
      setSelectedTicket(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeTicketDetail = () => {
    if (isStatusUpdating) {
      return;
    }

    setIsDetailOpen(false);
    setSelectedTicket(null);
  };

  const handleUpdateStatus = async () => {
    if (!canManageSupportTickets) {
      showToast({
        type: "error",
        title: "ไม่มีสิทธิ์ดำเนินการ",
        message:
          "เฉพาะผู้ใช้ระดับ Superuser ขึ้นไปเท่านั้น",
      });

      return;
    }

    if (!selectedTicket || isStatusUpdating) {
      return;
    }

    if (statusDraft === selectedTicket.status) {
      showToast({
        type: "info",
        title: "ไม่มีการเปลี่ยนแปลง",
        message: "สถานะเดิมอยู่แล้ว",
      });

      return;
    }

    setIsStatusUpdating(true);

    try {
      const updated =
        await supportTicketService.updateStatus(
          selectedTicket.support_ticket_id,
          statusDraft
        );

      setSelectedTicket(updated);

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.support_ticket_id ===
          updated.support_ticket_id
            ? updated
            : ticket
        )
      );

      showToast({
        type: "success",
        title: "อัปเดตสถานะสำเร็จ",
        message: "สถานะ ticket ถูกบันทึกแล้ว",
      });
    } catch {
      showToast({
        type: "error",
        title: "อัปเดตสถานะไม่สำเร็จ",
        message: "กรุณาลองอีกครั้ง",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleDeleteTicket = async (
    ticket: SupportTicket
  ) => {
    if (!canManageSupportTickets) {
      showToast({
        type: "error",
        title: "ไม่มีสิทธิ์ดำเนินการ",
        message:
          "เฉพาะผู้ใช้ระดับ Superuser ขึ้นไปเท่านั้น",
      });

      return;
    }

    if (ticket.status !== "resolved") {
      showToast({
        type: "error",
        title: "ลบไม่ได้",
        message:
          "ลบได้เฉพาะ ticket ที่สถานะเป็น แก้ไขแล้ว",
      });

      return;
    }

    const shouldDelete = await confirm({
      title: "ยืนยันการลบ Ticket",
      message: "คุณต้องการลบ ticket นี้ใช่หรือไม่?",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      tone: "danger",
    });

    if (!shouldDelete) {
      return;
    }

    setDeletingTicketId(ticket.support_ticket_id);

    try {
      await supportTicketService.deleteById(
        ticket.support_ticket_id
      );

      setTickets((prev) =>
        prev.filter(
          (item) =>
            item.support_ticket_id !==
            ticket.support_ticket_id
        )
      );

      if (
        selectedTicket?.support_ticket_id ===
        ticket.support_ticket_id
      ) {
        setIsDetailOpen(false);
        setSelectedTicket(null);
      }

      showToast({
        type: "success",
        title: "ลบ ticket สำเร็จ",
        message: "ลบรายการที่แก้ไขแล้วเรียบร้อย",
      });
    } catch {
      showToast({
        type: "error",
        title: "ลบ ticket ไม่สำเร็จ",
        message: "กรุณาลองอีกครั้ง",
      });
    } finally {
      setDeletingTicketId((current) =>
        current === ticket.support_ticket_id
          ? null
          : current
      );
    }
  };

  return (
    <div className="w-full px-4 py-5 sm:px-6 sm:py-8">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            จัดการ Support Tickets
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            ติดตามรายการแจ้งปัญหาและอัปเดตสถานะการดำเนินงาน
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:grid md:grid-cols-[1fr_220px] md:gap-4">
            
            <div className="relative flex-grow sm:flex-[1.5] md:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="ค้นหาจากหัวข้อ, ชื่อ, อีเมล..."
                className="h-11 pl-10 text-black border border-slate-300 w-full"
              />
            </div>

            <div className="w-full sm:w-[180px] md:w-auto">
              <Dropdown
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as TicketStatusFilter)}
                options={STATUS_OPTIONS}
                className="h-11 w-full"
              />
            </div>
          </div>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <div className="rounded-2xl bg-white py-16 shadow-sm">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-white py-16 text-center text-red-600 shadow-sm">
              {error}
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl bg-white py-16 text-center text-gray-500 shadow-sm">
              ไม่พบรายการแจ้งปัญหา
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.support_ticket_id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-sm font-semibold text-gray-800">
                      {ticket.subject}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      {ticket.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {getReporterRoleThai(
                        ticket.reporter_role
                      )}
                    </p>
                  </div>

                  <StatusBadge status={ticket.status} />
                </div>

                <p className="mt-4 text-xs text-gray-400">
                  {formatThaiDate(ticket.created_at)}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void openTicketDetail(
                        ticket.support_ticket_id
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700"
                  >
                    <Eye className="h-4 w-4" />
                    ดูรายละเอียด
                  </button>

                  {canManageSupportTickets &&
                    ticket.status ===
                      "resolved" && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteTicket(ticket)
                        }
                        disabled={
                          deletingTicketId ===
                          ticket.support_ticket_id
                        }
                        className="flex items-center justify-center rounded-xl border border-red-300 px-4 py-2.5 text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    หัวข้อ
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    ผู้แจ้ง
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    บทบาท
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    สถานะ
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    วันที่แจ้ง
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                    การจัดการ
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center"
                    >
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center text-red-600"
                    >
                      {error}
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center text-gray-500"
                    >
                      ไม่พบรายการแจ้งปัญหา
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.support_ticket_id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {ticket.subject}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {ticket.name}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {getReporterRoleThai(
                          ticket.reporter_role
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          status={ticket.status}
                        />
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatThaiDate(
                          ticket.created_at
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void openTicketDetail(
                                ticket.support_ticket_id
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                            ดูรายละเอียด
                          </button>

                          {canManageSupportTickets &&
                            ticket.status ===
                              "resolved" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteTicket(
                                    ticket
                                  )
                                }
                                disabled={
                                  deletingTicketId ===
                                  ticket.support_ticket_id
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                ลบ
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isDetailOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTicketDetail();
            }
          }}
        >
          <div
            className="flex max-h-[90vh] w-full flex-col overflow-hidden bg-white shadow-2xl rounded-2xl sm:max-w-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-gray-800">
                รายละเอียด Ticket
              </h2>

              <button
                type="button"
                onClick={closeTicketDetail}
                disabled={isStatusUpdating}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ปิด
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isDetailLoading || !selectedTicket ? (
                <div className="flex items-center justify-center py-16">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-5 px-4 py-5 sm:px-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        หัวข้อ
                      </p>

                      <p className="mt-1 text-sm text-gray-800">
                        {selectedTicket.subject}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        สถานะปัจจุบัน
                      </p>

                      <div className="mt-2">
                        <StatusBadge
                          status={selectedTicket.status}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        ชื่อผู้แจ้ง
                      </p>

                      <p className="mt-1 text-sm text-gray-800">
                        {selectedTicket.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        อีเมล
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-800">
                        {selectedTicket.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        บทบาทผู้แจ้ง
                      </p>

                      <p className="mt-1 text-sm text-gray-800">
                        {getReporterRoleThai(
                          selectedTicket.reporter_role
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        วันที่แจ้ง
                      </p>

                      <p className="mt-1 text-sm text-gray-800">
                        {formatThaiDate(
                          selectedTicket.created_at
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      รายละเอียดปัญหา
                    </p>

                    <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-gray-800">
                      {selectedTicket.message}
                    </p>
                  </div>

                  {canManageSupportTickets && (
                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">
                            อัปเดตสถานะ
                          </label>

                          <Dropdown
                            value={statusDraft}
                            onChange={(value) =>
                              setStatusDraft(
                                value as SupportTicketStatus
                              )
                            }
                            disabled={
                              isStatusUpdating ||
                              deletingTicketId ===
                                selectedTicket.support_ticket_id
                            }
                            options={STATUS_OPTIONS.filter(
                              (item) =>
                                item.value !== "all"
                            )}
                            className="h-11 w-full"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:flex">
                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdateStatus()
                            }
                            disabled={
                              isStatusUpdating ||
                              deletingTicketId ===
                                selectedTicket.support_ticket_id
                            }
                            className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            {isStatusUpdating
                              ? "กำลังบันทึก..."
                              : "บันทึกสถานะ"}
                          </button>

                          {selectedTicket.status ===
                            "resolved" && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleDeleteTicket(
                                  selectedTicket
                                )
                              }
                              disabled={
                                deletingTicketId ===
                                  selectedTicket.support_ticket_id ||
                                isStatusUpdating
                              }
                              className="h-11 rounded-xl border border-red-300 px-6 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              {deletingTicketId ===
                              selectedTicket.support_ticket_id
                                ? "กำลังลบ..."
                                : "ลบ Ticket"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}