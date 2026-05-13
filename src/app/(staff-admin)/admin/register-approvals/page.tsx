"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle2, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminSectionTabs } from "@/components/features/admin/admin-section-tabs";
import { useAdminContext } from "@/components/features/admin/AdminContext";
import {
  formatDateTime,
  toRoleLabel,
  type SystemRole,
} from "@/components/features/admin/admin-data";
import adminService, { type AdminManagedUser } from "@/services/admin.service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";


const ITEMS_PER_PAGE = 8;

type SortField = "requestedAt" | "username" | "roleRequested";
type SortDirection = "asc" | "desc";
type RoleFilter = "all" | SystemRole;
type RegistrationStatus = "pending" | "approved";
type StatusFilter = "all" | RegistrationStatus;

const ROLE_FILTER_OPTIONS: Array<{ value: RoleFilter; label: string }> = [
  { value: "all", label: "ทุกบทบาท" },
  { value: "nurse", label: "เจ้าหน้าที่ดูแล" },
  { value: "kitchen", label: "เจ้าหน้าที่ครัว" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
];

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "pending", label: "รอตรวจสอบ" },
  { value: "approved", label: "เปิดใช้งานแล้ว" },
];

interface RegistrationRequest {
  id: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  roleRequested: SystemRole;
  requestedAt: string;
  status: RegistrationStatus;
}

function getStatusBadgeClass(status: RegistrationStatus): string {
  if (status === "approved") return "bg-green-100 text-green-700";
  return "bg-yellow-100 text-yellow-800";
}

function getStatusLabel(status: RegistrationStatus): string {
  if (status === "approved") return "เปิดใช้งานแล้ว";
  return "รอตรวจสอบ";
}

function getSortLabel(field: SortField): string {
  if (field === "username") return "ผู้ขอสมัคร";
  if (field === "roleRequested") return "บทบาทที่ขอ";
  return "วันที่สมัคร";
}

function toRegistrationRequest(user: AdminManagedUser): RegistrationRequest {
  return {
    id: user.id,
    userId: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    roleRequested: user.role,
    requestedAt: user.createdAt,
    status: user.status === "active" ? "approved" : "pending",
  };
}

export default function AdminRegisterApprovalsPage() {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const { refetchPendingCount } = useAdminContext();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [sortField, setSortField] = useState<SortField>("requestedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const users = await adminService.getUsers();
      setRequests(users.map(toRegistrationRequest));
    } catch {
      showToast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        message: "ไม่สามารถดึงรายการคำขอสมัครได้",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filteredAndSortedRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = requests.filter((request) => {
      const inSearch =
        normalizedSearch.length === 0 ||
        [request.username, request.name, request.email, toRoleLabel(request.roleRequested)]
          .some((field) => field.toLowerCase().includes(normalizedSearch));

      const inRole = roleFilter === "all" || request.roleRequested === roleFilter;
      const inStatus = statusFilter === "all" || request.status === statusFilter;

      return inSearch && inRole && inStatus;
    });

    return [...filtered].sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortField === "requestedAt") {
        return (new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()) * directionFactor;
      }

      const left = String(a[sortField]).toLowerCase();
      const right = String(b[sortField]).toLowerCase();
      return left.localeCompare(right, "th") * directionFactor;
    });
  }, [requests, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRequests.length / ITEMS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequests = filteredAndSortedRequests.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const startItem = filteredAndSortedRequests.length === 0 ? 0 : pageStart + 1;
  const endItem = Math.min(pageStart + ITEMS_PER_PAGE, filteredAndSortedRequests.length);

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "requestedAt" ? "desc" : "asc");
  };

  const updateRequestStatus = async (requestId: string, status: RegistrationStatus) => {
    const target = requests.find((request) => request.id === requestId);
    if (!target) return;

    setUpdatingId(requestId);
    try {
      const updated = await adminService.updateUserApproval(target.userId, status === "approved");
      const nextRequest = toRegistrationRequest(updated);
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? nextRequest : request
        )
      );

      showToast({
        title: status === "approved" ? "อนุมัติสำเร็จ" : "ปิดการใช้งานแล้ว",
        message: `${target.username} ถูก${status === "approved" ? "อนุมัติการใช้งาน" : "ปิดการใช้งาน"}เรียบร้อย`,
        type: "success",
      });

      await refetchPendingCount();
    } catch {
      showToast({
        title: "บันทึกไม่สำเร็จ",
        message: "ไม่สามารถอัปเดตสถานะคำขอได้",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApprove = async (requestId: string) => {
    const target = requests.find((request) => request.id === requestId);
    if (!target) return;

    const confirmed = await confirm({
      title: "ยืนยันการอนุมัติ",
      message: `ต้องการอนุมัติการใช้งานของ ${target.username} ใช่หรือไม่?`,
      confirmText: "อนุมัติ",
      cancelText: "ยกเลิก",
    });

    if (!confirmed) return;
    await updateRequestStatus(requestId, "approved");
  };

  const handleSuspend = async (requestId: string) => {
    const target = requests.find((request) => request.id === requestId);
    if (!target) return;

    const confirmed = await confirm({
      title: "ยืนยันการปิดใช้งาน",
      message: `ต้องการปิดการใช้งานของ ${target.username} ใช่หรือไม่?`,
      confirmText: "ปิดการใช้งาน",
      cancelText: "ยกเลิก",
      tone: "danger",
    });

    if (!confirmed) return;
    await updateRequestStatus(requestId, "pending");
  };

  const handleReject = async (requestId: string) => {
    const target = requests.find((request) => request.id === requestId);
    if (!target) return;

    const confirmed = await confirm({
      title: "ยืนยันการปฏิเสธ",
      message: `หากปฏิเสธ ระบบจะลบผู้ใช้ ${target.username} ออกจากระบบทันที ต้องการดำเนินการต่อหรือไม่?`,
      confirmText: "ปฏิเสธและลบ",
      cancelText: "ยกเลิก",
      tone: "danger",
    });

    if (!confirmed) return;

    setUpdatingId(requestId);
    try {
      await adminService.deleteUserById(target.userId);
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
      showToast({
        title: "ปฏิเสธการสมัครแล้ว",
        message: `${target.username} ถูกลบออกจากระบบเรียบร้อย`,
        type: "success",
      });

      await refetchPendingCount();
    } catch {
      showToast({
        title: "ลบผู้ใช้ไม่สำเร็จ",
        message: "ไม่สามารถปฏิเสธและลบผู้ใช้งานได้",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-headline-5 font-bold text-gray-800">อนุมัติการสมัครใช้งาน</h2>
          <p className="mt-1 text-sm text-slate-500">ตรวจสอบและอนุมัติผู้ที่สมัครใช้งานระบบ</p>
        </div>

        <div className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-800">
          รายการที่รอตรวจสอบ {pendingCount} รายการ
        </div>
      </div>

      <AdminSectionTabs />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาจากชื่อผู้ใช้ ชื่อ หรืออีเมล"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
            />
          </div>

          <Dropdown
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value as RoleFilter);
              setCurrentPage(1);
            }}
            options={ROLE_FILTER_OPTIONS}
            className="h-10"
          />

          <Dropdown
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as StatusFilter);
              setCurrentPage(1);
            }}
            options={STATUS_FILTER_OPTIONS}
            className="h-10"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">
                  <button type="button" onClick={() => handleSort("username")} className="inline-flex items-center gap-1.5">
                    ผู้ขอสมัคร
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">อีเมล</th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("roleRequested")} className="inline-flex items-center gap-1.5">
                    บทบาทที่ขอ
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("requestedAt")} className="inline-flex items-center gap-1.5">
                    วันที่สมัคร
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium text-right sm:px-6">การกระทำ</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              )}

              {paginatedRequests.map((request) => (
                <tr key={request.id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-4 py-3 sm:px-6">
                    <div className="font-medium text-gray-800">@{request.username}</div>
                    <div className="text-xs text-slate-500">{request.name}</div>
                  </td>
                  <td className="px-4 py-3">{request.email}</td>
                  <td className="px-4 py-3">{toRoleLabel(request.roleRequested)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(request.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", getStatusBadgeClass(request.status))}>
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right sm:px-6">
                    <div className="flex justify-end">
                      {request.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(request.id)}
                            disabled={updatingId === request.id}
                            className={cn(
                              "inline-flex min-w-[136px] items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
                              "border border-green-200 text-green-700 hover:bg-green-50"
                            )}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            อนุมัติการใช้งาน
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(request.id)}
                            disabled={updatingId === request.id}
                            className={cn(
                              "inline-flex min-w-[120px] items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
                              "border border-red-200 text-red-700 hover:bg-red-50"
                            )}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            ปฏิเสธ
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSuspend(request.id)}
                          disabled={updatingId === request.id}
                          className={cn(
                            "inline-flex min-w-[136px] items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
                            "border border-red-200 text-red-700 hover:bg-red-50"
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ปิดการใช้งาน
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && paginatedRequests.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              ไม่พบรายการสมัครตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-6">
          <span>แสดง {startItem}-{endItem} จาก {filteredAndSortedRequests.length} รายการ</span>
          <span>เรียงตาม {getSortLabel(sortField)} ({sortDirection === "asc" ? "น้อยไปมาก" : "มากไปน้อย"})</span>
        </div>
      </section>

      {filteredAndSortedRequests.length > 0 && (
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {confirmDialog}
    </div>
  );
}
