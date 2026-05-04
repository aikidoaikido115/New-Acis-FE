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
import supportTicketService, { SupportTicket, SupportTicketStatus } from "@/services/support-ticket.service";

type TicketStatusFilter = "all" | SupportTicketStatus;

const STATUS_OPTIONS: Array<{ value: TicketStatusFilter; label: string }> = [
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

function StatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-caption font-medium ${STATUS_BADGE_CLASS[status]}`}>
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
  const canManageSupportTickets = isSuperuserOrHigher(user?.role_name);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all");

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<SupportTicketStatus>("open");

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
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      const visibleTickets = canManageSupportTickets
        ? result
        : result.filter((ticket) => ticket.created_by_user_id === user?.user_id);

      setTickets(visibleTickets);
    } catch {
      setError("ไม่สามารถโหลดรายการแจ้งปัญหาได้");
    } finally {
      setIsLoading(false);
    }
  }, [canManageSupportTickets, debouncedSearch, isAuthLoading, statusFilter, user?.user_id]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const openTicketDetail = async (ticketId: string) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const detail = await supportTicketService.getById(ticketId);
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
        message: "เฉพาะผู้ใช้ระดับ Superuser ขึ้นไปเท่านั้น",
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
      const updated = await supportTicketService.updateStatus(selectedTicket.support_ticket_id, statusDraft);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((ticket) => (ticket.support_ticket_id === updated.support_ticket_id ? updated : ticket)));
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

  const handleDeleteTicket = async (ticket: SupportTicket) => {
    if (!canManageSupportTickets) {
      showToast({
        type: "error",
        title: "ไม่มีสิทธิ์ดำเนินการ",
        message: "เฉพาะผู้ใช้ระดับ Superuser ขึ้นไปเท่านั้น",
      });
      return;
    }

    if (ticket.status !== "resolved") {
      showToast({
        type: "error",
        title: "ลบไม่ได้",
        message: "ลบได้เฉพาะ ticket ที่สถานะเป็น แก้ไขแล้ว",
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
      await supportTicketService.deleteById(ticket.support_ticket_id);
      setTickets((prev) => prev.filter((item) => item.support_ticket_id !== ticket.support_ticket_id));

      if (selectedTicket?.support_ticket_id === ticket.support_ticket_id) {
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
      setDeletingTicketId((current) => (current === ticket.support_ticket_id ? null : current));
    }
  };

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div>
          <h1 className="text-headline-5 font-semibold text-gray-800">จัดการ Support Tickets</h1>
          <p className="mt-2 text-body-small text-gray-600">ติดตามรายการแจ้งปัญหาและอัปเดตสถานะการดำเนินงาน</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="ค้นหาจากหัวข้อ, ชื่อ, อีเมล หรือเนื้อหา"
                className="h-11 pl-10 text-black"
              />
            </div>

            <Dropdown
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as TicketStatusFilter)}
              options={STATUS_OPTIONS}
              className="h-11"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-caption font-semibold text-gray-700">หัวข้อ</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold text-gray-700">ผู้แจ้ง</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold text-gray-700">บทบาท</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold text-gray-700">สถานะ</th>
                  <th className="px-4 py-3 text-left text-caption font-semibold text-gray-700">วันที่แจ้ง</th>
                  <th className="px-4 py-3 text-right text-caption font-semibold text-gray-700">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-body-small text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-body-small text-gray-500">
                      ไม่พบรายการแจ้งปัญหา
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.support_ticket_id} className="border-b border-gray-100 hover:bg-gray-50/70">
                      <td className="px-4 py-4 text-body-small text-gray-700">{ticket.subject}</td>
                      <td className="px-4 py-4 text-body-small text-gray-700">{ticket.name}</td>
                      <td className="px-4 py-4 text-body-small text-gray-600">{getReporterRoleThai(ticket.reporter_role)}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-4 text-body-small text-gray-600">{formatThaiDate(ticket.created_at)}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void openTicketDetail(ticket.support_ticket_id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-body-small text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                            ดูรายละเอียด
                          </button>

                          {canManageSupportTickets && ticket.status === "resolved" && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteTicket(ticket)}
                              disabled={deletingTicketId === ticket.support_ticket_id}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-body-small text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingTicketId === ticket.support_ticket_id ? "กำลังลบ..." : "ลบ"}
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
          className="fixed inset-0 z-120 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTicketDetail();
            }
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-headline-7 font-semibold text-gray-800">รายละเอียด Ticket</h2>
              <button
                type="button"
                onClick={closeTicketDetail}
                disabled={isStatusUpdating}
                className="text-body-small text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                ปิด
              </button>
            </div>

            {isDetailLoading || !selectedTicket ? (
              <div className="px-6 py-10 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-5 px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-caption text-gray-500">หัวข้อ</p>
                    <p className="text-body-small text-gray-800">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <p className="text-caption text-gray-500">สถานะปัจจุบัน</p>
                    <div className="mt-1">
                      <StatusBadge status={selectedTicket.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-caption text-gray-500">ชื่อผู้แจ้ง</p>
                    <p className="text-body-small text-gray-800">{selectedTicket.name}</p>
                  </div>
                  <div>
                    <p className="text-caption text-gray-500">อีเมล</p>
                    <p className="text-body-small text-gray-800 break-all">{selectedTicket.email}</p>
                  </div>
                  <div>
                    <p className="text-caption text-gray-500">บทบาทผู้แจ้ง</p>
                    <p className="text-body-small text-gray-800">{getReporterRoleThai(selectedTicket.reporter_role)}</p>
                  </div>
                  <div>
                    <p className="text-caption text-gray-500">วันที่แจ้ง</p>
                    <p className="text-body-small text-gray-800">{formatThaiDate(selectedTicket.created_at)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-caption text-gray-500">รายละเอียดปัญหา</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-body-small text-gray-800">
                    {selectedTicket.message}
                  </p>
                </div>

                {canManageSupportTickets ? (
                  <div className="grid gap-3 border-t border-gray-200 pt-4 md:grid-cols-[1fr_auto_auto] md:items-end">
                    <div>
                      <label className="text-caption text-gray-500">อัปเดตสถานะ</label>
                      <Dropdown
                        value={statusDraft}
                        onChange={(value) => setStatusDraft(value as SupportTicketStatus)}
                        disabled={isStatusUpdating || deletingTicketId === selectedTicket.support_ticket_id}
                        options={STATUS_OPTIONS.filter((item) => item.value !== "all")}
                        className="mt-1 h-11"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleUpdateStatus()}
                      disabled={isStatusUpdating || deletingTicketId === selectedTicket.support_ticket_id}
                      className="h-11 rounded-lg bg-blue-600 px-6 text-body-small text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isStatusUpdating ? "กำลังบันทึก..." : "บันทึกสถานะ"}
                    </button>

                    {selectedTicket.status === "resolved" && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteTicket(selectedTicket)}
                        disabled={deletingTicketId === selectedTicket.support_ticket_id || isStatusUpdating}
                        className="h-11 rounded-lg border border-red-300 px-6 text-body-small text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingTicketId === selectedTicket.support_ticket_id ? "กำลังลบ..." : "ลบ Ticket"}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
