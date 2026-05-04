"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dropdown } from "@/components/ui/dropdown";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminSectionTabs } from "@/components/features/admin/admin-section-tabs";
import { formatDateTime, toRoleLabel, type SystemRole } from "@/components/features/admin/admin-data";
import adminService, { type AdminManagedUser } from "@/services/admin.service";

const ITEMS_PER_PAGE = 8;

type SortField = "username" | "role" | "createdAt";
type SortDirection = "asc" | "desc";

type RoleFilter = "all" | SystemRole;
type SuperuserFilter = "all" | "yes" | "no";

const ROLE_FILTER_OPTIONS: Array<{ value: RoleFilter; label: string }> = [
  { value: "all", label: "ทุกบทบาท" },
  { value: "nurse", label: "เจ้าหน้าที่ดูแล" },
  { value: "kitchen", label: "เจ้าหน้าที่ครัว" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
];

const SUPERUSER_FILTER_OPTIONS: Array<{ value: SuperuserFilter; label: string }> = [
  { value: "all", label: "ทุกระดับสิทธิ์" },
  { value: "yes", label: "เฉพาะผู้มีสิทธิ์หัวหน้า" },
  { value: "no", label: "เฉพาะผู้ไม่มีสิทธิ์หัวหน้า" },
];

function getRoleBadgeClass(role: SystemRole): string {
  if (role === "admin") return "bg-blue-100 text-blue-700";
  if (role === "kitchen") return "bg-yellow-100 text-yellow-800";
  return "bg-emerald-100 text-emerald-700";
}

function getSortLabel(field: SortField): string {
  if (field === "username") return "ชื่อผู้ใช้";
  if (field === "role") return "บทบาท";
  return "วันที่สร้างบัญชี";
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [superuserFilter, setSuperuserFilter] = useState<SuperuserFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(
        data.filter(
          (user) => user.status === "active" && !user.roleName.toLowerCase().includes("relative")
        )
      );
    } catch {
      showToast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        message: "ไม่สามารถดึงข้อมูลผู้ใช้จากระบบได้",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredAndSortedUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = users.filter((user) => {
      const inSearch =
        normalizedSearch.length === 0 ||
        [user.username, user.name, user.email, toRoleLabel(user.role)]
          .some((field) => field.toLowerCase().includes(normalizedSearch));

      const inRole = roleFilter === "all" || user.role === roleFilter;
      const inSuperuser =
        superuserFilter === "all" ||
        (superuserFilter === "yes" ? user.isSuperuser : !user.isSuperuser);

      return inSearch && inRole && inSuperuser;
    });

    return [...filtered].sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortField === "createdAt") {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * directionFactor;
      }

      const left = String(a[sortField]).toLowerCase();
      const right = String(b[sortField]).toLowerCase();
      return left.localeCompare(right, "th") * directionFactor;
    });
  }, [users, searchTerm, roleFilter, superuserFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredAndSortedUsers.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  const startItem = filteredAndSortedUsers.length === 0 ? 0 : pageStart + 1;
  const endItem = Math.min(pageStart + ITEMS_PER_PAGE, filteredAndSortedUsers.length);

  const totalSuperusers = users.filter((user) => user.isSuperuser).length;

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "createdAt" ? "desc" : "asc");
  };

  const handleToggleSuperuser = async (userId: string) => {
    const target = users.find((user) => user.id === userId);
    if (!target) return;

    if (!target.isSuperuser && target.role !== "nurse") {
      showToast({
        title: "ไม่สามารถดำเนินการได้",
        message: "มอบสิทธิ์หัวหน้าได้เฉพาะเจ้าหน้าที่ดูแลเท่านั้น",
        type: "error",
      });
      return;
    }

    if (!target.staffId) {
      showToast({
        title: "ไม่สามารถดำเนินการได้",
        message: "บัญชีนี้ไม่รองรับการปรับสิทธิ์หัวหน้า",
        type: "error",
      });
      return;
    }

    setUpdatingUserId(userId);
    try {
      const updated = target.isSuperuser
        ? await adminService.revokeSuperuser(target.staffId)
        : await adminService.grantSuperuser(target.staffId);

      setUsers((prev) => prev.map((user) => (user.id === userId ? updated : user)));
      showToast({
        title: "บันทึกสำเร็จ",
        message: `${target.username} ถูก${target.isSuperuser ? "ถอนสิทธิ์หัวหน้า" : "มอบสิทธิ์หัวหน้า"}แล้ว`,
        type: "success",
      });
    } catch {
      showToast({
        title: "บันทึกไม่สำเร็จ",
        message: "ไม่สามารถปรับสิทธิ์หัวหน้าได้",
        type: "error",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find((user) => user.id === userId);
    if (!target) return;

    if (!target.staffId) {
      showToast({
        title: "ไม่สามารถดำเนินการได้",
        message: "บัญชีนี้ไม่รองรับการลบจากหน้านี้",
        type: "error",
      });
      return;
    }

    const isActive = target.status === "active";
    const warningText = isActive 
      ? `⚠️ ผู้ใช้ @${target.username} กำลังใช้งานอยู่ในศูนย์รักษา\n\n` 
      : "";
    
    const confirmMessage = `${warningText}ยืนยันการลบผู้ใช้ @${target.username} ออกจากระบบใช่หรือไม่?\n\nการลบบัญชีนี้จะลบข้อมูลที่เกี่ยวข้องออกจากระบบ`;

    const isConfirmed = await confirm({
      title: "ลบผู้ใช้",
      message: confirmMessage,
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      tone: "danger",
    });
    
    if (!isConfirmed) return;

    setIsDeletingUserId(userId);
    try {
      await adminService.deleteStaff(target.staffId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      showToast({
        title: "ลบผู้ใช้สำเร็จ",
        message: `ลบ @${target.username} ออกจากระบบแล้ว`,
        type: "success",
      });
    } catch {
      showToast({
        title: "ลบผู้ใช้ไม่สำเร็จ",
        message: "ไม่สามารถลบผู้ใช้ออกจากระบบได้",
        type: "error",
      });
    } finally {
      setIsDeletingUserId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-headline-5 font-bold text-gray-800">จัดการผู้ใช้งานระบบ</h2>
          <p className="mt-1 text-sm text-slate-500">มอบสิทธิ์หัวหน้า ถอนสิทธิ์หัวหน้า และลบผู้ใช้ออกจากระบบ</p>
        </div>

        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
          ผู้ที่มีสิทธิ์หัวหน้าทั้งหมด {totalSuperusers} คน
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
            value={superuserFilter}
            onChange={(value) => {
              setSuperuserFilter(value as SuperuserFilter);
              setCurrentPage(1);
            }}
            options={SUPERUSER_FILTER_OPTIONS}
            className="h-10"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">
                  <button type="button" onClick={() => handleSort("username")} className="inline-flex items-center gap-1.5">
                    ชื่อผู้ใช้
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">อีเมล</th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("role")} className="inline-flex items-center gap-1.5">
                    บทบาท
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">สิทธิ์หัวหน้า</th>
                <th className="px-4 py-3 font-medium">
                  <button type="button" onClick={() => handleSort("createdAt")} className="inline-flex items-center gap-1.5">
                    วันที่สร้างบัญชี
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right sm:px-6">การจัดการ</th>
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

              {paginatedUsers.map((user) => {
                const isUpdating = updatingUserId === user.id;
                const isDeleting = isDeletingUserId === user.id;
                const hasStaffLink = Boolean(user.staffId);
                const canManageSuperuser = hasStaffLink && (user.isSuperuser || user.role === "nurse");

                return (
                  <tr key={user.id} className="border-t border-slate-100 text-slate-700">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="font-medium text-gray-800">@{user.username}</div>
                      <div className="text-xs text-slate-500">{user.name}</div>
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", getRoleBadgeClass(user.role))}>
                        {toRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          user.isSuperuser
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {user.isSuperuser ? "หัวหน้าศูนย์" : "ทั่วไป"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(user.createdAt)}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSuperuser(user.id)}
                          disabled={isUpdating || isDeleting || !canManageSuperuser}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
                            user.isSuperuser
                              ? "border border-orange-200 text-orange-700 hover:bg-orange-50"
                              : "border border-blue-200 text-blue-700 hover:bg-blue-50"
                          )}
                        >
                          {user.isSuperuser ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          {user.isSuperuser ? "ถอนสิทธิ์หัวหน้า" : "มอบสิทธิ์หัวหน้า"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isUpdating || isDeleting || !hasStaffLink}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          ลบผู้ใช้
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!isLoading && paginatedUsers.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-6">
          <span>แสดง {startItem}-{endItem} จากทั้งหมด {filteredAndSortedUsers.length} รายการ</span>
          <span>
            เรียงลำดับตาม {getSortLabel(sortField)} ({sortDirection === "asc" ? "น้อยไปมาก" : "มากไปน้อย"})
          </span>
        </div>
      </section>

      {filteredAndSortedUsers.length > 0 && (
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {confirmDialog}
    </div>
  );
}
